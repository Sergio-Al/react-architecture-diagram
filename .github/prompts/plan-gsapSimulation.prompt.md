# Plan: GSAP Integration — Simulation Mode, Edge Animations & Node Destruction

This plan adds GSAP as the animation engine across the project: replaces existing SVG SMIL/CSS edge animations with GSAP-powered equivalents, introduces a floating simulation panel with request flow tracing and failure simulation, and adds a shatter/explode destruction effect for deleted nodes. Implementation is phased to land incremental value.

**Steps**

## Phase 0 — GSAP Setup & Foundation

1. Install `gsap` and `@gsap/react` packages. No `MotionPathPlugin` registration needed — it's bundled free in GSAP 3.12+, but you **do** need to `gsap.registerPlugin(MotionPathPlugin)` once at app startup.

2. Create `src/lib/gsap.ts` — a central GSAP initialization file that imports `gsap`, `MotionPathPlugin`, and `@gsap/react`'s `useGSAP` hook, registers the plugin, and re-exports everything. All animation code imports from here instead of directly from `gsap`.

3. Add a `useNodeRef` pattern — since React Flow manages node DOM elements internally via its `nodeTypes` registry, each custom node component needs to expose a `ref` to its outer `<div>`. Add a `ref` callback using `useRef` to the outer `<div>` in `ArchitectureNode`, `GroupNode`, and `CommentNode`. These refs will be used by GSAP for destruction and simulation highlight animations.

## Phase 1 — Replace Edge Animations with GSAP

4. Refactor `src/components/edges/ArchitectureEdge.tsx` — replace the animated flow `<g>` block (lines ~155–178):
   - Remove the `<animateMotion>` SMIL elements from both `<circle>` elements.
   - Remove the `animated-edge-flow` CSS class usage.
   - Instead, assign `ref`s to the circle elements and the dashed-path element.
   - Use `useGSAP()` hook inside the component to create a GSAP timeline that:
     - Animates `strokeDashoffset` on the dashed path (replacing the CSS `flowAnimation` keyframe).
     - Uses `MotionPathPlugin` with `motionPath: { path: edgePath, autoRotate: false }` on both circles to move them along the edge path.
   - The timeline should be `repeat: -1` (infinite), and its `timeScale` should be controllable (needed later for simulation speed).

5. Remove the CSS animation definitions from `src/index.css`: delete `--animate-flow`, the `@keyframes flowAnimation` block, and the `.animated-edge-flow` class. Keep `.animated-edge-dot` (drop-shadow filter) since that's a static style.

6. Create a new hook `src/hooks/useEdgeAnimation.ts` that encapsulates the GSAP timeline creation logic for edges. Accepts `edgePath`, `isAnimated`, `protocolColors`, and `speed` as params. Returns refs for the SVG elements. This keeps `ArchitectureEdge.tsx` clean and makes the animation logic reusable.

## Phase 2 — Simulation Store & Floating Panel

7. Create `src/store/simulationStore.ts` — a new Zustand store with:
   - `mode: 'idle' | 'flow' | 'failure'` — current simulation type
   - `isRunning: boolean` — play/pause state
   - `speed: number` — simulation speed multiplier (0.5x, 1x, 2x, 4x)
   - `sourceNodeId: string | null` — the node from which simulation starts
   - `activePathNodeIds: string[]` — nodes currently in the traced path (for highlighting)
   - `activePathEdgeIds: string[]` — edges currently in the traced path
   - `failedNodeIds: string[]` — nodes marked as "down" in failure mode
   - `affectedNodeIds: string[]` — nodes affected by the failure (downstream, computed)
   - `affectedEdgeIds: string[]` — edges broken by the failure
   - `packetPosition: number` — normalized 0..1 position of the simulation packet
   - Actions: `startFlowSimulation(sourceId)`, `startFailureSimulation(failedIds)`, `stop()`, `pause()`, `resume()`, `setSpeed(n)`, `toggleNodeFailure(id)`, `reset()`

8. Create `src/utils/graphTraversal.ts` — pure utility functions for simulation logic:
   - `traceFlowPath(nodes, edges, sourceId): { nodeIds: string[], edgeIds: string[], orderedSteps: Step[] }` — BFS/DFS traversal from a source node, following edge directions. Returns the complete ordered path.
   - `computeBlastRadius(nodes, edges, failedIds): { affectedNodeIds: string[], brokenEdgeIds: string[] }` — given a set of "down" nodes, computes which downstream nodes become unreachable and which edges are broken.
   - `getConnectedEdges(nodeId, edges): Edge[]` — helper.

