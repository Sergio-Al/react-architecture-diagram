import { create } from 'zustand';
import { 
  Connection, 
  EdgeChange, 
  NodeChange, 
  addEdge, 
  applyNodeChanges, 
  applyEdgeChanges,
  Node,
  Edge,
} from '@xyflow/react';
import { 
  ArchitectureNodeData,
  ArchitectureEdgeData,
  GroupNodeData,
  DiagramData,
} from '@/types';
import { 
  STORAGE_KEY, 
  AUTO_SAVE_DEBOUNCE, 
  MAX_HISTORY_LENGTH 
} from '@/constants';

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

interface DiagramStore {
  // State
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  
  // History
  history: HistoryState[];
  historyIndex: number;
  
  // Actions
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  
  addNode: (node: Node) => void;
  updateNodeData: (id: string, data: Partial<ArchitectureNodeData>) => void;
  deleteNode: (id: string) => void;
  duplicateNodes: (nodeIds: string[]) => void;
  deleteSelectedNodes: () => void;
  
  // Group actions
  updateGroupData: (id: string, data: Partial<GroupNodeData>) => void;
  toggleGroupCollapse: (id: string) => void;
  addNodeToGroup: (nodeId: string, groupId: string) => void;
  removeNodeFromGroup: (nodeId: string) => void;
  
  updateEdgeData: (id: string, data: Partial<ArchitectureEdgeData>) => void;
  deleteEdge: (id: string) => void;
  
  setSelectedNode: (id: string | null) => void;
  setSelectedEdge: (id: string | null) => void;
  
  // History actions
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  saveToHistory: () => void;
  
  // Persistence
  saveDiagram: () => void;
  loadDiagram: () => void;
  exportDiagram: () => DiagramData;
  importDiagram: (data: DiagramData) => void;
  clearDiagram: () => void;
}

// Debounce helper
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

const debouncedSave = (saveFn: () => void) => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(saveFn, AUTO_SAVE_DEBOUNCE);
};

