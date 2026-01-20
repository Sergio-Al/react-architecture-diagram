# 🏗️ Architecture Flow Designer - Project Plan

A visual architecture documentation platform for designing, documenting, and communicating microservice systems.

---

## 📋 Project Overview

**Goal:** Create an interactive platform for designing microservice architectures with protocol-aware connections, data contract definitions, and deployment boundaries—serving as living technical documentation.

**Key Differentiators:**
- Not just box-and-line diagrams, but **process & data flow documentation**
- Edges represent **communication contracts** (protocol + data schema)
- Serves developers, QA, DevOps, and onboarding—not just architects

**Tech Stack:****
- **React 18** (with TypeScript)
- **@xyflow/react** (React Flow v12) - Core diagram functionality
- **Zustand** - State management
- **Tailwind CSS v4** - Styling
- **Heroicons** (@heroicons/react) - Node icons
- **html-to-image** / **jsPDF** - Export functionality
- **Vite** - Build tool

---

## 🗂️ Phase 1: Project Setup & Foundation ✅ COMPLETED

### 1.1 Initialize Project
- [x] Create React app with TypeScript (Vite)
- [x] Install dependencies: 
  ```bash
  npm install @xyflow/react zustand tailwindcss @heroicons/react
  npm install html-to-image jspdf
  ```
- [x] Set up folder structure: 
  ```
  src/
  ├── components/
  │   ├── nodes/           # Custom node components
  │   ├── edges/           # Custom edge components
  │   ├── panels/          # Sidebar, toolbar, properties panel
  │   └── ui/              # Reusable UI components
  ├── hooks/               # Custom hooks
  ├── store/               # Zustand store
  ├── types/               # TypeScript types
  ├── lib/                 # Utility functions
  └── constants/           # Node types, colors, etc.
  ```

### 1.2 Basic React Flow Setup
- [x] Create main canvas component with React Flow
- [x] Implement basic pan, zoom, and minimap controls
- [x] Add background grid pattern (dots)
- [x] Trackpad two-finger pan navigation
- [x] Pinch-to-zoom support

---

## 🗂️ Phase 2: Custom Node Types ✅ COMPLETED

### 2.1 Define Node Categories
| Node Type | Icon | Description | Status |
|-----------|------|-------------|--------|
| **Service** | 🔷 | Microservice / API | ✅ |
| **Database** | 🗄️ | SQL/NoSQL database | ✅ |
| **Queue** | 📨 | Message queue (RabbitMQ, Kafka) | ✅ |
| **Cache** | ⚡ | Redis, Memcached | ✅ |
| **Gateway** | 🚪 | API Gateway / Load Balancer | ✅ |
| **External** | 🌐 | Third-party service | ✅ |
| **Storage** | 📦 | Object storage (S3, Blob) | ✅ |
| **Client** | 👤 | Web/Mobile client | ✅ |

### 2.2 Build Custom Node Components
- [x] Create base `ArchitectureNode` component with:
  - Icon display (Heroicons)
  - Title/label
  - Status indicator (active/inactive/warning)
  - Connection handles (top, bottom, left, right)
- [x] Style each node type with distinct colors/icons
- [x] Add hover and selected states
- [ ] Support for resizing nodes

### 2.3 Node Data Structure
```typescript
interface ArchitectureNodeData {
  label: string;
  type: 'service' | 'database' | 'queue' | 'cache' | 'gateway' | 'external' | 'storage' | 'client';
  description?: string;
  technology?: string;
  port?: string;
  status?: 'active' | 'inactive' | 'warning';
}
```

---

## 🗂️ Phase 3: Custom Edges (Connections) ✅ COMPLETED

### 3.1 Edge Types
| Edge Type | Style | Color | Status |
|-----------|-------|-------|--------|
| **HTTP/HTTPS** | Solid line | Blue | ✅ |
| **gRPC** | Dashed line | Green | ✅ |
| **WebSocket** | Dashed line | Purple | ✅ |
| **AMQP/RabbitMQ** | Dotted line | Amber | ✅ |
| **Kafka** | Dotted line | Red | ✅ |
| **TCP** | Thick line | Cyan | ✅ |
| **UDP** | Line | Pink | ✅ |