9. Create `src/components/panels/SimulationPanel.tsx` — a floating overlay panel:
   - **Position**: Bottom-center of the canvas, `fixed` or `absolute` inside the ReactFlow wrapper, `z-50`, rounded with `backdrop-blur`, styled like existing toolbar controls.
   - **Layout**: Horizontal control bar with:
     - Mode selector: "Flow" / "Failure" toggle buttons
     - Play / Pause / Stop buttons (icon buttons)
     - Speed selector: 0.5x, 1x, 2x, 4x dropdown or segmented control
     - Status text: "Select a source node" / "Running from: [Node Label]" / "Click nodes to mark as failed"
   - **Activation**: A new "Simulate" button added to the existing `DiagramEditor.tsx` toolbar (line ~685 area, next to the shortcuts button). Clicking toggles the floating panel.
   - **Collapse behavior**: Panel can be minimized to just a small play button when not actively running.

10. Wire simulation panel into `src/components/DiagramEditor.tsx`:
    - Add `showSimulationPanel` state.
    - When simulation mode is `'flow'`, modify the `onNodeClick` handler: if simulation is in "select source" state, call `startFlowSimulation(node.id)` instead of the normal selection behavior.
    - When simulation mode is `'failure'`, `onNodeClick` calls `toggleNodeFailure(node.id)`.
    - Register keyboard shortcut: `Shift+S` to toggle simulation panel.

## Phase 3 — Simulation Visual Effects (GSAP Animations)

11. Create `src/hooks/useSimulationAnimation.ts` — the main GSAP orchestration hook:
    - **Flow simulation**: When `mode === 'flow'` and `isRunning`:
      - Builds a GSAP `timeline()` that sequences through `orderedSteps`.
      - For each step: animate a packet (a new SVG `<circle>` injected into the React Flow SVG layer) along the edge path using `MotionPathPlugin`, then flash-highlight the destination node.
      - Node highlight: `gsap.to(nodeElement, { boxShadow: '0 0 20px <protocolColor>', duration: 0.3 })` → then revert.
      - Edge highlight: Temporarily increase glow opacity and dot speed on the active edge.
      - Timeline respects `speed` from the store (via `timeline.timeScale(speed)`).
    - **Failure simulation**: When `mode === 'failure'`:
      - Failed nodes get a red pulsing glow: `gsap.to(el, { boxShadow: '0 0 15px rgba(239,68,68,0.6)', repeat: -1, yoyo: true, duration: 0.8 })`.
      - Affected (unreachable) nodes get a desaturated/dimmed effect: `gsap.to(el, { opacity: 0.4, filter: 'grayscale(80%)' })`.
      - Broken edges get a red color override and a "crackle" animation (rapid strokeDashoffset jitter).
    - Cleanup: `useGSAP`'s context-based cleanup ensures all animations are killed when simulation stops.

12. Modify `src/components/nodes/ArchitectureNode.tsx` to read simulation state:
    - Add a data attribute `data-node-id={id}` on the outer `<div>` so the simulation hook can query for node DOM elements via `document.querySelector('[data-node-id="..."]')`. This avoids passing refs through React Flow's node type system.
    - Add conditional classes: when `simulationStore.failedNodeIds.includes(id)`, add a visual indicator (red border + skull/X icon overlay). When `simulationStore.activePathNodeIds.includes(id)`, add a highlight ring.

13. Modify `src/components/edges/ArchitectureEdge.tsx` to support simulation overrides:
    - Add `data-edge-id={id}` attribute to the main `<g>` or `<path>` element.
    - When `simulationStore.activePathEdgeIds.includes(id)`, boost the glow and speed.
    - When `simulationStore.affectedEdgeIds.includes(id)`, override color to red.

## Phase 4 — Node Destruction Animation (Shatter/Explode)

14. Create `src/hooks/useDestroyAnimation.ts` — the shatter effect hook:
    - **Approach**: When a node is about to be deleted, instead of immediately removing it from state:
      1. Capture the node's position and dimensions via `getBoundingClientRect()`.
      2. Create a temporary overlay `<div>` (clone of the node) positioned identically in the viewport, appended to a dedicated animation overlay container.
      3. Remove the actual node from React Flow state immediately (so graph state is clean).
      4. On the overlay clone, run the shatter animation:
         - Use `gsap.timeline()` to:
           a. Split the clone into a grid of fragments (e.g., 3×3 or 4×4 `<div>`s, each with `overflow: hidden` and a `background` set via `clip-path` or `background-position` to show its portion of the original node).
           b. Animate each fragment with staggered: `x: random(-150, 150)`, `y: random(-200, 50)`, `rotation: random(-180, 180)`, `scale: 0`, `opacity: 0`, `duration: 0.6`, `ease: 'power2.out'`.
           c. Connected edges fade out simultaneously: query edge elements by `data-edge-id` and `gsap.to(el, { opacity: 0, duration: 0.3 })`.
         - On complete: remove the overlay clone from DOM.
    - This "clone and animate" approach avoids fighting React Flow's rendering lifecycle.

15. Add a persistent animation overlay container to `src/components/DiagramEditor.tsx`:
    - A `<div id="animation-overlay" className="fixed inset-0 pointer-events-none z-[100]" />` rendered alongside the ReactFlow canvas. This is where shatter clone fragments will be temporarily injected and animated.

