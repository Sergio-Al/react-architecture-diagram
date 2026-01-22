# 🏗️ Architecture Flow Designer

A visual architecture documentation platform for designing, documenting, and communicating microservice systems—capturing not just *what* components exist, but *how data flows* between them.

Define service architectures with protocol-aware connections, data contract definitions, and deployment boundaries. Use as living documentation for onboarding, API specs, and system reviews.

![Architecture Diagram](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![React Flow](https://img.shields.io/badge/React%20Flow-12-green)

## 🎯 Use Cases

- **📋 Onboarding** — New developers understand system architecture visually
- **📝 API Documentation** — Data contracts live alongside the diagram
- **🔍 System Review** — Trace data flow through services
- **📐 Architecture Design** — Plan new features with clear integration points

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
- **Animated Flow** — Protocol-colored flowing animations showing data movement
- **Schema Labels** — Edge labels show protocol + schema name (e.g., `AMQP • TaskCreatedEvent`)

### AI Integration (OpenAI)
- **Architecture Analysis** — AI-powered review with scoring and recommendations
- **Connection Suggestions** — Smart protocol recommendations based on node types
- **Documentation Generation** — Auto-generate Markdown documentation
- **Secure Key Storage** — API keys stored locally, never sent to servers
- **Settings Panel** — Configure provider, model, and test connections

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

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/architecture-diagram.git
cd architecture-diagram

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

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
| `Delete / Backspace` | Delete selected |
| `Cmd/Ctrl + Z` | Undo |
| `Cmd/Ctrl + Y` | Redo |
| `[` | Toggle left panel |
| `]` | Toggle right panel |
| `Shift + Click` | Add to selection |

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

- **React 18** - UI framework
- **TypeScript** - Type safety
- **@xyflow/react** - Diagram library (React Flow v12)
- **Zustand** - State management
- **Tailwind CSS v4** - Styling
- **Vite** - Build tool
- **OpenAI SDK** - AI integration (client-side)
- **html-to-image** - Export functionality
- **jsPDF** - PDF generation

## 📁 Project Structure

```
src/
├── components/
│   ├── nodes/           # Custom node components
│   ├── edges/           # Custom edge components
│   ├── panels/          # Sidebar panels (including SettingsPanel)
│   └── ui/              # Reusable UI components
├── services/
│   └── ai/              # AI provider integrations
│       └── providers/   # OpenAI provider implementation
├── hooks/               # Custom React hooks
├── store/               # Zustand store
├── types/               # TypeScript definitions
├── lib/                 # Utility functions
└── constants/           # Configuration
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
