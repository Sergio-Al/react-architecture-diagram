# Plan: Orthogonal Edge Reshaping

**What**: Make the existing `'step'` edge style (the default `getSmoothStepPath` route in `ArchitectureEdge`) render as a **rounded orthogonal path built from explicit waypoints** stored in `edge.data.waypoints`, and let the user **reshape** it by dragging blue square handles at each segment midpoint when the edge is selected — mirroring Overflow's "Reshaping Orthogonal Edges". The `'bezier'` style is untouched. The orthogonal path string is fed straight into the existing `<BaseEdge path={...}>`, so the GSAP flow/simulation animations (which follow the first `path[d]` in the edge group) keep working with no animation-code changes. Waypoints are absolute flow coordinates pinned in canvas space — when a connected node moves, the bends stay put and the port-stub segments stretch/re-orthogonalize to follow. Handle styling defaults live in `constants/index.ts`; snap-to-grid + grid size are global toggles in `uiStore`.

---

## Phase 1 — Orthogonal path engine + types (no UI)

Pure, testable foundation. After this phase `'step'` edges render as rounded orthogonal paths from an (initially empty) waypoint list and all animations still work — but nothing is draggable yet.

1. **`src/types/index.ts`** — add a waypoint type and extend edge data:
   ```ts
   export type EdgeWaypoint = { x: number; y: number }; // absolute flow coords
   ```
   Add `waypoints?: EdgeWaypoint[]` to `ArchitectureEdgeData` (line ~117). It rides the existing `& Record<string, unknown>`, so it persists, undoes, and serializes to the API for free.

2. **`src/utils/orthogonalPath.ts`** (new) — pure path engine, no React/GSAP imports:
   - `getOrthogonalPath(params): { path: string; labelX: number; labelY: number; points: EdgeWaypoint[] }`
     where `params = { sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, waypoints?, borderRadius, stubLength }`.
   - Algorithm:
     1. Build port stubs: `s0 = {sourceX, sourceY}`, `s1 = s0 + stubLength · dir(sourcePosition)`; `t1 = t0 + stubLength · dir(targetPosition)`, `t0 = {targetX, targetY}`.
     2. Raw polyline = `[s0, s1, ...waypoints, t1, t0]`.
     3. **Orthogonalize**: walk consecutive points; whenever two are not axis-aligned, insert one L-corner (`{x: a.x, y: b.y}` or `{x: b.x, y: a.y}`, chosen to keep the turn 90° relative to the incoming direction). This guarantees a valid orthogonal polyline even after a node drag misaligns the stubs.
     4. **Collinear cleanup**: drop redundant points where three consecutive points are colinear.
     5. **Rounded corners**: emit `M … L … Q …` (quarter-arc per vertex, radius = `min(borderRadius, half the shorter adjacent segment)`) — the standard smoothstep rounding technique. Sharp corners fall out naturally when radius collapses to 0.
     6. `labelX/labelY` = midpoint of the middle segment of the final polyline.
   - `getDefaultWaypoints(params): EdgeWaypoint[]` — returns the interior bend points of the auto-orthogonalized route (used later to "materialize" waypoints on first drag).
   - `simplifyWaypoints(points): EdgeWaypoint[]` — strips colinear/duplicate waypoints (used on drag-commit).

3. **`src/utils/orthogonalPath.test.ts`** (new) — vitest cases: straight (same axis) → single line; L-route; default 2-bend S-route; waypoint insertion keeps all segments axis-aligned; rounded radius clamps on short segments; `labelX/labelY` lands on the path; `simplifyWaypoints` removes a colinear midpoint.

4. **`src/components/edges/ArchitectureEdge.tsx`** — branch the path computation (line ~49):
   - Keep `getBezierPath` for `edgeStyle === 'bezier'`.
   - For `'step'`, call `getOrthogonalPath({ …, waypoints: edgeData?.waypoints, borderRadius: EDGE_HANDLE_CONFIG.borderRadius, stubLength: EDGE_HANDLE_CONFIG.stubLength })` and use its `path`/`labelX`/`labelY`. Keep the returned `points` in a ref/local for Phase 3.
   - No other changes: `<BaseEdge path={edgePath}>`, the animated-overlay `<path d={edgePath}>`, the severed/highlight overlays, and bidirectional markers all consume the same `edgePath` string unchanged.

**New files:**
- `src/utils/orthogonalPath.ts`
- `src/utils/orthogonalPath.test.ts`

**Existing files modified:**
- `src/types/index.ts`
- `src/components/edges/ArchitectureEdge.tsx`

---

## Phase 2 — Handle config + global snap settings

*Depends on Phase 1*

Centralize handle styling and wire the global snap-to-grid controls.

