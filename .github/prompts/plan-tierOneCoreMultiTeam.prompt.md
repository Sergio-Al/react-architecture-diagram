# Plan: Tier 1 Multi-Team Infrastructure (NestJS + PostgreSQL + Yjs)

**What**: Add a NestJS + PostgreSQL backend (separate repo), a multi-diagram workspace with a Projects → Diagrams navigation layer, and real-time collaborative editing via Yjs + WebSocket. The frontend replaces `localStorage` with API calls and adds React Router, while keeping `localStorage` as an offline fallback.

---

## Phase 1 — Backend Foundation

**New repo: `architecture-diagram-api`**

1. Scaffold NestJS: `nest new architecture-diagram-api`
2. Install: `@nestjs/typeorm typeorm pg class-validator class-transformer @nestjs/config`
3. Add `docker-compose.yml` (postgres:16 + adminer) and `.env.example`
4. Create `DatabaseModule` wiring TypeORM to PostgreSQL via `DATABASE_URL`
5. **`Project` entity** — `id (uuid pk)`, `name`, `description?`, `color?`, `createdAt`, `updatedAt`
6. **`Diagram` entity** — `id (uuid pk)`, `projectId (FK)`, `name`, `description?`, `data (jsonb)`, `thumbnail?`, `version int`, `createdAt`, `updatedAt`
7. **`ProjectsModule`** — full CRUD + `GET /api/projects/:id/diagrams`
8. **`DiagramsModule`** — `POST`, `GET`, `PATCH`, `DELETE`, plus `PUT /api/diagrams/:id/thumbnail`
9. Enable CORS for `localhost:5173` (configurable via env), add global `ValidationPipe`
10. Wire TypeORM migrations

**API surface:**
```
GET/POST              /api/projects
GET/PATCH/DELETE      /api/projects/:id
GET                   /api/projects/:id/diagrams
POST                  /api/projects/:projectId/diagrams
GET/PATCH/DELETE      /api/diagrams/:id
PUT                   /api/diagrams/:id/thumbnail
```

**New repo files:**
- `src/projects/project.entity.ts`, `projects.controller.ts`, `projects.service.ts`, `dto/`
- `src/diagrams/diagram.entity.ts`, `diagrams.controller.ts`, `diagrams.service.ts`, `dto/`
- `docker-compose.yml`, `.env.example`, `README.md`

---

## Phase 2 — Real-time Collaboration (Yjs + WebSocket gateway)

*Depends on Phase 1*

11. Install: `yjs y-protocols lib0 @nestjs/websockets @nestjs/platform-socket.io`
12. Create **`CollaborationGateway`** (WebSocket):
    - Room = `diagramId`
    - Implements y-websocket sync + awareness protocols (`sync`, `update`, `queryAwareness`)
    - Persists Yjs binary update chunks to a `yjs_updates` table (`diagramId`, `update bytea`, `createdAt`)
    - On new client join: replay all stored updates (state vector sync)
13. Periodic compaction: merge accumulated Yjs updates, write canonical JSON back to `diagrams.data`
14. Add `YjsUpdateEntity` and `CollaborationModule`

**New repo files:**
- `src/collaboration/collaboration.gateway.ts`
- `src/collaboration/collaboration.module.ts`
- `src/collaboration/yjs-update.entity.ts`

---

## Phase 3 — Frontend Routing + Projects UI

*Can start in parallel with Phase 1 after API contract is finalized*

15. Install: `react-router-dom@6`, `@tanstack/react-query`
16. Create `src/services/api.ts` — typed fetch wrapper for all API calls (projects + diagrams)
17. Create `src/store/workspaceStore.ts` — tracks `currentProjectId`, `currentDiagramId`
18. Add routes in `main.tsx`:
    - `/` → `ProjectsPage`
    - `/projects/:projectId` → `ProjectPage`
    - `/projects/:projectId/diagrams/:diagramId` → existing `App` (DiagramEditor wrapper)
19. Build `src/pages/ProjectsPage.tsx` — project cards grid, "New Project" button, rename/delete menu
20. Build `src/pages/ProjectPage.tsx` — diagram cards with thumbnail previews, "New Diagram" button
21. Build `src/components/workspace/ProjectCard.tsx` and `DiagramCard.tsx`
22. Build `src/components/workspace/CreateProjectDialog.tsx` and `CreateDiagramDialog.tsx`
23. Update `src/components/Navbar.tsx` — breadcrumb (Projects › ProjectName › DiagramName) + back nav