### 3.2 Build Custom Edge Components
- [x] Create labeled edges with protocol/method info
- [x] Add animated edges with flowing dots (SVG animateMotion)
- [x] Protocol-based color coding for animations
- [x] Edge labels (protocol, method)
- [x] **Data contracts** - Protocol-agnostic schema definitions on edges
- [x] Support bidirectional connections

### 3.3 Edge Data Structure
```typescript
interface ArchitectureEdgeData {
  label?: string;
  protocol?: 'http' | 'https' | 'grpc' | 'websocket' | 'tcp' | 'udp' | 'amqp' | 'kafka';
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  async?: boolean;
  animated?: boolean;
  dataContract?: {
    format: 'json' | 'protobuf' | 'avro' | 'xml' | 'binary' | 'text';
    schemaName?: string;
    schema?: string;
    description?: string;
  };
}
```

### 3.4 Data Contract Features
- [x] Define data schemas on edges (JSON, Protobuf, Avro, XML, Binary, Text)
- [x] Schema name displayed in edge label (e.g., `AMQP • TaskCreatedEvent`)
- [x] Full schema editor in Properties Panel with **CodeMirror** syntax highlighting
- [x] Format-specific placeholder templates
- [x] Tooltip shows contract description on hover
}
```

---

## 🗂️ Phase 4: UI Components ✅ COMPLETED

### 4.1 Toolbar / Node Palette
- [x] Draggable node palette sidebar (left)
- [x] Categorized node types (Infrastructure, Compute, Data Store, Messaging, External)
- [x] Drag-and-drop to canvas
- [ ] Search/filter nodes

### 4.2 Properties Panel
- [x] Show when node/edge is selected (right sidebar)
- [x] Edit node properties: 
  - Label, description, technology
  - Port, status
  - Parent group selection
- [x] Edit edge properties:
  - Protocol, method, label
  - Animated toggle, async toggle

### 4.3 Top Toolbar (Navbar)
- [x] Undo / Redo buttons
- [x] Export button with dialog (PNG, SVG, JSON)
- [x] Layout options (auto-arrange with Dagre)
- [ ] Save / Load diagram buttons

### 4.4 Floating Toolbar
- [x] Select/Pan mode toggle (V/H keys)
- [x] Zoom in/out controls
- [x] Fit-to-view button

### 4.5 Minimap & Controls
- [x] React Flow Minimap for navigation
- [x] Background controls

---

## 🗂️ Phase 5: State Management ✅ COMPLETED

### 5.1 Zustand Store Structure
```typescript
interface DiagramStore {
  nodes: Node[];
  edges: Edge[];
  clipboard: ClipboardState; // NEW: For copy/paste
  
  // Actions
  addNode: (node: Node) => void;
  updateNodeData: (id: string, data: Partial<NodeData>) => void;
  deleteElements: (nodeIds: string[], edgeIds: string[]) => void;
  duplicateNodes: (nodeIds: string[]) => void;
  
  // Clipboard actions (NEW)
  copySelectedNodes: () => void;
  pasteNodes: (position?: { x: number; y: number }) => void;
  hasClipboardContent: () => boolean;
  
  // Grouping
  addNodeToGroup: (nodeId: string, groupId: string) => void;
  removeNodeFromGroup: (nodeId: string) => void;
  toggleGroupCollapse: (groupId: string) => void;
  