5. **`src/constants/index.ts`** — add next to `EDGE_STYLES`/`PROTOCOL_CONFIG` (line ~362):
   ```ts
   export const EDGE_HANDLE_CONFIG = {
     handleSize: 10,                       // px (screen-space), matches Overflow's handlerSize
     handleColor: '#3b82f6',               // blue-500 — design-system accent
     handleColorHover: '#60a5fa',          // blue-400
     borderRadius: 8,                      // orthogonal corner radius
     stubLength: 20,                       // min port-stub length before first/last bend
   } as const;
   ```
   (Theme-neutral: blue reads on both zinc-dark and light canvases, matching the screenshot.)

6. **`src/store/uiStore.ts`** — extend `UIState`:
   ```ts
   snapToGridEnabled: boolean;   // default false
   gridSize: number;             // default 10 (matches DiagramEditor snapGrid={[10,10]})
   toggleSnapToGrid: () => void;
   setGridSize: (n: number) => void;
   ```

7. **`src/components/Navbar.tsx`** — beside the existing edge-style toggle (line ~260):
   - Update the edge-style tooltip wording: `Square` → `Orthogonal (reshapable)`.
   - Add a small snap-to-grid toggle button (grid icon) bound to `toggleSnapToGrid`, active-styled when `snapToGridEnabled`. Tooltip: `Snap reshaping to grid`.

**Existing files modified:**
- `src/constants/index.ts`
- `src/store/uiStore.ts`
- `src/components/Navbar.tsx`

---

## Phase 3 — Draggable reshape handles

*Depends on Phase 2*

The interactive core. Handles appear only when the edge is selected and `edgeStyle === 'step'`.

8. **`src/components/edges/EdgeReshapeHandles.tsx`** (new) — renders/handles the drag:
   - Props: `{ edgeId, points, onDraft, onCommit }` where `points` is the orthogonalized polyline from `getOrthogonalPath`.
   - Renders an SVG `<rect>` at the midpoint of each **movable** segment (every segment except the two terminal port stubs `s0→s1` and `t1→t0`). Size `EDGE_HANDLE_CONFIG.handleSize / zoom` so it stays constant on screen; fill `handleColor`; `className="nodrag nopan"`; `style={{ pointerEvents: 'all', cursor: horizontal ? 'ns-resize' : 'ew-resize' }}`.
   - Drag via pointer events (`onPointerDown` → `setPointerCapture`, `onPointerMove`, `onPointerUp`):
     - Convert with `useReactFlow().screenToFlowPosition({ x: e.clientX, y: e.clientY })`.
     - Horizontal segment → change `y`; vertical segment → change `x`.
     - If `snapToGridEnabled`, round the changed coord to nearest `gridSize`.
     - **Interior segment** (both endpoints are user waypoints) → translate both endpoints.
     - **Terminal-adjacent segment** (one endpoint is the auto stub `s1`/`t1`) → insert a pair of waypoints so the port stub is preserved (the classic "split on drag" so the source/target attachment never detaches).
     - During the drag, call `onDraft(nextWaypoints)` for live preview (no store write). On `pointerUp`, `simplifyWaypoints` then `onCommit(nextWaypoints)`.
   - `stopPropagation()` on pointer-down so React Flow doesn't pan/box-select/drag the edge.

9. **`src/components/edges/ArchitectureEdge.tsx`** — integrate handles:
   - Hold `draftWaypoints` in `useState`; the effective waypoints fed to `getOrthogonalPath` are `draftWaypoints ?? edgeData?.waypoints`, so the `BaseEdge` path (and therefore the live animation) reshapes in real time while dragging.
   - When `draftWaypoints` is empty/undefined on first drag, seed from `getDefaultWaypoints(...)` so the user grabs the current visible route.
   - Render `<EdgeReshapeHandles>` inside the edge `<g>` only when `selected && edgeStyle === 'step'`. `onCommit={(wp) => { updateEdgeData(id, { waypoints: wp }); setDraftWaypoints(undefined); }}`.

**New files:**
- `src/components/edges/EdgeReshapeHandles.tsx`

**Existing files modified:**
- `src/components/edges/ArchitectureEdge.tsx`

---

## Phase 4 — Persistence, reset, node-move pinning & polish

*Depends on Phase 3*

10. **Persistence (verify, no new code path):** `updateEdgeData(id, { waypoints })` already calls `saveToHistory()` + `debouncedSave()` (`diagramStore.ts:756`), so waypoints land in localStorage, the API `data` JSONB, and undo/redo automatically. Confirm a reshaped edge survives reload and undo/redo.

11. **Node-move pinning:** no per-frame code needed — because waypoints are absolute and `sourceX/Y`,`targetX/Y` arrive live from React Flow, the `orthogonalize` + `simplifyWaypoints` steps in `getOrthogonalPath` repair the stubs every render: bends stay pinned, stubs stretch. Add a guard in the engine so a node dragged *past* a waypoint produces a clean re-route (collapse degenerate zero-length / backtracking segments) rather than a kinked path.

