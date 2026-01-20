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
- **8 Node Types** — Services, databases, queues, caches, gateways, storage, clients, external APIs
- **Group Containers** — Organize with VPCs, Clusters, Regions, and Subnets
- **Auto-Layout** — Dagre.js automatic arrangement (Top-to-Bottom, Left-to-Right)

### Data Flow & Contracts
- **Protocol-Aware Edges** — HTTP, gRPC, WebSocket, AMQP, Kafka, TCP with visual differentiation
- **Data Contracts** — Define JSON, Protobuf, Avro, XML schemas directly on edges
- **Animated Flow** — Protocol-colored flowing animations showing data movement
- **Schema Labels** — Edge labels show protocol + schema name (e.g., `AMQP • TaskCreatedEvent`)

### Productivity
- **Multi-Select** — Box selection and Shift+click for multiple items
- **Copy/Paste** — Full clipboard support with Cmd+C/V
- **Collapsible Groups** — Hide/show group contents for cleaner views
- **Export Options** — PNG, SVG, JSON formats + export selected only
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
| Service | Microservice or API component |
| Database | SQL/NoSQL data storage |
| Queue | Message queue (RabbitMQ, Kafka, SQS) |
| Cache | In-memory store (Redis, Memcached) |
| Gateway | API Gateway or Load Balancer |
| External | Third-party service |
| Storage | Object storage (S3, Azure Blob) |
| Client | Web, mobile, or desktop app |

### Groups
| Type | Description |
|------|-------------|
| VPC | Virtual Private Cloud boundary |
| Cluster | Kubernetes or container cluster |
| Region | Cloud provider geographic region |
| Subnet | Network subnet |

### Edge Protocols
| Protocol | Style |
|----------|-------|
| HTTP/HTTPS | Solid blue |
| gRPC | Dashed green |
| WebSocket | Dashed purple |
| AMQP/RabbitMQ | Dotted amber |
| Kafka | Dotted red |
| TCP | Thick cyan |

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
- **html-to-image** - Export functionality
- **jsPDF** - PDF generation

## 📁 Project Structure

```
src/
├── components/
│   ├── nodes/           # Custom node components
│   ├── edges/           # Custom edge components
│   ├── panels/          # Sidebar panels
│   └── ui/              # Reusable UI components
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
