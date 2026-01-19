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

interface ClipboardState {
  nodes: Node[];
  edges: Edge[];
}

interface DiagramStore {
  // State
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  
  // Clipboard
  clipboard: ClipboardState;
  
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
  
  // Clipboard actions
  copySelectedNodes: () => void;
  pasteNodes: (position?: { x: number; y: number }) => void;
  hasClipboardContent: () => boolean;
  
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
  clipboard: { nodes: [], edges: [] },
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
    
    // Start with selected nodes
    const nodesToDuplicateIds = new Set(nodeIds);
    
    // If a group is selected, also include all its children (even if not explicitly selected)
    const selectedGroupIds = nodes.filter(n => nodeIds.includes(n.id) && n.type === 'group').map(n => n.id);
    nodes.forEach(node => {
      if (node.parentId && selectedGroupIds.includes(node.parentId)) {
        nodesToDuplicateIds.add(node.id);
      }
    });
    
    const nodesToDuplicate = nodes.filter(n => nodesToDuplicateIds.has(n.id));
    
    if (nodesToDuplicate.length === 0) return;

    // Create a map of old IDs to new IDs
    const idMap = new Map<string, string>();
    
    // First pass: generate new IDs for all nodes
    nodesToDuplicate.forEach(node => {
      const newId = node.type === 'group'
        ? `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        : `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      idMap.set(node.id, newId);
    });
    
    // Separate into three categories:
    // 1. Root nodes (no parent at all)
    // 2. Child nodes whose parent IS being duplicated (need parentId remapping to new parent)
    // 3. Child nodes whose parent is NOT being duplicated (keep original parentId)
    const rootNodes = nodesToDuplicate.filter(n => !n.parentId);
    const childNodesWithNewParent = nodesToDuplicate.filter(n => n.parentId && nodesToDuplicateIds.has(n.parentId));
    const childNodesKeepingParent = nodesToDuplicate.filter(n => n.parentId && !nodesToDuplicateIds.has(n.parentId));
    
    const newNodes: Node[] = [];
    
    // Process root nodes first (groups and standalone nodes) - apply offset
    rootNodes.forEach(node => {
      const newId = idMap.get(node.id)!;
      
      newNodes.push({
        ...node,
        id: newId,
        position: {
          x: node.position.x + 50,
          y: node.position.y + 50,
        },
        selected: false,
        parentId: undefined,
        extent: undefined,
        data: {
          ...node.data,
          parentId: undefined,
        },
      } as Node);
    });
    
    // Process child nodes whose parent IS being duplicated - remap to new parent
    childNodesWithNewParent.forEach(node => {
      const newId = idMap.get(node.id)!;
      const newParentId = idMap.get(node.parentId!)!;
      
      newNodes.push({
        ...node,
        id: newId,
        // Keep relative position for child nodes (they're positioned relative to parent)
        position: node.position,
        selected: false,
        parentId: newParentId,
        extent: 'parent' as const,
        data: {
          ...node.data,
          parentId: newParentId,
        },
      } as Node);
    });
    
