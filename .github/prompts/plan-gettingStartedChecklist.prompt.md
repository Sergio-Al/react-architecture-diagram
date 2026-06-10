# Plan: Getting-Started Checklist (local onboarding)

**What**: Add a minimal, dismissible "Getting started" checklist that onboards new users by ticking off four real actions as they perform them — *add a component*, *connect two nodes*, *set a data contract on an edge*, *run a flow simulation*. Completion is **latched** (sticky) and persisted, so it survives reloads and never un-checks. The detection logic is a pure, unit-tested function; a single thin hook subscribes to the existing `diagramStore` + `simulationStore` and latches progress, so **no existing store or action site is modified**. The card renders inside the canvas region (bottom-left), auto-hides for returning users who already have a populated diagram, and disappears once dismissed or fully complete. Scope is deliberately minimal (passive progress display); interactive step actions and a reopen affordance are called out as optional follow-ups.

---

## Phase 1 — Onboarding store + pure step logic + tests

Self-contained and independent — no UI yet. Everything here is unit-testable.

1. **Define step metadata** in a new `src/utils/onboarding.ts`:
   ```ts
   export type OnboardingStepId = 'add-node' | 'connect-nodes' | 'set-contract' | 'run-flow-sim';

   export interface OnboardingStep {
     id: OnboardingStepId;
     label: string;       // "Add your first component"
     hint?: string;       // optional one-liner for Phase-5 step actions
   }

   export const ONBOARDING_STEPS: OnboardingStep[] = [ /* 4 steps, in display order */ ];
   export const ONBOARDING_STEP_IDS = ONBOARDING_STEPS.map(s => s.id);
   ```