  // History
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  
  // Persistence
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
}
```

### 5.2 Features
- [x] Implement undo/redo with history stack
- [x] Auto-save to localStorage (debounced)
- [x] Load from localStorage on startup
- [x] Import/export as JSON

---

## 🗂️ Phase 6: Grouping & Containers ✅ COMPLETED

### 6.1 Group Nodes (Boundaries)
- [x] Create "Group" node type for: 
  - VPC / Network boundaries
  - Kubernetes clusters
  - Regions
  - Subnets
- [x] Allow nesting nodes inside groups (parentId + extent: 'parent')
- [x] Collapsible groups (hide/show children)
- [x] Custom group labels
- [x] Drag nodes into groups (auto-parent)
- [x] Assign parent via Properties Panel dropdown
- [x] Child nodes move with parent group
- [x] Child nodes constrained to parent boundaries

---

## 🗂️ Phase 7: Export & Sharing ✅ COMPLETED

### 7.1 Export Options
- [x] **PNG** - Using `html-to-image`
- [x] **SVG** - Vector export
- [x] **JSON** - Diagram data for re-import
- [x] **Export Selected** - Export only selected nodes as PNG/SVG
- [ ] **PDF** - Using `jsPDF`
- [ ] **Markdown** - Generate architecture doc

### 7.2 Share Features
- [ ] Copy shareable link (with encoded state)
- [ ] Embed code for documentation

---

## 🗂️ Phase 8: Advanced Features (Partially Completed)

- [ ] **Templates** - Pre-built architecture patterns
- [ ] **Real-time collaboration** - Using WebSockets/Yjs
- [x] **Dark/Light mode** - Theme toggle with CSS variables (zinc color palette)
- [x] **Panel visibility** - Toggle left/right panels via keyboard or UI
- [x] **Keyboard shortcuts**:
  - `V` - Select mode
  - `H` - Pan mode
  - `Cmd/Ctrl + D` - Duplicate selected
  - `Cmd/Ctrl + C` - Copy selected nodes
  - `Cmd/Ctrl + V` - Paste nodes
  - `Cmd/Ctrl + L` - Auto-layout (Top to Bottom)
  - `Delete/Backspace` - Delete selected
  - `Cmd/Ctrl + Z` - Undo
  - `Cmd/Ctrl + Y` - Redo
  - `Shift + Click` - Multi-select
  - `[` - Toggle left panel visibility
  - `]` - Toggle right panel visibility
  - `N` - Add comment/annotation
- [x] **Auto-layout** - Dagre.js for automatic arrangement (Top-to-Bottom, Left-to-Right)
- [ ] **Search** - Find nodes by name
- [x] **Comments/annotations** on diagram - Sticky-note style comment nodes with colors
- [x] **Multi-select** - Box selection and Shift+click
- [x] **Trackpad navigation** - Two-finger pan, pinch zoom

---

## 📅 Implementation Status

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 1: Setup | ✅ Complete | 100% |
| Phase 2: Custom Nodes | ✅ Complete | 95% |
| Phase 3: Custom Edges | ✅ Complete | 95% |
| Phase 4: UI Components | ✅ Complete | 100% |
| Phase 5: State Management | ✅ Complete | 100% |
| Phase 6: Grouping | ✅ Complete | 100% |
| Phase 7: Export | ✅ Complete | 75% |
| Phase 8: Advanced | 🟡 Partial | 70% |

**Overall Progress: ~95%**

---

## 🚀 MVP Deliverables ✅ ALL COMPLETE

1. ✅ Basic canvas with pan/zoom
2. ✅ 8 node types (Service, Database, Queue, Cache, Gateway, External, Storage, Client)
3. ✅ Draggable node palette
4. ✅ Connect nodes with labeled edges
5. ✅ Properties panel for editing
6. ✅ Save/load from localStorage
7. ✅ Export as PNG/SVG/JSON

---

## 🔮 Future Enhancements

- [ ] PDF export
- [ ] Shareable links
- [ ] Templates library
- [ ] Real-time collaboration
- [ ] Node search/filter
- [ ] Comments/annotations
- [ ] Node resizing 

## Future Directions

Future Direction Suggestions
Given this evolution, consider adding:

Feature	Value
- Flow simulation	Animate a "request" traveling through services
- Schema validation	Validate JSON schemas, show compatibility
- OpenAPI import	Import existing API specs to populate contracts
- Mermaid/PlantUML export	Generate text-based diagrams for docs
- Version history	Track architecture changes over time
