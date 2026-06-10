# Simulation Enhancements — Priority Ranking

Feature enhancements to make the GSAP simulation mode more detailed and realistic.

---

## P0 — High Impact, Low Effort

### 1. Animated Packet Traveling Along Edges
- Inject a visible "packet" dot (SVG `<circle>`) into the React Flow SVG layer during flow simulation
- Animate it along each edge path using `MotionPathPlugin` — currently nodes highlight but no packet visually travels the edge
- Color the packet by protocol (blue for HTTP, green for gRPC, orange for SQL, etc.)
- Scale/pulse the packet on arrival at each node

### 2. Non-Active Node/Edge Dimming During Flow Simulation
- When flow simulation is running, dim all nodes and edges that are **not** part of the active path to 30–40% opacity
- Currently only implemented via CSS classes — enhance with smooth GSAP `opacity` + `filter: grayscale()` transitions
- Restore all elements on simulation stop

---

## P1 — High Impact, Medium Effort

### 3. Step-by-Step Debugger Mode
- Add a "Step" button to the SimulationPanel (next to Play/Pause)
- Each click advances the flow simulation by one edge/node hop
- Highlight the current step with a stronger glow, show step number badge
- Display a tooltip or info card showing: source node → edge protocol → destination node
- Allow stepping backward as well

### 4. Failure Cascade Animation (Domino Effect)
- Instead of instantly marking all affected nodes, animate the failure propagation wave
- Start from the failed node, ripple outward edge-by-edge with a timed delay (e.g., 300ms per hop)
- Each newly affected node gets a red flash → then dims to grayscale
- Each broken edge gets a "snap" animation (brief scale pulse then red override)

### 5. Simulation Stats Panel
- Floating overlay or sidebar section showing real-time simulation metrics:
  - **Flow mode**: Total hops, estimated latency sum, protocols used, path length
  - **Failure mode**: Number of failed nodes, number of affected nodes, percentage of architecture impacted, list of broken edges
- Update live as the simulation runs

---

## P2 — Medium Impact, Medium Effort

### 6. Branching & Parallel Path Support in BFS
- Current `traceFlowPath` follows a single BFS path — enhance to detect and visualize branching
- When a node has multiple outgoing edges, animate packets forking into parallel paths
- Use different packet colors or opacity for each branch
- Show merge points where branches converge

### 7. Latency Simulation with Cumulative Counter
- Allow users to assign latency values to edges (e.g., via edge data or a quick input)
- During flow simulation, show a running cumulative latency counter in the SimulationPanel
- Animate the packet speed proportionally — slower on high-latency edges, faster on low-latency
- Highlight bottleneck edges (highest latency) with a warning color

### 8. Request-Response Round Trip
- After the flow packet reaches the terminal node, animate a **return journey** back to the source
- Use a different visual (e.g., dashed packet, different color) for the response
- Show the full round-trip time in the stats panel
- Supports protocols like HTTP (request/response) vs. events/messaging (fire-and-forget based on protocol type)

---

## P3 — Nice to Have, Higher Effort

### 9. Scenario Presets (Save/Load)
- Allow users to save simulation configurations:
  - Flow mode: source node + speed + path configuration
  - Failure mode: set of failed nodes
- Store as named presets in localStorage or as part of diagram export
- Quick-select dropdown in the SimulationPanel
- Pre-built templates: "Single point of failure", "Full path trace", "Database outage"

### 10. Chaos Mode (Random Failure & Network Partition)
- "Chaos Engineering" simulation mode:
  - Randomly fails 1–N nodes at configurable intervals
  - Animates the cascading impact each time
  - Shows a timeline/log of events
- Network partition simulation: split the graph into two disconnected halves, show which services lose connectivity
- Configurable parameters: failure probability, interval, max simultaneous failures

---

## Implementation Order Recommendation

| Phase | Features | Estimated Effort |
|-------|----------|-----------------|
| Next sprint | P0: #1 Animated Packet, #2 Dimming | 1–2 days |
| Sprint +1 | P1: #3 Step Debugger, #4 Failure Cascade | 2–3 days |
| Sprint +2 | P1: #5 Stats Panel | 1 day |
| Backlog | P2: #6 Branching, #7 Latency, #8 Round Trip | 3–5 days |
| Future | P3: #9 Presets, #10 Chaos Mode | 3–5 days |