2. **Pure evaluator** `evaluateCompletedSteps(nodes, edges, sim)` in the same file — returns the `OnboardingStepId[]` whose conditions are *currently* satisfied (not latched; latching is the store's job):
   - `add-node` → `nodes.some(n => n.type !== 'group' && n.type !== 'comment')` (a real architecture node, not just a container/sticky)
   - `connect-nodes` → `edges.length >= 1`
   - `set-contract` → `edges.some(e => (e.data as ArchitectureEdgeData | undefined)?.dataContract != null)`
   - `run-flow-sim` → `sim.mode === 'flow' && sim.flowPath != null`
   - Signature uses React Flow base `Node[]`/`Edge[]` + a minimal `{ mode, flowPath }` shape (mirror how `src/utils/sequenceDiagram.ts` accepts base types). Keep it side-effect free.
   - Add a small `isAllComplete(completed: Record<OnboardingStepId, boolean>): boolean` helper.
3. **Onboarding store** `src/store/onboardingStore.ts` using the **zustand `persist` middleware** (same pattern as `src/store/themeStore.ts`):
   ```ts
   interface OnboardingState {
     completedSteps: Record<OnboardingStepId, boolean>;
     dismissed: boolean;
     initialized: boolean;                 // false until the first session has run init()
     completeStep: (id: OnboardingStepId) => void;  // one-way latch; idempotent
     dismiss: () => void;
     /** First-run gate: called once per session by the hook. If this is a brand-new
      *  record AND the diagram already has content, auto-dismiss (established user). */
     initialize: (hasExistingContent: boolean) => void;
     reset: () => void;                    // dev/testing: clear all progress
   }
   ```
   - `persist` config: `name: 'architecture-diagram-onboarding'`. Persist only `completedSteps`, `dismissed`, `initialized` (use `partialize`).
   - `completeStep` is a no-op if already `true` (avoids redundant writes / renders).
   - `initialize(hasExistingContent)`: if `initialized` is already `true`, return. Otherwise set `initialized: true`, and if `hasExistingContent` set `dismissed: true`.
   - **Must NOT** be added to `diagramStore` undo/redo history or the diagram persistence blob — it is an independent store (per `CLAUDE.md`).
4. **Unit tests** mirroring `src/store/diagramStore.test.ts` / `src/utils/*.test.ts` style:
   - `src/utils/onboarding.test.ts` — each of the 4 conditions true/false (incl. group/comment nodes not counting, `dataContract` detection, flow-sim latch only when `mode==='flow' && flowPath`), and `isAllComplete`.
   - `src/store/onboardingStore.test.ts` — `completeStep` latches + idempotent; `dismiss`; `reset`; `initialize` auto-dismisses only on a fresh record with existing content and is a no-op afterward; localStorage round-trip (persist write + rehydrate). Clear `localStorage` in `beforeEach`.

**New files:**
- `src/utils/onboarding.ts`
- `src/utils/onboarding.test.ts`
- `src/store/onboardingStore.ts`
- `src/store/onboardingStore.test.ts`

---

## Phase 2 — Progress hook + checklist component + mount

*Depends on Phase 1.*

5. **`src/hooks/useOnboardingProgress.ts`** — the only wiring point:
   - Selectors: `nodes`, `edges` from `useDiagramStore`; `mode`, `flowPath` from `useSimulationStore`; `completeStep`, `initialize` from `useOnboardingStore`.
   - On first mount: call `initialize(hasExistingContent)` where `hasExistingContent` = the diagram already has a real (non-group/comment) node at mount time.
   - In a `useEffect` keyed on the watched values: run `evaluateCompletedSteps(...)` and `completeStep(id)` for any satisfied-but-not-yet-latched step. (Latching lives in the store; the hook just reports.)
   - Pure subscription only — no DOM, no GSAP, no React Flow refs.
6. **`src/components/panels/GettingStartedChecklist.tsx`** — presentational floating card:
   - Reads `completedSteps`, `dismissed` from `useOnboardingStore`; maps over `ONBOARDING_STEPS`.
   - Renders a check (`CheckCircleIcon` solid) vs. empty circle per step; footer `"{done} of {total} done · dismiss anytime"`; `✕` calls `dismiss()`.
   - Floating-card look matched to `SimulationStats.tsx` / `SimulationPanel.tsx`: `bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg`. Tailwind v4, `zinc-*` (never `gray-*`), `cn()` helper, light/dark via existing CSS vars.
   - Self-contained visibility guard: render `null` when `dismissed` or all steps complete (the brief "All done" state is added in Phase 3).
7. **Mount** in `src/components/DiagramEditor.tsx` (the `flex-1 relative overflow-hidden` canvas region, alongside `SimulationPanel`):
   - Call `useOnboardingProgress()` once near the top of the component.
   - Render `<GettingStartedChecklist hidden={showSimulationPanel} />` positioned `absolute bottom-6 left-6 z-30` (below the sim bar's `z-50`, clear of the bottom-center bar, the left `NodePalette` `w-64`, and the right `PropertiesPanel` `w-80`). When `hidden` (sim panel open), render `null` to avoid overlap.

**New files:**
- `src/hooks/useOnboardingProgress.ts`
- `src/components/panels/GettingStartedChecklist.tsx`

**Existing files modified:**
- `src/components/DiagramEditor.tsx` — invoke the hook + render the card.
- `src/components/panels/index.ts` — export the new panel (matches existing barrel).

---

## Phase 3 — Visibility, edge-cases & responsive polish

*Depends on Phase 2.*

8. **"All done" state**: when the last step completes, show a brief celebratory row (e.g. "🎉 You're all set") for ~2.5s, then auto-hide. Keep it CSS/`setTimeout` simple — no GSAP needed. After it hides, treat as dismissed for the session (do not auto-resurface).
9. **Returning-user guard** (verify end-to-end): a user who opens an existing diagram with nodes and has *no* prior onboarding record never sees the card (handled by `initialize(true)` in Phase 1/2). A brand-new empty diagram shows `0 of 4`.

   **Persistence scope (by design, not a bug):** the onboarding record lives in `localStorage`, which is partitioned per browser profile. So in an **incognito window, a different browser, a different device, or after clearing site data**, the record is absent and the checklist can reappear. This is consistent with the rest of the app — the diagram itself (`architecture-diagram`), theme, and AI key are all `localStorage`-backed and equally absent in those contexts. Crucially, an incognito session also starts with an **empty canvas**, so showing "Getting started" there is the *correct* behavior, not a regression. The only edge case — incognito **plus** a diagram loaded via import or a shareable link — is already covered by the returning-user guard (`initialize(hasExistingContent: true)` auto-dismisses). Making "seen onboarding" persist across profiles/devices would require a server-side account (backend + auth), which is **out of scope** for this client-side/local feature and a deliberate non-goal. (Excalidraw, tldraw, and similar local-first tools behave the same way.)
10. **Responsive / 13" check**: card max-width capped (`max-w-[16rem]`) so it never overflows a narrow canvas; confirm it does not collide with the wrapped simulation bar or the panels at 1280×800 with both panels open. (The card is non-modal and `absolute` within the canvas, so it is unaffected by the transformed-ancestor `position:fixed` pitfall that bit the sim bar — no portal needed.)
11. **Manual QA — user-driven** (no automated browser testing). After the build, provide the user a short test script to run themselves at a ~13" width with both panels open, and have them confirm: add a node → step 1 ticks; connect two → step 2; set a contract in the Properties panel → step 3; run a flow sim → step 4 + "all done"; reload → stays dismissed; `useOnboardingStore.getState().reset()` in console brings it back; no overflow/collision with the sim bar or panels.

**Existing files modified:**
- `src/components/panels/GettingStartedChecklist.tsx` (all-done state, max-width).

---

## Phase 4 — Docs

*Depends on Phases 1–3.*

12. **`README.md`** — add a bullet under *Productivity* (near Auto-Save / Undo-Redo): "**Getting-Started Checklist** — a dismissible onboarding card that ticks off your first node, connection, data contract, and simulation."
13. **`.cursor/features.md`** — new subsection (mirror the *Sequence Diagram Export* subsection style): paths, the `OnboardingStepId` union, the four detection signals, the store shape, persistence key, and the latch/returning-user rules.
14. **`.cursor/glossary.md`** — add **Getting-Started Checklist** to the UI Terms table and **onboardingStore** to the Store Terms table.
15. Run `npm run type-check` and `npm run test:run` — all green.

**Existing files modified:**
- `README.md`, `.cursor/features.md`, `.cursor/glossary.md`

---

## Optional enhancements (NOT in minimal scope)

- **Interactive steps**: clicking the next incomplete step triggers/guides the relevant UI (e.g. "Run a flow simulation" opens the simulation panel; "Set a data contract" focuses the Properties panel). Uses the `hint` field already in `OnboardingStep`.
- **Reopen affordance**: a "Getting started" entry under the toolbar `?` / `ShortcutsHelp` (or a small undismiss link) so users who dismissed it can bring it back — calls `onboardingStore.reset()` or a dedicated `reopen()`.
- **Broaden step 4** to count failure/chaos runs as "ran a simulation" if flow-only proves too narrow in practice.

---

## Verification Checklist

### Phase 1 — store + logic
- [ ] `npm run test:run` passes new `onboarding.test.ts` and `onboardingStore.test.ts`
- [ ] `evaluateCompletedSteps` ignores group/comment nodes for `add-node`
- [ ] `completeStep` is idempotent and one-way (deleting nodes does not un-latch)
- [ ] `initialize(true)` on a fresh record sets `dismissed`; `initialize(false)` does not; second call is a no-op
- [ ] Persist round-trip: state survives a simulated reload (localStorage `architecture-diagram-onboarding`)
- [ ] `npm run type-check` clean

### Phase 2 — hook + UI
- [ ] Card appears at bottom-left on a new empty diagram showing `0 of 4`
- [ ] Adding a real node ticks step 1; connecting ticks step 2; setting a contract ticks step 3; running a flow sim ticks step 4
- [ ] Card is `null` while the simulation panel is open (no overlap)
- [ ] `✕` dismisses; card stays gone after reload

### Phase 3 — polish
- [ ] "All done" state shows briefly on the 4th tick, then auto-hides
- [ ] Returning user with an existing populated diagram + no prior record never sees the card
- [ ] **User confirms** at a ~13" width with both panels open: the card neither overflows nor collides with the sim bar/panels, and all four steps tick as performed (manual verification — no automated browser testing)

### Phase 4 — docs
- [ ] README, `features.md`, `glossary.md` updated; `type-check` + `test:run` green

---

## Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Detection wiring | One subscriber hook + pure evaluator | Zero changes to existing stores/action sites; logic stays unit-testable |
| Completion model | Latched (sticky) flags in a dedicated store | Onboarding is "have you ever done X", not "is X true now"; deleting content must not un-check |
| Store location | New `onboardingStore` (not `uiStore`) | `uiStore` is ephemeral; onboarding must persist and stay independent of undo/redo + diagram blob |
| Persistence | zustand `persist` middleware, key `architecture-diagram-onboarding` | Matches `themeStore`; simplest for a flat `{ completedSteps, dismissed, initialized }` shape |
| Returning-user gate | `initialize(hasExistingContent)` + `initialized` flag | Avoids surfacing the checklist to established users without per-action backfill heuristics |
| Placement | `absolute bottom-6 left-6` inside the canvas region, hidden while sim panel open | Clears the bottom-center sim bar and both side panels; non-modal so no `position:fixed`/portal pitfall |
| Step 4 trigger | Flow simulation only (`mode==='flow' && flowPath`) | Matches the checklist copy; failure/chaos broadening left as an optional tweak |
| Scope | Passive progress only in v1 | "Minimal functionality" per the request; interactive steps + reopen are explicit follow-ups |
| Persistence scope | Per-browser-profile `localStorage`; reappears in incognito/other browsers/devices | No account system in local mode; consistent with how the diagram/theme/AI key already persist. Cross-device "seen" would need a backend + auth — a deliberate non-goal here |