16. Create `src/store/animationStore.ts` — lightweight store for animation orchestration:
    - `pendingDeletions: Set<string>` — node IDs currently being animated out.
    - `requestDelete(id)` — adds to pending, triggers the animation hook.
    - `confirmDelete(id)` — called when animation completes, removes from pending, then calls `diagramStore.deleteNode(id)`.
    - This ensures the node stays in React Flow's state during the animation (so we can read its position) but is visually replaced by the clone.

17. Update deletion call sites to use animated deletion:
    - `src/components/panels/PropertiesPanel.tsx` — the delete button for nodes (~line where `deleteNode(id)` is called) should call `animationStore.requestDelete(id)` instead.
    - `src/components/DiagramEditor.tsx` — the `Delete`/`Backspace` keyboard handler should route through `requestDelete` for nodes.
    - `deleteSelectedNodes()` — wrap to iterate each selected node through the animation pipeline with stagger.

## Phase 5 — Polish & Integration

18. Edge animation speed control — connect the `speed` value from `simulationStore` to the GSAP timelines in `useEdgeAnimation`. When simulation is running, edge animations on active paths speed up to match simulation speed. Inactive edges slow down or pause.

19. Add subtle ambient effects during simulation:
    - Dim non-active nodes/edges to 60% opacity when flow simulation is running (focus attention on the traced path).
    - Restore on simulation stop.

20. Update `src/types/index.ts` — add simulation-related types:
    - `SimulationMode`, `SimulationStep`, `FlowPath` types.
    - Extend `ArchitectureNodeData` with optional `simulationState?: 'source' | 'active' | 'failed' | 'affected' | null` (transient, not persisted).

21. Update the Navbar or toolbar to show a simulation mode indicator (small pulsing dot or badge) when simulation is active, so it's obvious to the user the app is in simulation mode.

22. Ensure simulation state is **not** persisted to localStorage and **not** included in undo/redo history. Add exclusion in `saveDiagram` and `saveToHistory` if needed (shouldn't be an issue since it's a separate store).

---

## Verification

- Run `npm run dev` and verify existing edge animations work identically after GSAP migration (same visual appearance, same protocol colors).
- Test flow simulation: create a chain of 3+ nodes with edges, click first node as source, verify the packet animates along each edge in sequence.
- Test failure simulation: mark a node as failed, verify downstream nodes dim and edges turn red.
- Test shatter animation: delete a node, verify fragments explode outward and connected edges fade before being removed.
- Test keyboard shortcuts still work (Delete, Ctrl+Z undo after animated deletion).
- Test simulation doesn't interfere with undo/redo or localStorage persistence.
- Run `npm run test` to verify existing tests still pass.

## Decisions

- **Clone-and-animate for destruction** instead of animating React Flow's actual DOM nodes — avoids race conditions with React reconciliation and React Flow's internal state.
- **Separate `simulationStore`** instead of extending `diagramStore` — keeps simulation state ephemeral and clean, avoids polluting undo/redo history.
- **`data-node-id` / `data-edge-id` attributes** for GSAP targeting instead of passing refs through React Flow — simpler integration with React Flow's sealed component lifecycle.
- **GSAP replaces all edge animations** (not coexist) — one animation system is easier to maintain and allows unified speed/timeline control during simulation.

## New Files

| File | Purpose |
|------|---------|
| `src/lib/gsap.ts` | GSAP initialization, plugin registration, re-exports |
| `src/hooks/useEdgeAnimation.ts` | GSAP edge animation timeline hook |
| `src/hooks/useSimulationAnimation.ts` | GSAP simulation orchestration hook |
| `src/hooks/useDestroyAnimation.ts` | GSAP shatter/explode destruction hook |
| `src/store/simulationStore.ts` | Zustand store for simulation state |
| `src/store/animationStore.ts` | Zustand store for animation orchestration |
| `src/utils/graphTraversal.ts` | BFS/DFS path tracing & blast radius computation |
| `src/components/panels/SimulationPanel.tsx` | Floating simulation control panel |

## Modified Files

| File | Changes |
|------|---------|
| `package.json` | Add `gsap`, `@gsap/react` dependencies |
| `src/index.css` | Remove `flowAnimation` keyframes, `--animate-flow`, `.animated-edge-flow` class |
| `src/components/edges/ArchitectureEdge.tsx` | Replace SMIL/CSS animations with GSAP via `useEdgeAnimation`, add `data-edge-id` |
| `src/components/nodes/ArchitectureNode.tsx` | Add `data-node-id`, add ref, read simulation state for visual indicators |
| `src/components/nodes/GroupNode.tsx` | Add `data-node-id`, add ref |
| `src/components/nodes/CommentNode.tsx` | Add `data-node-id`, add ref |
| `src/components/DiagramEditor.tsx` | Add simulation panel toggle, animation overlay div, wire simulation click handlers, add `Shift+S` shortcut |
| `src/components/panels/PropertiesPanel.tsx` | Route node deletion through `animationStore.requestDelete()` |
| `src/types/index.ts` | Add `SimulationMode`, `SimulationStep`, `FlowPath` types |