**Existing repo files modified:**
- `src/main.tsx` — add `BrowserRouter` + route definitions
- `src/App.tsx` — becomes the diagram route component (minimal wrapper)
- `src/components/Navbar.tsx` — add breadcrumb

**Existing repo files created:**
- `src/services/api.ts`
- `src/store/workspaceStore.ts`
- `src/pages/ProjectsPage.tsx`
- `src/pages/ProjectPage.tsx`
- `src/components/workspace/ProjectCard.tsx`
- `src/components/workspace/DiagramCard.tsx`
- `src/components/workspace/CreateProjectDialog.tsx`
- `src/components/workspace/CreateDiagramDialog.tsx`

---

## Phase 4 — API + Yjs Integration into `diagramStore`

*Depends on Phase 3 + Phase 2*

24. Modify `src/store/diagramStore.ts`:
    - `loadDiagram()` → `GET /api/diagrams/:id`
    - `saveDiagram()` → debounced `PATCH /api/diagrams/:id` (keep localStorage as write-through cache / offline fallback)
25. Add Yjs sync to `diagramStore.ts`:
    - Install frontend: `yjs y-websocket`
    - `initCollaboration(diagramId)` creates a `Y.Doc` + `WebsocketProvider` pointing at `WS /collaboration/:diagramId`
    - Nodes/edges bound to `Y.Array`/`Y.Map`; Yjs observer → Zustand; Zustand mutations → Yjs doc (loop-guarded with a `_isApplyingRemote` flag)
26. Build `src/hooks/useCollaboration.ts` — manages provider lifecycle, exposes `connectedUsers` list
27. Build `src/components/ui/CollaboratorBadges.tsx` — avatar initials in Navbar for online users
28. Build `src/components/ui/CollaboratorCursors.tsx` — SVG overlay for remote cursor positions (Yjs awareness protocol)
29. Thumbnail capture: after `saveDiagram()` succeeds, debounce `PUT /api/diagrams/:id/thumbnail` using existing `generatePreviewPng()` utility

**Existing repo files modified:**
- `src/store/diagramStore.ts`

**Existing repo files created:**
- `src/hooks/useCollaboration.ts`
- `src/components/ui/CollaboratorBadges.tsx`
- `src/components/ui/CollaboratorCursors.tsx`

---

## Verification Checklist

### Backend (Phase 1)
- [ ] `docker compose up -d` starts Postgres; API responds on `localhost:3000`
- [ ] `POST /api/projects` creates a project; `GET /api/projects` returns it
- [ ] `POST /api/projects/:id/diagrams` with `DiagramData` payload persists to DB
- [ ] `PATCH /api/diagrams/:id` with new node bumps `version`, DB updated

### Real-time (Phase 2)
- [ ] Two WebSocket clients connecting to same `diagramId` room stay in sync
- [ ] Yjs updates are persisted to `yjs_updates` table; new join replays them correctly
- [ ] `diagrams.data` JSON is updated on periodic flush/compaction

### Frontend (Phase 3)
- [ ] `/` renders Projects page; "New Project" dialog creates and navigates
- [ ] `/projects/:id` renders diagram cards with thumbnails
- [ ] `/projects/:id/diagrams/:id` opens full DiagramEditor; breadcrumb shows correct path

### Integration (Phase 4)
- [ ] Editing diagram nodes saves to PostgreSQL (confirm via network tab + DB query)
- [ ] Refreshing the page reloads diagram data from API, not only localStorage
- [ ] Opening same diagram URL in two tabs: node drag in tab A appears in tab B in real time
- [ ] Remote cursor overlay appears in tab B when tab A is moving the mouse
- [ ] Thumbnail `PUT` fires after save; diagram card shows updated preview

---

## Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Backend location | Separate repo `architecture-diagram-api` | Independent deploy, clear separation |
| ORM | TypeORM | Native NestJS integration, decorator-based |
| Real-time protocol | Yjs + y-websocket | Conflict-free concurrent edits (CRDT); standard in collaborative tools |
| Yjs persistence | Binary chunks in `yjs_updates` table + periodic compaction | Efficient incremental sync; canonical JSON for non-Yjs consumers |
| localStorage | Write-through cache / offline fallback | Preserves current offline behaviour; API is source of truth |
| Auth | Deferred | Data model is auth-ready (add `userId`/`teamId` FK later without migrations) |
| Diagram `data` column | `jsonb` | Fast query over diagram content if needed; plays well with TypeORM |
| Thumbnail storage | Base64 data URL in `text` column | Simplest approach; can migrate to object storage (S3) later |
