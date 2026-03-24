# 🏗️ Architecture Flow Designer

A visual architecture documentation platform for designing, documenting, and communicating microservice systems—capturing not just *what* components exist, but *how data flows* between them.

Built with React 19, React Flow, GSAP, and a NestJS backend for multi-project workspace management and real-time collaboration.

![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![React Flow](https://img.shields.io/badge/React%20Flow-12-green) ![GSAP](https://img.shields.io/badge/GSAP-3.12-green) ![NestJS](https://img.shields.io/badge/NestJS-11-red) ![Socket.IO](https://img.shields.io/badge/Socket.IO-realtime-purple)

## 🎯 Use Cases

- **📋 Onboarding** — New developers understand system architecture visually
- **📝 API Documentation** — Data contracts live alongside the diagram
- **🔍 System Review** — Trace data flow through services
- **📐 Architecture Design** — Plan new features with clear integration points
- **🧪 Resilience Testing** — Simulate failures and chaos scenarios to validate architecture

## ✨ Features

### Core Diagramming
- **Drag & Drop Interface** — Add components from the palette to the canvas
- **20+ Node Types** — Services, databases, queues, caches, gateways, storage, clients, and more
- **Cloud Infrastructure** — Lambda, Load Balancer, CDN, Auth Provider, Container, DNS
- **AI/ML Components** — LLM, Vector DB, ML Pipeline, Embedding
- **Cloud Services** — Secrets Manager, Event Bus, Data Lake, Search, Notifications
- **Group Containers** — Organize with VPCs, Clusters, Regions, and Subnets
- **Auto-Layout** — Dagre.js automatic arrangement (Top-to-Bottom, Left-to-Right)

### Data Flow & Contracts
- **17 Protocol Types** — HTTP, gRPC, GraphQL, WebSocket, TCP, and messaging protocols
- **Messaging Protocols** — AMQP, RabbitMQ, Kafka, EventBridge, SNS
- **Data Protocols** — SQL, Redis, S3/Blob, Vector Search, Search
- **Auth & DNS** — OAuth/OIDC, DNS protocols
- **AI/ML Protocols** — AI Inference with animated connections
- **Data Contracts** — Define JSON, Protobuf, Avro, XML schemas directly on edges
- **Animated Flow** — GSAP-powered protocol-colored flowing animations with MotionPathPlugin
- **Schema Labels** — Edge labels show protocol + schema name (e.g., `AMQP • TaskCreatedEvent`)

### Simulation Mode (GSAP-Powered)
- **Flow Simulation** — Animated packet traces data flow from a source node through the architecture
  - BFS/DFS path tracing with branching support (parallel packets at fork points)
  - Latency-proportional animation speed per edge
  - Step-by-step debugger mode (forward/backward)
  - Round-trip animation (request → response)
  - Real-time stats: total hops, protocols used, path length, total latency, bottleneck detection
- **Failure Simulation** — Mark nodes as failed and visualize cascading impact
  - Click nodes to toggle failure state (red pulsing glow)
  - Automatic blast radius computation (BFS downstream)
  - Domino-effect cascade animation (level-by-level ripple)
  - Affected nodes dimmed with grayscale; broken edges turn red
  - Stats: failed count, affected count, impact percentage, broken edges
- **Chaos Engineering Mode** — Automated resilience testing
  - **Random Failure** — Probability-weighted random node failures with configurable max per round
  - **Network Partition** — Severs ~30-50% of edges using Union-Find to split the graph into partitions
  - Protected nodes (click to toggle, cyan "P" badge) are immune to chaos
  - Configurable interval (1s–10s), failure probability, and max failures per round
  - Scrollable event log with color-coded entries (failures, cascades, partitions, recoveries)
  - Stats: rounds, total failures, MTBF, severed edges
- **Floating Control Panel** — Bottom-center overlay with mode selector, playback controls, speed (0.25x–4x)
- **Non-destructive** — Simulation state is ephemeral, not persisted or included in undo/redo

### Node Destruction Animation
- **Shatter/Explode Effect** — Deleted nodes explode into a 4×4 grid of fragments
- **Clone-and-Animate** — Captures node position, clones to overlay, removes from state, then animates fragments flying outward with staggered rotation/scale/opacity
- **Connected edges** fade out simultaneously during the shatter animation

### AI Integration (OpenAI)
- **Architecture Analysis** — AI-powered review with scoring and recommendations
- **Connection Suggestions** — Smart protocol recommendations based on node types
- **Documentation Generation** — Auto-generate Markdown documentation
- **Secure Key Storage** — API keys stored locally, never sent to servers
- **Settings Panel** — Configure provider, model, and test connections

### Real-time Collaboration
- **Live Cursors** — See other users' cursor positions on the canvas in real time
- **User Presence** — Colored avatar badges in the navbar show who's online
- **Name Entry** — Users choose a display name when joining (saved to localStorage)
- **Diagram Sync** — Node and edge changes broadcast instantly to all connected users
- **Viewport-independent Cursors** — Cursor positions use flow-space coordinates, so they appear at the correct diagram position regardless of each user's pan/zoom
- **Socket.IO + NestJS Gateway** — WebSocket-based transport with room-per-diagram

### Multi-Project Workspace
- **Projects & Diagrams** — Organize diagrams into projects with color-coded cards
- **REST API** — Full CRUD backed by NestJS + PostgreSQL
- **Breadcrumb Navigation** — Projects › Project Name › Diagram Name in the navbar
- **React Router** — Client-side routing (`/`, `/projects/:id`, `/projects/:id/diagrams/:id`)
- **TanStack React Query** — Server state management with caching

### Productivity
- **Multi-Select** — Box selection and Shift+click for multiple items
- **Copy/Paste** — Full clipboard support with Cmd+C/V
- **Collapsible Groups** — Hide/show group contents for cleaner views
- **Export Options** — PNG, SVG, JSON, Markdown, PDF + export selected only
- **Import/Export** — Smart import with validation, supports JSON and Markdown formats
- **Import Modes** — Replace, merge, or append diagrams with conflict resolution
- **Auto-Save** — Persists to localStorage automatically
- **Undo/Redo** — Full history support
- **Dark/Light Mode** — Theme toggle with system preference support

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- The [architecture-diagram-api](../architecture-diagram-api) backend running (for projects, diagrams, and collaboration)
- Docker (for PostgreSQL via docker-compose)

### Backend Setup

```bash
# From the API repo
cd architecture-diagram-api

# Start PostgreSQL
docker compose up -d

# Install dependencies & start
npm install
npm run start:dev
```

The API will be available at `http://localhost:3000`

### Frontend Setup

```bash
# From this repo
cd architecture-diagram

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Environment Variables

Create a `.env` file (optional — defaults work for local development):

```env
VITE_API_URL=http://localhost:3000/api
```

### Build for Production

```bash
npm run build
npm run preview
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `V` | Select mode |
| `H` | Pan mode |
| `Cmd/Ctrl + C` | Copy selected |
| `Cmd/Ctrl + V` | Paste |
| `Cmd/Ctrl + D` | Duplicate selected |
| `Cmd/Ctrl + L` | Auto-layout |
| `Delete / Backspace` | Delete selected (with shatter animation) |
| `Cmd/Ctrl + Z` | Undo |
| `Cmd/Ctrl + Y` | Redo |
| `[` | Toggle left panel |
| `]` | Toggle right panel |
| `Shift + Click` | Add to selection |
| `Shift + S` | Toggle simulation panel |

## 🧩 Component Types

### Nodes
| Type | Description |
|------|-------------|
| **Core** | |
| Service | Microservice or API component |
| Database | SQL/NoSQL data storage |
| Queue | Message queue (RabbitMQ, Kafka, SQS) |
| Cache | In-memory store (Redis, Memcached) |
| Gateway | API Gateway |
| External | Third-party service |
| Storage | Object storage (S3, Azure Blob) |
| Client | Web, mobile, or desktop app |
| **Cloud Infrastructure** | |
| Lambda | Serverless function |
| Load Balancer | Traffic distribution |
| CDN | Edge delivery network |
| Auth Provider | Identity & access management |
| Container | Docker/Pod |
| DNS | Domain routing |
| **AI/ML** | |
| LLM | Large language model |
| Vector DB | Embeddings store |
| ML Pipeline | Training/inference pipeline |
| Embedding | Vector encoder |
| **Cloud Services** | |
| Secrets | Secrets manager |
| Event Bus | Event broker |
| Data Lake | Big data storage |
| Search | Search engine |
| Notification | Push/alert service |

### Groups
| Type | Description |
|------|-------------|
| VPC | Virtual Private Cloud boundary |
| Cluster | Kubernetes or container cluster |
| Region | Cloud provider geographic region |
| Subnet | Network subnet |

### Edge Protocols
| Protocol | Style | Group |
|----------|-------|-------|
| HTTP/REST | Solid blue | Standard |
| gRPC | Dashed green | Standard |
| GraphQL | Solid pink | Standard |
| WebSocket | Dashed purple, animated | Standard |
| TCP | Thick cyan | Standard |
| AMQP | Dashed amber, animated | Messaging |
| RabbitMQ | Dashed amber, animated | Messaging |
| Kafka | Dashed red, animated | Messaging |
| EventBridge | Dashed orange, animated | Messaging |
| SNS/Push | Dashed rose, animated | Messaging |
| SQL/Database | Solid yellow | Data |
| Redis | Dashed red | Data |
| S3/Blob | Solid emerald | Data |
| Vector Search | Dashed teal | Data |
| Search | Dashed amber | Data |
| OAuth/OIDC | Dashed violet | Auth |
| DNS | Dashed lime | Auth |
| AI Inference | Dashed fuchsia, animated | AI/ML |

### Data Contract Formats
| Format | Description |
|--------|-------------|
| JSON | JavaScript Object Notation |
| Protobuf | Google Protocol Buffers |
| Avro | Apache Avro Schema |
| XML | Extensible Markup Language |
| Binary | Binary data format |
| Text | Plain text format |

## 🛠️ Tech Stack

- **React 19** — UI framework
- **TypeScript 5** — Type safety
- **@xyflow/react 12** — Diagram library (React Flow)
- **Zustand 5** — State management
- **Tailwind CSS v4** — Styling
- **GSAP 3.14** — Animation engine (MotionPathPlugin for simulation)
- **React Router 6** — Client-side routing
- **TanStack React Query 5** — Server state management
- **Socket.IO Client** — Real-time collaboration transport
- **Yjs** — CRDT for conflict-free collaborative editing
- **Vite** — Build tool
- **Vitest** — Unit testing
- **OpenAI SDK** — AI integration (client-side)
- **html-to-image** — Export functionality
- **jsPDF** — PDF generation

## 📁 Project Structure

```
src/
├── components/
│   ├── nodes/           # Custom node components (ArchitectureNode, GroupNode, CommentNode)
│   ├── edges/           # Custom edge components (GSAP-animated ArchitectureEdge)
│   ├── panels/          # Sidebar & overlay panels
│   │   ├── NodePalette.tsx        # Draggable node palette
│   │   ├── PropertiesPanel.tsx    # Node/edge property editor
│   │   ├── SettingsPanel.tsx      # AI configuration
│   │   ├── SimulationPanel.tsx    # Floating simulation control bar
│   │   ├── SimulationStats.tsx    # Real-time simulation metrics overlay
│   │   ├── ChaosEventLog.tsx      # Chaos mode event timeline
│   │   └── ShortcutsHelp.tsx      # Keyboard shortcuts modal
│   └── ui/              # Reusable UI components
│       ├── Toast.tsx              # Toast notifications
│       ├── ImportDialog.tsx       # Diagram import modal
│       ├── JoinDiagramDialog.tsx  # Collaboration name entry dialog
│       ├── CollaboratorBadges.tsx # Online user avatar badges
│       ├── CollaboratorCursors.tsx # Remote cursor SVG overlay
│       └── ...
├── hooks/
│   ├── useCollaboration.ts        # Socket.IO collaboration (cursors, sync, presence)
│   ├── useEdgeAnimation.ts        # GSAP edge flow animation
│   ├── useSimulationAnimation.ts  # GSAP simulation orchestration (flow + failure)
│   ├── useChaosSimulation.ts      # Chaos engineering interval engine
│   ├── useDestroyAnimation.ts     # GSAP shatter/explode for node deletion
│   └── useDragEvent.ts            # Palette drag-and-drop handler
├── pages/
│   ├── ProjectsPage.tsx     # Project cards grid (/)
│   └── ProjectPage.tsx      # Diagram cards for a project (/projects/:id)
├── services/
│   ├── api.ts           # Typed fetch wrapper for backend API
│   └── ai/              # AI provider integrations
│       └── providers/   # OpenAI provider implementation
├── store/
│   ├── diagramStore.ts      # Nodes, edges, clipboard, undo/redo
│   ├── workspaceStore.ts    # Current project/diagram context
│   ├── simulationStore.ts   # Simulation state (flow, failure, chaos)
│   ├── animationStore.ts    # Pending deletion animation orchestration
│   ├── uiStore.ts           # Panel visibility, toasts
│   ├── themeStore.ts        # Dark/light/system theme
│   └── aiStore.ts           # AI provider settings & cache
├── types/
│   ├── index.ts         # Core diagram types
│   ├── simulation.ts    # Simulation & chaos types
│   └── ai.ts            # AI provider types
├── lib/
│   ├── gsap.ts          # GSAP initialization & plugin registration
│   └── utils.ts         # Utility functions (cn helper)
├── utils/
│   ├── graphTraversal.ts    # BFS path tracing, blast radius, partition (Union-Find)
│   ├── export.ts            # Export utilities
│   ├── import.ts            # Import utilities
│   └── layout.ts            # Auto-layout algorithms
└── constants/           # Configuration constants
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Made with ❤️ using React and React Flow