    // Process child nodes whose parent is NOT being duplicated - keep original parent, offset position
    childNodesKeepingParent.forEach(node => {
      const newId = idMap.get(node.id)!;
      
      newNodes.push({
        ...node,
        id: newId,
        // Apply offset but keep within same parent
        position: {
          x: node.position.x + 50,
          y: node.position.y + 50,
        },
        selected: false,
        parentId: node.parentId,
        extent: 'parent' as const,
        data: {
          ...node.data,
          parentId: node.parentId,
        },
      } as Node);
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

    // Track which new node IDs belong to which category (before we modified parentIds)
    const newIdsWithNewParent = new Set(childNodesWithNewParent.map(n => idMap.get(n.id)!));
    const newIdsKeepingParent = new Set(childNodesKeepingParent.map(n => idMap.get(n.id)!));

    // Add new nodes and edges, deselect old ones
    // IMPORTANT: React Flow requires parent nodes to come BEFORE child nodes
    set((state) => {
      const existingNodes = state.nodes.map(n => ({ ...n, selected: false }));
      
      // Separate new nodes by category using tracked IDs
      const nodesKeepingExistingParent = newNodes.filter(n => newIdsKeepingParent.has(n.id));
      const nodesWithNewOrNoParent = newNodes.filter(n => !newIdsKeepingParent.has(n.id));
      
      // Start with existing nodes
      let resultNodes = [...existingNodes];
      
      // Insert nodes keeping existing parent right after their parent
      nodesKeepingExistingParent.forEach(newNode => {
        const parentIndex = resultNodes.findIndex(n => n.id === newNode.parentId);
        if (parentIndex !== -1) {
          // Find the last child of this parent to insert after
          let insertIndex = parentIndex + 1;
          while (insertIndex < resultNodes.length && resultNodes[insertIndex].parentId === newNode.parentId) {
            insertIndex++;
          }
          resultNodes.splice(insertIndex, 0, { ...newNode, selected: true });
        } else {
          resultNodes.push({ ...newNode, selected: true });
        }
      });
      
      // Add nodes with new parent or no parent at the end
      // These are already in correct order (roots/groups first, then their children)
      resultNodes = [
        ...resultNodes,
        ...nodesWithNewOrNoParent.map(n => ({ ...n, selected: true })),
      ];
      
      return {
        nodes: resultNodes,
        edges: [...state.edges, ...newEdges],
        selectedNodeId: null,
      };
    });
    
    get().saveToHistory();
    debouncedSave(get().saveDiagram);
  },

  // Copy selected nodes to clipboard
  copySelectedNodes: () => {
    const { nodes, edges } = get();
    const selectedNodes = nodes.filter(n => n.selected);
    
    if (selectedNodes.length === 0) return;

    // Start with selected nodes
    const nodesToCopy = new Set(selectedNodes.map(n => n.id));
    
    // If a group is selected, also include all its children (even if not explicitly selected)
    const selectedGroupIds = selectedNodes.filter(n => n.type === 'group').map(n => n.id);
    nodes.forEach(node => {
      if (node.parentId && selectedGroupIds.includes(node.parentId)) {
        nodesToCopy.add(node.id);
      }
    });
    
    // Get all nodes to copy (including auto-included children)
    const allNodesToCopy = nodes.filter(n => nodesToCopy.has(n.id));
    
    // Copy edges that connect only copied nodes
    const selectedEdges = edges.filter(
      edge => nodesToCopy.has(edge.source) && nodesToCopy.has(edge.target)
    );

    // Deep clone to avoid reference issues
    set({
      clipboard: {
        nodes: JSON.parse(JSON.stringify(allNodesToCopy)),
        edges: JSON.parse(JSON.stringify(selectedEdges)),
      },
    });
  },

  // Paste nodes from clipboard
  pasteNodes: (position) => {
    const { clipboard, nodes } = get();
    
    if (clipboard.nodes.length === 0) return;

    // Create a map of old IDs to new IDs
    const idMap = new Map<string, string>();
    
    // First pass: generate new IDs for all nodes
    clipboard.nodes.forEach(node => {
      const newId = node.type === 'group' 
        ? `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        : `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      idMap.set(node.id, newId);
    });
    
    // Separate root nodes (no parent or parent not in clipboard) from child nodes
    const clipboardNodeIds = new Set(clipboard.nodes.map(n => n.id));
    const rootNodes = clipboard.nodes.filter(n => !n.parentId || !clipboardNodeIds.has(n.parentId));
    const childNodes = clipboard.nodes.filter(n => n.parentId && clipboardNodeIds.has(n.parentId));
    
    // Calculate offset based on root nodes only
    let offsetX = 50;
    let offsetY = 50;
    
    if (position && rootNodes.length > 0) {
      // Calculate the center of root nodes (not children, as they have relative positions)
      const minX = Math.min(...rootNodes.map(n => n.position.x));
      const minY = Math.min(...rootNodes.map(n => n.position.y));
      const maxX = Math.max(...rootNodes.map(n => n.position.x));
      const maxY = Math.max(...rootNodes.map(n => n.position.y));
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      
      // Offset to center pasted nodes around the click position
      offsetX = position.x - centerX;
      offsetY = position.y - centerY;
    }
    
    const newNodes: Node[] = [];
    
    // Process root nodes first (groups and standalone nodes)
    rootNodes.forEach(node => {
      const newId = idMap.get(node.id)!;
      
      newNodes.push({
        ...node,
        id: newId,
        position: {
          x: node.position.x + offsetX,
          y: node.position.y + offsetY,
        },
        selected: false,
        // Remove any stale parent reference for root nodes
        parentId: undefined,
        extent: undefined,
        data: {
          ...node.data,
          parentId: undefined,
        },
      } as Node);
    });
    
    // Process child nodes - keep their relative positions, update parentId
    childNodes.forEach(node => {
      const newId = idMap.get(node.id)!;
      const newParentId = idMap.get(node.parentId!)!;
      
      newNodes.push({
        ...node,
        id: newId,
        // Keep relative position for child nodes (they're positioned relative to parent)
        position: node.position,
        selected: false,
        parentId: newParentId,
        extent: 'parent' as const,
        data: {
          ...node.data,
          parentId: newParentId,
        },
      } as Node);
    });

    // Create new edges with updated source/target IDs
    const newEdges: Edge[] = [];
    clipboard.edges.forEach(edge => {
      if (idMap.has(edge.source) && idMap.has(edge.target)) {
        newEdges.push({
          ...edge,
          id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          source: idMap.get(edge.source)!,
          target: idMap.get(edge.target)!,
        });
      }
    });

    // Add new nodes and edges, deselect old ones and select new ones
    // IMPORTANT: React Flow requires parent nodes to come BEFORE child nodes
    // newNodes is already ordered correctly (roots first, then children)
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

  // Check if clipboard has content
  hasClipboardContent: () => {
    const { clipboard } = get();
    return clipboard.nodes.length > 0;
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
