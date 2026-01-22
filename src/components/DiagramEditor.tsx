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
  PlusIcon,
  ArrowDownTrayIcon,
  DocumentDuplicateIcon,
  ClipboardDocumentIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';
import { exportSelectedAsSvg, exportSelectedAsPng } from '@/utils/export';
import { ShortcutsHelp } from '@/components/panels/ShortcutsHelp';
import { ImportDialog } from '@/components/ui/ImportDialog';

export function DiagramEditor() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null!);
  const { screenToFlowPosition, zoomIn, zoomOut, getZoom, getIntersectingNodes, getViewport } = useReactFlow();
  const [zoom, setZoom] = useState(100);
  const [panMode, setPanMode] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; show: boolean }>({ x: 0, y: 0, show: false });
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  
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
    copySelectedNodes,
    pasteNodes,
    hasClipboardContent,
  } = useDiagramStore();

  // Load saved diagram on mount
  useEffect(() => {
    loadDiagram();
  }, [loadDiagram]);

  // Prevent default context menu on the diagram
  useEffect(() => {
    const preventContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Only prevent if clicking on the React Flow canvas
      if (target.closest('.react-flow')) {
        e.preventDefault();
        
        const selectedNodes = nodes.filter(n => n.selected);
        const hasClipboard = hasClipboardContent();
        
        // Show context menu if there are selected nodes or clipboard has content
        if (selectedNodes.length > 0 || hasClipboard) {
          setContextMenu({
            x: e.clientX,
            y: e.clientY,
            show: true,
          });
        }
      }
    };

    document.addEventListener('contextmenu', preventContextMenu);
    return () => document.removeEventListener('contextmenu', preventContextMenu);
  }, [nodes, hasClipboardContent]);

  // Helper function to add node at viewport center
  const addNodeAtCenter = useCallback((type: ArchitectureNodeType | string) => {
    const viewport = getViewport();
    const bounds = reactFlowWrapper.current?.getBoundingClientRect();
    if (!bounds) return;

    // Calculate center of viewport
    const centerX = bounds.width / 2;
    const centerY = bounds.height / 2;
    
    const position = screenToFlowPosition({
      x: centerX,
      y: centerY,
    });

    // Check if it's a comment node
    if (type === 'comment') {
      const newComment: Node = {
        id: `comment-${Date.now()}`,
        type: 'comment',
        position,
        data: {
          text: 'Add your note here...',
          color: 'yellow',
          createdAt: new Date().toISOString(),
        },
      };

      addNode(newComment);
      return;
    }

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
  }, [screenToFlowPosition, addNode, getViewport]);

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

      // Check if it's a comment node
      if (type === 'comment') {
        const newComment: Node = {
          id: `comment-${Date.now()}`,
          type: 'comment',
          position,
          data: {
            text: 'Add your note here...',
            color: 'yellow',
            createdAt: new Date().toISOString(),
          },
        };

        addNode(newComment);
        return;
      }

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
    setContextMenu({ x: 0, y: 0, show: false });
  }, [setSelectedNode, setSelectedEdge]);

  // Handle export selected as SVG
  const handleExportSelectedSvg = useCallback(async () => {
    const selectedNodes = nodes.filter(n => n.selected);
    if (selectedNodes.length === 0) return;

    try {
      await exportSelectedAsSvg(selectedNodes);
      setContextMenu({ x: 0, y: 0, show: false });
    } catch (error) {
      console.error('Failed to export selection:', error);
    }
  }, [nodes]);

  // Handle export selected as PNG
  const handleExportSelectedPng = useCallback(async () => {
    const selectedNodes = nodes.filter(n => n.selected);
    if (selectedNodes.length === 0) return;

    try {
      await exportSelectedAsPng(selectedNodes);
      setContextMenu({ x: 0, y: 0, show: false });
    } catch (error) {
      console.error('Failed to export selection:', error);
    }
  }, [nodes]);

  // Handle copy selected nodes
  const handleCopy = useCallback(() => {
    copySelectedNodes();
    setContextMenu({ x: 0, y: 0, show: false });
  }, [copySelectedNodes]);

  // Handle paste nodes at context menu position
  const handlePaste = useCallback(() => {
    const position = screenToFlowPosition({
      x: contextMenu.x,
      y: contextMenu.y,
    });
    pasteNodes(position);
    setContextMenu({ x: 0, y: 0, show: false });
  }, [pasteNodes, screenToFlowPosition, contextMenu.x, contextMenu.y]);

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
      const intersectingGroups = getIntersectingNodes(node).filter(n => n.type === 'group');
      
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
      
      // Ignore shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      
      // Node creation shortcuts (lowercase keys)
      if (!event.ctrlKey && !event.metaKey && !event.altKey) {
        switch (event.key.toLowerCase()) {
          case 's':
            event.preventDefault();
            addNodeAtCenter('service');
            return;
          case 'd':
            event.preventDefault();
            addNodeAtCenter('database');
            return;
          case 'q':
            event.preventDefault();
            addNodeAtCenter('queue');
            return;
          case 'c':
            event.preventDefault();
            addNodeAtCenter('cache');
            return;
          case 'g':
            event.preventDefault();
            addNodeAtCenter('gateway');
            return;
          case 'e':
            event.preventDefault();
            addNodeAtCenter('external');
            return;
          case 't':
            event.preventDefault();
            addNodeAtCenter('storage');
            return;
          case 'l':
            event.preventDefault();
            addNodeAtCenter('client');
            return;
          case 'n':
            event.preventDefault();
            addNodeAtCenter('comment');
            return;
          // Tier 1: Cloud Infrastructure shortcuts
          case 'f':
            event.preventDefault();
            addNodeAtCenter('lambda');
            return;
          case 'b':
            event.preventDefault();
            addNodeAtCenter('loadbalancer');
            return;
          case 'y':
            event.preventDefault();
            addNodeAtCenter('cdn');
            return;
          case 'a':
            event.preventDefault();
            addNodeAtCenter('auth');
            return;
          case 'p':
            event.preventDefault();
            addNodeAtCenter('container');
            return;
          case 'z':
            event.preventDefault();
            addNodeAtCenter('dns');
            return;
          // Tier 2: AI/ML shortcuts
          case 'm':
            event.preventDefault();
            addNodeAtCenter('llm');
            return;
          case 'x':
            event.preventDefault();
            addNodeAtCenter('vectordb');
            return;
          case 'w':
            event.preventDefault();
            addNodeAtCenter('mlpipeline');
            return;
          case 'i':
            event.preventDefault();
            addNodeAtCenter('embedding');
            return;
          // Tier 3: Cloud Services shortcuts
          case 'k':
            event.preventDefault();
            addNodeAtCenter('secrets');
            return;
          case 'u':
            event.preventDefault();
            addNodeAtCenter('eventbus');
            return;
          case 'j':
            event.preventDefault();
            addNodeAtCenter('datalake');
            return;
          case 'r':
            event.preventDefault();
            addNodeAtCenter('search');
            return;
          case 'o':
            event.preventDefault();
            addNodeAtCenter('notification');
            return;
        }
      }

      // Group creation shortcuts (Shift + key)
      if (event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
        switch (event.key.toUpperCase()) {
          case 'V':
            event.preventDefault();
            addNodeAtCenter('group-vpc');
            return;
          case 'K':
            event.preventDefault();
            addNodeAtCenter('group-cluster');
            return;
          case 'R':
            event.preventDefault();
            addNodeAtCenter('group-region');
            return;
          case 'N':
            event.preventDefault();
            addNodeAtCenter('group-subnet');
            return;
        }
      }
      
      // Toggle modes: V for select, H for hand/pan
      if (event.key === 'v' || event.key === 'V') {
        setPanMode(false);
        return;
      }
      if (event.key === 'h' || event.key === 'H') {
        setPanMode(true);
        return;
      }
      
      // Show shortcuts: ?
      if (event.key === '?' && !event.shiftKey) {
        event.preventDefault();
        setShowShortcuts(true);
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
      
      // Copy: Ctrl/Cmd + C
      if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
        const selectedNodes = nodes.filter(n => n.selected);
        if (selectedNodes.length > 0) {
          event.preventDefault();
          const { copySelectedNodes } = useDiagramStore.getState();
          copySelectedNodes();
        }
      }
      
      // Paste: Ctrl/Cmd + V
      if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
        const { hasClipboardContent, pasteNodes } = useDiagramStore.getState();
        if (hasClipboardContent()) {
          event.preventDefault();
          pasteNodes(); // Paste with default offset
        }
      }
      
      // Auto-layout: Ctrl/Cmd + L
      if ((event.ctrlKey || event.metaKey) && event.key === 'l') {
        event.preventDefault();
        const { applyAutoLayout } = useDiagramStore.getState();
        applyAutoLayout('TB'); // Default to top-to-bottom
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodes, deleteSelectedNodes, duplicateNodes, addNodeAtCenter]);

  return (
    <div className="flex-1 relative bg-white dark:bg-zinc-950 overflow-hidden">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-50 dark:opacity-60 pointer-events-none z-0" />

      {/* Context Menu */}
      {contextMenu.show && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setContextMenu({ x: 0, y: 0, show: false })}
          />
          <div
            className="fixed z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden animate-slide-in min-w-48"
            style={{
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`,
            }}
          >
            <div className="p-1">
              {/* Copy/Paste Section */}
              {nodes.filter(n => n.selected).length > 0 && (
                <button
                  onClick={handleCopy}
                  className="w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white rounded-md flex items-center gap-2"
                >
                  <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                  Copy
                  <span className="ml-auto text-zinc-400 dark:text-zinc-500">Ctrl+C</span>
                </button>
              )}
              {hasClipboardContent() && (
                <button
                  onClick={handlePaste}
                  className="w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white rounded-md flex items-center gap-2"
                >
                  <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                  Paste
                  <span className="ml-auto text-zinc-400 dark:text-zinc-500">Ctrl+V</span>
                </button>
              )}
              {/* Divider */}
              {nodes.filter(n => n.selected).length > 0 && (
                <div className="my-1 h-px bg-zinc-200 dark:bg-zinc-700" />
              )}
              {/* Export Section */}
              {nodes.filter(n => n.selected).length > 0 && (
                <>
                  <button
                    onClick={handleExportSelectedSvg}
                    className="w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white rounded-md flex items-center gap-2"
                  >
                    <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                    Export Selection as SVG
                  </button>
                  <button
                    onClick={handleExportSelectedPng}
                    className="w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white rounded-md flex items-center gap-2"
                  >
                    <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                    Export Selection as PNG
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Toolbar Overlay */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur border border-zinc-200 dark:border-zinc-800 rounded-full p-1.5 flex gap-1 shadow-lg shadow-black/20 dark:shadow-black/50 z-20">
        <button 
          onClick={() => setPanMode(false)}
          className={cn(
            "p-2 rounded-full transition-colors",
            !panMode 
              ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100" 
              : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
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
              ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100" 
              : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          )}
          title="Pan (H)"
        >
          <HandRaisedIcon className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 my-auto mx-1" />
        <button 
          onClick={() => zoomOut()}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" 
          title="Zoom Out"
        >
          <MinusIcon className="w-4 h-4" />
        </button>
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-500 flex items-center px-2">
          {zoom}%
        </span>
        <button 
          onClick={() => zoomIn()}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" 
          title="Zoom In"
        >
          <PlusIcon className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 my-auto mx-1" />
        <button
          onClick={() => setShowShortcuts(true)}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          title="Keyboard Shortcuts (?)"
        >
          <span className="text-xs font-semibold">?</span>
        </button>
        <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 my-auto mx-1" />
        <button
          onClick={() => setShowImportDialog(true)}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          title="Import Diagram"
        >
          <ArrowUpTrayIcon className="w-4 h-4" />
        </button>
      </div>


      {/* Import Dialog */}
      <ImportDialog 
        isOpen={showImportDialog} 
        onClose={() => setShowImportDialog(false)} 
      />
      {/* Shortcuts Help Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowShortcuts(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <ShortcutsHelp onClose={() => setShowShortcuts(false)} />
          </div>
        </div>
      )}

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
