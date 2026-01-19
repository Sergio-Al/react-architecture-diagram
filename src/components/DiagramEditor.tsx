import { useCallback, useRef, useEffect, DragEvent, useState } from 'react';
import {
  ReactFlow,
  useReactFlow,
  Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useDiagramStore } from '@/store/diagramStore';
import { nodeTypes } from '@/components/nodes';
import { edgeTypes } from '@/components/edges';
import { NODE_TYPES_CONFIG, GROUP_TYPES_CONFIG } from '@/constants';
import { ArchitectureNodeType, ArchitectureNode, GroupNodeType, GroupNodeData } from '@/types';
import { cn } from '@/lib/utils';
import { 
  CursorArrowRaysIcon,
  HandRaisedIcon,
  MinusIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

export function DiagramEditor() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null!);
  const { screenToFlowPosition, zoomIn, zoomOut, getZoom, getIntersectingNodes } = useReactFlow();
  const [zoom, setZoom] = useState(100);
  const [panMode, setPanMode] = useState(false);
  
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setSelectedNode,
    setSelectedEdge,
    loadDiagram,
    deleteSelectedNodes,
    duplicateNodes,
    addNodeToGroup,
    removeNodeFromGroup,
  } = useDiagramStore();

  // Load saved diagram on mount
  useEffect(() => {
    loadDiagram();
  }, [loadDiagram]);

  // Handle drag over
  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop from palette
  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Check if it's a group type
      if (type.startsWith('group-')) {
        const groupType = type.replace('group-', '') as GroupNodeType;
        const config = GROUP_TYPES_CONFIG[groupType];
        
        const newGroup: Node<GroupNodeData> = {
          id: `group-${Date.now()}`,
          type: 'group',
          position,
          zIndex: -1,
          style: {
            width: 300,
            height: 250,
          },
          data: {
            label: `New ${config.label}`,
            groupType,
            collapsed: false,
          },
        };

        addNode(newGroup as Node);
        return;
      }

      // Regular architecture node
      const nodeType = type as ArchitectureNodeType;
      const config = NODE_TYPES_CONFIG[nodeType];
      
      const newNode: ArchitectureNode = {
        id: `node-${Date.now()}`,
        type: 'architecture',
        position,
        data: {
          label: `New ${config.label}`,
          type: nodeType,
        },
      };

      addNode(newNode);
    },
    [screenToFlowPosition, addNode]
  );

  // Handle node click
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node.id);
    },
    [setSelectedNode]
  );

  // Handle edge click
  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: { id: string }) => {
      setSelectedEdge(edge.id);
    },
    [setSelectedEdge]
  );

  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, [setSelectedNode, setSelectedEdge]);

  // Update zoom display
  const onMoveEnd = useCallback(() => {
    setZoom(Math.round(getZoom() * 100));
  }, [getZoom]);

  // Handle node drag stop - auto-parent to group if dropped inside
  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      // Skip if it's a group node itself
      if (node.type === 'group') return;

      // If node is already parented and has extent='parent', it's constrained - don't modify
      if (node.parentId && node.extent === 'parent') {
        return;
      }

      // Find all group nodes
      const groupNodes = nodes.filter(n => n.type === 'group');
      
      // Check if the node intersects with any group
      const intersectingGroups = getIntersectingNodes(node, groupNodes);
      
      if (intersectingGroups.length > 0) {
        // Parent to the first intersecting group
        const targetGroup = intersectingGroups[0];
        
        // Only update if not already parented to this group
        if (node.parentId !== targetGroup.id) {
          addNodeToGroup(node.id, targetGroup.id);
        }
      } else if (node.parentId && !node.extent) {
        // Only remove from group if node doesn't have extent constraint
        removeNodeFromGroup(node.id);
      }
    },
    [nodes, addNodeToGroup, removeNodeFromGroup, getIntersectingNodes]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { selectedNodeId, selectedEdgeId, deleteNode, deleteEdge, undo, redo } = useDiagramStore.getState();
      
      // Toggle modes: V for select, H for hand/pan
      if (event.key === 'v' || event.key === 'V') {
        setPanMode(false);
        return;
      }
      if (event.key === 'h' || event.key === 'H') {
        setPanMode(true);
        return;
      }
      
      // Delete - handle both single and multi-selection
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        
        // Check for multi-selected nodes
        const selectedNodes = nodes.filter(n => n.selected);
        
        if (selectedNodes.length > 0) {
          deleteSelectedNodes();
        } else if (selectedNodeId) {
          deleteNode(selectedNodeId);
        } else if (selectedEdgeId) {
          deleteEdge(selectedEdgeId);
        }
      }
      
      // Duplicate: Cmd/Ctrl + D
      if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
        event.preventDefault();
        
        const selectedNodes = nodes.filter(n => n.selected);
        if (selectedNodes.length > 0) {
          duplicateNodes(selectedNodes.map(n => n.id));
        } else if (selectedNodeId) {
          duplicateNodes([selectedNodeId]);
        }
      }
      
      // Undo: Ctrl/Cmd + Z
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
      }
      
      // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodes, deleteSelectedNodes, duplicateNodes]);

  return (
    <div className="flex-1 relative bg-zinc-950 overflow-hidden">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none z-0" />

      {/* Toolbar Overlay */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-full p-1.5 flex gap-1 shadow-lg shadow-black/50 z-20">
        <button 
          onClick={() => setPanMode(false)}
          className={cn(
            "p-2 rounded-full transition-colors",
            !panMode 
              ? "bg-zinc-700 text-zinc-100" 
              : "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100"
          )}
          title="Select (V)"
        >
          <CursorArrowRaysIcon className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setPanMode(true)}
          className={cn(
            "p-2 rounded-full transition-colors",
            panMode 
              ? "bg-zinc-700 text-zinc-100" 
              : "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100"
          )}
          title="Pan (H)"
        >
          <HandRaisedIcon className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-zinc-800 my-auto mx-1" />
        <button 
          onClick={() => zoomOut()}
          className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-zinc-100 transition-colors" 
          title="Zoom Out"
        >
          <MinusIcon className="w-4 h-4" />
        </button>
        <span className="text-xs font-medium text-zinc-500 flex items-center px-2">
          {zoom}%
        </span>
        <button 
          onClick={() => zoomIn()}
          className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-zinc-100 transition-colors" 
          title="Zoom In"
        >
          <PlusIcon className="w-4 h-4" />
        </button>
      </div>

      {/* React Flow Canvas */}
      <div ref={reactFlowWrapper} className="w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          onMoveEnd={onMoveEnd}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{
            type: 'architecture',
          }}
          fitView
          snapToGrid
          snapGrid={[10, 10]}
          proOptions={{ hideAttribution: true }}
          style={{ background: 'transparent' }}
          selectionOnDrag={!panMode}
          panOnDrag={panMode ? true : [1, 2]}
          panOnScroll
          zoomOnScroll={false}
          zoomOnPinch
          multiSelectionKeyCode="Shift"
        />
      </div>
    </div>
  );
}