12. **`src/store/diagramStore.ts`** — add `resetEdgeShape(id: string)` that sets `data.waypoints` back to `undefined` (since `updateEdgeData` merges and can't clear), with `saveToHistory()` + `debouncedSave()`.

13. **`src/components/panels/PropertiesPanel.tsx`** — in the edge section (line ~811), add a small **"Reset shape"** button (visible only when `edgeData?.waypoints?.length`) calling `resetEdgeShape(id)`; optionally show the waypoint count. Also support **double-click a handle** in `EdgeReshapeHandles` to delete just that waypoint (re-straightening one bend).

14. **Docs:** note for follow-up — run the `sync-readme` skill if the README's edge-style table needs the "orthogonal/reshapable" wording; not required for the feature to ship.

**Existing files modified:**
- `src/store/diagramStore.ts`
- `src/components/panels/PropertiesPanel.tsx`
- `src/components/edges/EdgeReshapeHandles.tsx` (double-click delete)

---

## Verification Checklist

### Engine (Phase 1)
- [ ] `npm run test:run` passes the new `orthogonalPath.test.ts` (straight, L, S-route, insertion stays axis-aligned, radius clamp, label on path, simplify).
- [ ] `npm run type-check` clean after the `ArchitectureEdgeData.waypoints` addition.
- [ ] A `'step'` edge renders as a rounded orthogonal path; toggling to `'bezier'` in the Navbar still gives curves.
- [ ] An **animated** `'step'` edge: GSAP dots travel along the orthogonal route (not a straight diagonal) — confirms `BaseEdge` path reuse.
- [ ] Run a flow simulation over a `'step'` edge: the simulation packet follows the orthogonal path (`getEdgePath` picks the orthogonal `path[d]`).

### Config (Phase 2)
- [ ] Snap-to-grid toggle appears in the Navbar and flips `uiStore.snapToGridEnabled`.
- [ ] Handle color/size come from `EDGE_HANDLE_CONFIG` (change the constant → handles update).

### Reshaping (Phase 3)
- [ ] Selecting a `'step'` edge shows blue square handles at each movable segment midpoint; deselecting hides them.
- [ ] Dragging a horizontal segment moves it vertically; a vertical segment moves horizontally; the path stays orthogonal with rounded corners.
- [ ] Dragging a segment next to the source/target keeps the edge attached to the port (waypoints inserted, no detach).
- [ ] With snap-to-grid on, dragged segments snap to multiples of `gridSize`.
- [ ] Dragging a handle does **not** pan the canvas or box-select.
- [ ] The animated/simulation dot follows the reshaped path live while dragging.

### Persistence & polish (Phase 4)
- [ ] Reshape an edge, reload the page → the shape is restored from localStorage/API.
- [ ] Undo (⌘Z) reverts a reshape; redo reapplies it.
- [ ] Move a connected node → bends stay pinned in canvas space, port stubs stretch and re-orthogonalize cleanly.
- [ ] "Reset shape" in the Properties panel clears waypoints back to the auto route.
- [ ] Double-clicking a single handle removes that one bend.
- [ ] Export to PNG/PDF renders the orthogonal shape (uses the SVG `d`).

---

## Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Rollout model | Replace the existing `'step'` style | No new global mode; step edges simply gain orthogonal routing + handles. `'bezier'` stays a clean escape hatch. |
| Waypoint storage | `edge.data.waypoints: {x,y}[]` (absolute flow coords) | Rides existing `& Record<string,unknown>`; auto-persists via `updateEdgeData`→`saveToHistory`→`debouncedSave` to localStorage, API JSONB, and undo/redo — zero store plumbing. |
| Path generation | Custom pure `getOrthogonalPath` util (not React Flow's `getSmoothStepPath`) | RF's helper computes its own bends and can't honor explicit waypoints; a pure util is unit-testable and reused for label/handle placement. |
| Animation compatibility | Feed the orthogonal `d` into the existing `<BaseEdge>` | `useEdgeAnimation` and `useSimulationAnimation.getEdgePath` follow the first `path[d]` — reusing it means **no GSAP/simulation changes**. |
| Node-move behavior | Pin waypoints in canvas space; re-orthogonalize stubs each render | Matches Overflow and most diagram tools; preserves the user's manual bends. No per-frame listener needed since RF supplies live source/target coords. |
| Corner style | Rounded (configurable `borderRadius`, clamps to sharp) | Matches the Overflow screenshot and the app's existing smoothstep aesthetic. |
| Handle rendering | SVG `<rect>` inside the edge `<g>` (flow space), sized `/zoom` | Lives in the same coordinate system as the path (no manual screen↔flow per frame except the active drag); constant on-screen size; mirrors Overflow's blue squares. |
| Handle config location | `EDGE_HANDLE_CONFIG` in `constants/index.ts`; snap/gridSize in `uiStore` | Styling is a design-system constant; snap-to-grid is a session UI preference, consistent with the existing `edgeStyle` toggle. |
| Live drag state | Local `draftWaypoints` state, commit on `pointerUp` | Avoids a Zustand write (and full re-render + debounced save) on every `pointermove`; one history entry per reshape. |
| Terminal-segment drag | Insert a waypoint pair to preserve the port stub | Prevents the edge from detaching from the source/target port — standard orthogonal-reshape behavior. |