export const useDiagramStore = create<DiagramStore>((set, get) => ({
  // Initial state
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  history: [],
  historyIndex: -1,

  // Node changes (drag, select, etc.)
  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes) as Node[],
    }));
    
    // Auto-save on position changes
    const hasPositionChange = changes.some(
      (c) => c.type === 'position' && (c as any).dragging === false
    );
    if (hasPositionChange) {
      get().saveToHistory();
      debouncedSave(get().saveDiagram);
    }
  },

  // Edge changes
  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges) as Edge[],
    }));
    
    const hasRemove = changes.some((c) => c.type === 'remove');
    if (hasRemove) {
      get().saveToHistory();
      debouncedSave(get().saveDiagram);
    }
  },

  // New connection
  onConnect: (connection) => {
    const newEdge: Edge = {
      ...connection,
      id: `edge-${Date.now()}`,
      type: 'architecture',
      source: connection.source!,
      target: connection.target!,
      data: {
        protocol: 'http',
        animated: true, // Enable animation by default
      },
    };
    
    set((state) => ({
      edges: addEdge(newEdge, state.edges) as Edge[],
    }));
    
    get().saveToHistory();
    debouncedSave(get().saveDiagram);
  },

  // Add new node
  addNode: (node) => {
    set((state) => ({
      nodes: [...state.nodes, node],
    }));
    get().saveToHistory();
    debouncedSave(get().saveDiagram);
  },

  // Update node data
  updateNodeData: (id, data) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, ...data } }
          : node
      ),
    }));
    get().saveToHistory();
    debouncedSave(get().saveDiagram);
  },

  // Delete node
  deleteNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      edges: state.edges.filter(
        (edge) => edge.source !== id && edge.target !== id
      ),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    }));
    get().saveToHistory();
    debouncedSave(get().saveDiagram);
  },

  // Delete selected nodes
  deleteSelectedNodes: () => {
    const { nodes } = get();
    const selectedNodeIds = nodes.filter(n => n.selected).map(n => n.id);
    
    if (selectedNodeIds.length === 0) return;

    set((state) => ({
      nodes: state.nodes.filter((node) => !selectedNodeIds.includes(node.id)),
      edges: state.edges.filter(
        (edge) => !selectedNodeIds.includes(edge.source) && !selectedNodeIds.includes(edge.target)
      ),
      selectedNodeId: null,
    }));
    get().saveToHistory();
    debouncedSave(get().saveDiagram);
  },

  // Duplicate nodes
  duplicateNodes: (nodeIds) => {
    const { nodes, edges } = get();
    const nodesToDuplicate = nodes.filter(n => nodeIds.includes(n.id));
    
    if (nodesToDuplicate.length === 0) return;

    // Create a map of old IDs to new IDs
    const idMap = new Map<string, string>();
    const newNodes: Node[] = [];
    
    // Duplicate nodes with offset position
    nodesToDuplicate.forEach(node => {
      const newId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      idMap.set(node.id, newId);
      
      newNodes.push({
        ...node,
        id: newId,
        position: {
          x: node.position.x + 50,
          y: node.position.y + 50,
        },
        selected: false,
      });
    });

    // Duplicate edges between duplicated nodes
    const newEdges: Edge[] = [];
    edges.forEach(edge => {
      if (idMap.has(edge.source) && idMap.has(edge.target)) {
        newEdges.push({
          ...edge,
          id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          source: idMap.get(edge.source)!,
          target: idMap.get(edge.target)!,
        });
      }
    });

    // Add new nodes and edges, deselect old ones
    set((state) => ({
      nodes: [
        ...state.nodes.map(n => ({ ...n, selected: false })),
        ...newNodes.map(n => ({ ...n, selected: true })),
      ],
      edges: [...state.edges, ...newEdges],
      selectedNodeId: null,
    }));
    
    get().saveToHistory();
    debouncedSave(get().saveDiagram);
  },

  // Update group data
  updateGroupData: (id, data) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id
          ? { ...node, data: { ...node.data, ...data } }
          : node
      ),
    }));
    get().saveToHistory();
    debouncedSave(get().saveDiagram);
  },

  // Toggle group collapse
  toggleGroupCollapse: (id) => {
    const { nodes, edges } = get();
    const groupNode = nodes.find(n => n.id === id);
    if (!groupNode) return;

    const isCollapsing = !(groupNode.data as GroupNodeData).collapsed;
    
    // Find all children (nodes with this group as parent)
    const childNodeIds = nodes
      .filter(n => n.parentId === id)
      .map(n => n.id);

    set((state) => ({
      nodes: state.nodes.map((node) => {
        // Toggle the group itself
        if (node.id === id) {
          return { ...node, data: { ...node.data, collapsed: isCollapsing } };
        }
        // Hide/show child nodes
        if (childNodeIds.includes(node.id)) {
          return { ...node, hidden: isCollapsing };
        }
        return node;
      }),
      edges: state.edges.map((edge) => {
        // Hide edges between hidden nodes or edges to/from hidden nodes
        const sourceHidden = childNodeIds.includes(edge.source);
        const targetHidden = childNodeIds.includes(edge.target);
        
        if (sourceHidden && targetHidden) {
          // Both nodes hidden - hide the edge
          return { ...edge, hidden: isCollapsing };
        } else if (sourceHidden || targetHidden) {
          // One end hidden - connect to group instead
          if (isCollapsing) {
            return {
              ...edge,
              hidden: true, // Hide internal edges when collapsed
            };
          } else {
            return { ...edge, hidden: false };
          }
        }
        return edge;
      }),
    }));
    get().saveToHistory();
    debouncedSave(get().saveDiagram);
  },

  // Add node to group
  addNodeToGroup: (nodeId, groupId) => {
    set((state) => {
      const groupNode = state.nodes.find(n => n.id === groupId);
      const targetNode = state.nodes.find(n => n.id === nodeId);
      if (!groupNode || !targetNode) return state;

      // Get group dimensions
      const groupWidth = (groupNode.style?.width as number) || 300;
      const groupHeight = (groupNode.style?.height as number) || 250;
      
      // Fixed node dimensions for architecture nodes
      const nodeWidth = 140;
      const nodeHeight = 100;
      const padding = 20;

      // Always place in center of group for reliable positioning
      const relativeX = Math.max(padding, (groupWidth - nodeWidth) / 2);
      const relativeY = Math.max(padding + 10, (groupHeight - nodeHeight) / 2);

      // Update the target node with parent relationship
      // @xyflow/react v12 uses parentId, NOT parentNode
      const updatedNode = { 
        ...targetNode, 
        position: { x: relativeX, y: relativeY },
        data: { ...targetNode.data, parentId: groupId },
        parentId: groupId,  // v12 uses parentId
        extent: 'parent' as const,
      };

      // IMPORTANT: React Flow requires parent nodes to come BEFORE child nodes in the array
      const nodesWithoutTarget = state.nodes.filter(n => n.id !== nodeId);
      const parentIndex = nodesWithoutTarget.findIndex(n => n.id === groupId);
      
      // Insert the child node right after its parent
      const reorderedNodes = [
        ...nodesWithoutTarget.slice(0, parentIndex + 1),
        updatedNode,
        ...nodesWithoutTarget.slice(parentIndex + 1),
      ];

      return { nodes: reorderedNodes };
    });
    get().saveToHistory();
    debouncedSave(get().saveDiagram);
  },

  // Remove node from group
  removeNodeFromGroup: (nodeId) => {
    set((state) => {
      const node = state.nodes.find(n => n.id === nodeId);
      const parentNode = node?.parentId ? state.nodes.find(n => n.id === node.parentId) : null;
      
      if (!node || !parentNode) return state;

      // Convert relative position back to absolute position
      const absolutePosition = {
        x: node.position.x + parentNode.position.x,
        y: node.position.y + parentNode.position.y,
      };

      return {
        nodes: state.nodes.map((n) =>
          n.id === nodeId
            ? { 
                ...n, 
                position: absolutePosition,
                data: { ...n.data, parentId: undefined },
                parentId: undefined,
                extent: undefined,
              }
            : n
        ),
      };
    });
    get().saveToHistory();
    debouncedSave(get().saveDiagram);
  },

  // Update edge data
  updateEdgeData: (id, data) => {
    set((state) => ({
      edges: state.edges.map((edge) =>
        edge.id === id
          ? { ...edge, data: { ...edge.data, ...data } }
          : edge
      ),
    }));
    get().saveToHistory();
    debouncedSave(get().saveDiagram);
  },

  // Delete edge
  deleteEdge: (id) => {
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== id),
      selectedEdgeId: state.selectedEdgeId === id ? null : state.selectedEdgeId,
    }));
    get().saveToHistory();
    debouncedSave(get().saveDiagram);
  },

  // Selection
  setSelectedNode: (id) => {
    set({ selectedNodeId: id, selectedEdgeId: null });
  },

  setSelectedEdge: (id) => {
    set({ selectedEdgeId: id, selectedNodeId: null });
  },

  // Save current state to history
  saveToHistory: () => {
    const { nodes, edges, history, historyIndex } = get();
    
    // Remove any future states if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);
    
    // Add current state
    newHistory.push({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    });
    
    // Trim history if too long
    if (newHistory.length > MAX_HISTORY_LENGTH) {
      newHistory.shift();
    }
    
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  // Check if undo is possible
  canUndo: () => {
    const { historyIndex } = get();
    return historyIndex > 0;
  },

  // Check if redo is possible
  canRedo: () => {
    const { history, historyIndex } = get();
    return historyIndex < history.length - 1;
  },

  // Undo
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      set({
        nodes: prevState.nodes,
        edges: prevState.edges,
        historyIndex: historyIndex - 1,
      });
      debouncedSave(get().saveDiagram);
    }
  },

  // Redo
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      set({
        nodes: nextState.nodes,
        edges: nextState.edges,
        historyIndex: historyIndex + 1,
      });
      debouncedSave(get().saveDiagram);
    }
  },

  // Save to localStorage
  saveDiagram: () => {
    const { nodes, edges } = get();
    const data = { nodes, edges } as DiagramData;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  // Load from localStorage or URL
  loadDiagram: () => {
    try {
      // First check if there's a diagram in the URL
      const url = new URL(window.location.href);
      const encoded = url.searchParams.get('diagram');
      
      if (encoded) {
        // Import from pako for decompression
        import('pako').then((pako) => {
          try {
            const base64 = decodeURIComponent(encoded);
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            
            const decompressed = pako.inflate(bytes, { to: 'string' });
            const data = JSON.parse(decompressed) as DiagramData;
            
            set({
              nodes: data.nodes as Node[] || [],
              edges: data.edges as Edge[] || [],
              history: [{ nodes: data.nodes as Node[] || [], edges: data.edges as Edge[] || [] }],
              historyIndex: 0,
            });
            
            // Clear the URL parameter after loading
            url.searchParams.delete('diagram');
            window.history.replaceState({}, '', url.toString());
          } catch (error) {
            console.error('Failed to load diagram from URL:', error);
          }
        });
        return;
      }
      
      // Otherwise load from localStorage
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved) as DiagramData;
        set({
          nodes: data.nodes as Node[] || [],
          edges: data.edges as Edge[] || [],
          history: [{ nodes: data.nodes as Node[] || [], edges: data.edges as Edge[] || [] }],
          historyIndex: 0,
        });
      }
    } catch (error) {
      console.error('Failed to load diagram:', error);
    }
  },

  // Export diagram data
  exportDiagram: () => {
    const { nodes, edges } = get();
    return { nodes, edges } as DiagramData;
  },

  // Import diagram data
  importDiagram: (data) => {
    set({
      nodes: data.nodes as Node[] || [],
      edges: data.edges as Edge[] || [],
      selectedNodeId: null,
      selectedEdgeId: null,
    });
    get().saveToHistory();
    get().saveDiagram();
  },

  // Clear diagram
  clearDiagram: () => {
    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      selectedEdgeId: null,
    });
    get().saveToHistory();
    get().saveDiagram();
  },
}));
