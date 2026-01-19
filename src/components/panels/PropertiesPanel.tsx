import { useDiagramStore } from '@/store/diagramStore';
import { NODE_TYPES_CONFIG, GROUP_TYPES_CONFIG } from '@/constants';
import { ArchitectureNodeType, ArchitectureNodeData, ArchitectureEdgeData, EdgeProtocol, HttpMethod, NodeStatus, GroupNodeData, GroupNodeType } from '@/types';
import { cn } from '@/lib/utils';
import { 
  XMarkIcon, 
  TrashIcon, 
  CursorArrowRippleIcon,
  ChevronDownIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import { useState } from 'react';

export function PropertiesPanel() {
  const { 
    nodes, 
    edges, 
    selectedNodeId, 
    selectedEdgeId,
    setSelectedNode,
    setSelectedEdge,
    updateNodeData,
    updateGroupData,
    toggleGroupCollapse,
    updateEdgeData,
    deleteNode,
    deleteEdge,
    addNodeToGroup,
    removeNodeFromGroup,
  } = useDiagramStore();

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);

  if (!selectedNode && !selectedEdge) {
    return (
      <aside className="w-80 bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 flex flex-col z-20">
        <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-5 justify-between">
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Properties</span>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <div className="text-center mt-20 opacity-40">
            <CursorArrowRippleIcon className="w-8 h-8 mx-auto mb-3 text-zinc-400 dark:text-zinc-500" />
            <p className="text-xs text-zinc-500 dark:text-zinc-500">Select a node to view properties</p>
          </div>
        </div>
      </aside>
    );
  }

  if (selectedNode) {
    // Check if it's a group node
    if (selectedNode.type === 'group') {
      const groupData = selectedNode.data as unknown as GroupNodeData;
      const config = GROUP_TYPES_CONFIG[groupData.groupType] || GROUP_TYPES_CONFIG.vpc;
      const Icon = config.icon;

      return (
        <aside className="w-80 bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 flex flex-col z-20">
          {/* Header */}
          <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-5 justify-between">
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Group Properties</span>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors">
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-8 animate-slide-in">
            {/* Header Section */}
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-100/30 dark:bg-zinc-900/30">
                <Icon className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                  {groupData.label}
                </h2>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-500 font-mono">
                  ID: {selectedNode.id.slice(-8).toUpperCase()}
                </span>
              </div>
            </div>

            <hr className="border-zinc-200 dark:border-zinc-800" />

            {/* Fields */}
            <div className="space-y-4">
              {/* Display Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Label
                </label>
                <input
                  type="text"
                  value={groupData.label}
                  onChange={(e) => updateGroupData(selectedNode.id, { label: e.target.value })}
                onKeyDown={(e) => e.stopPropagation()} />
                </div>
              {/* Group Type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Type
                </label>
                <div className="relative">
                  <select
                    value={groupData.groupType}
                    onChange={(e) => updateGroupData(selectedNode.id, { groupType: e.target.value as GroupNodeType })}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="w-full appearance-none bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none transition-colors">
                  
                    {(Object.keys(GROUP_TYPES_CONFIG) as GroupNodeType[]).map((type) => (
                      <option key={type} value={type}>
                        {GROUP_TYPES_CONFIG[type].label}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="absolute right-2 top-2 w-3 h-3 text-zinc-500 pointer-events-none" />
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Description
                </label>
                <textarea
                  value={groupData.description || ''}
                  onChange={(e) => updateGroupData(selectedNode.id, { description: e.target.value })}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="Describe this group..."
                  rows={3}
                  className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none transition-colors resize-none"
                />
              </div>

              {/* Collapsed Toggle */}
              <div className="flex items-center justify-between py-1">
                <label className="text-xs text-zinc-700 dark:text-zinc-300">Collapsed</label>
                <ToggleSwitch
                  checked={groupData.collapsed || false}
                  onChange={() => toggleGroupCollapse(selectedNode.id)}
                />
              </div>
            </div>

            {/* Metadata Section */}
            <div className="bg-zinc-100/50 dark:bg-zinc-900/50 rounded-lg p-3 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="flex justify-between text-[10px]">
                <span className="text-zinc-500 dark:text-zinc-500">Group ID</span>
                <span className="text-zinc-700 dark:text-zinc-300 font-mono">{selectedNode.id.slice(-12)}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-zinc-500 dark:text-zinc-500">Position X</span>
                <span className="text-zinc-700 dark:text-zinc-300 font-mono">{Math.round(selectedNode.position.x)}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-zinc-500 dark:text-zinc-500">Position Y</span>
                <span className="text-zinc-700 dark:text-zinc-300 font-mono">{Math.round(selectedNode.position.y)}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-zinc-500 dark:text-zinc-500">Width</span>
                <span className="text-zinc-700 dark:text-zinc-300 font-mono">{(selectedNode.style?.width as number) || 300}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-zinc-500 dark:text-zinc-500">Height</span>
                <span className="text-zinc-700 dark:text-zinc-300 font-mono">{(selectedNode.style?.height as number) || 250}</span>
              </div>
            </div>

            {/* Delete Button */}
            <button
              onClick={() => deleteNode(selectedNode.id)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-red-400 bg-red-950/50 border border-red-900/50 rounded-lg hover:bg-red-900/50 transition-colors"
            >
              <TrashIcon className="w-3 h-3" />
              Delete Group
            </button>
          </div>
        </aside>
      );
    }

    // Regular architecture node
    const nodeData = selectedNode.data as ArchitectureNodeData;
    const config = NODE_TYPES_CONFIG[nodeData.type];
    const Icon = config.icon;

    return (
      <aside className="w-80 bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 flex flex-col z-20">
        {/* Header */}
        <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-5 justify-between">
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Properties</span>
          <button
            onClick={() => setSelectedNode(null)}
            className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors">
          
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-8 animate-slide-in">
          {/* Header Section */}
          <div className="flex items-start gap-4">
            <div className={cn('p-3 rounded-lg border', config.bgClass, config.borderClass)}>
              <Icon className={cn('w-5 h-5', config.iconColor)} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                {nodeData.label}
              </h2>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-500 font-mono">
                ID: {selectedNode.id.slice(-8).toUpperCase()}
              </span>
            </div>
          </div>

          <hr className="border-zinc-200 dark:border-zinc-800" />

          {/* Fields */}
          <div className="space-y-4">
            {/* Display Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Display Name
              </label>
              <input
                type="text"
                value={nodeData.label}
                onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
                onKeyDown={(e) => e.stopPropagation()}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none transition-colors"
              />
            </div>

            {/* Type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Component Type
              </label>
              <div className="relative">
                <select
                  value={nodeData.type}
                  onChange={(e) => updateNodeData(selectedNode.id, { type: e.target.value as ArchitectureNodeType })}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="w-full appearance-none bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none transition-colors">
                
                  {(Object.keys(NODE_TYPES_CONFIG) as ArchitectureNodeType[]).map((type) => (
                    <option key={type} value={type}>
                      {NODE_TYPES_CONFIG[type].label}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-2 top-2 w-3 h-3 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
              </div>
            </div>

            {/* Technology */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Technology
              </label>
              <input
                type="text"
                value={nodeData.technology || ''}
                onChange={(e) => updateNodeData(selectedNode.id, { technology: e.target.value })}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="e.g., Node.js, PostgreSQL"
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none transition-colors"
              />
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Status
              </label>
              <div className="relative">
                <select
                  value={nodeData.status || ''}
                  onChange={(e) => updateNodeData(selectedNode.id, { status: e.target.value as NodeStatus || undefined })}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="w-full appearance-none bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none transition-colors">
                
                  <option value="">None</option>
                  <option value="active">Healthy</option>
                  <option value="warning">Degraded</option>
                  <option value="inactive">Maintenance</option>
                </select>
                <ChevronDownIcon className="absolute right-2 top-2 w-3 h-3 text-zinc-500 pointer-events-none" />
              </div>
            </div>

            {/* Port */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Port
              </label>
              <input
                type="text"
                value={nodeData.port || ''}
                onChange={(e) => updateNodeData(selectedNode.id, { port: e.target.value })}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="e.g., 3000, 5432"
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none transition-colors"
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Description
              </label>
              <textarea
                value={nodeData.description || ''}
                onChange={(e) => updateNodeData(selectedNode.id, { description: e.target.value })}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="Describe this component..."
                rows={3}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* Parent Group */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Parent Group
              </label>
              <div className="relative">
                <select
                  value={selectedNode.parentId || nodeData.parentId || ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      addNodeToGroup(selectedNode.id, e.target.value);
                    } else {
                      removeNodeFromGroup(selectedNode.id);
                    }
                  }}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="w-full appearance-none bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none transition-colors">
                
                  <option value="">None (Drag to assign)</option>
                  {nodes
                    .filter(n => n.type === 'group')
                    .map(group => (
                      <option key={group.id} value={group.id}>
                        {(group.data as any).label || 'Unnamed Group'}
                      </option>
                    ))}
                </select>
                <Squares2X2Icon className="absolute right-2 top-2 w-3 h-3 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-500 mt-0.5">
                Tip: Drag node inside a group to auto-assign
              </p>
            </div>
          </div>

          {/* Metadata Section */}
          <div className="bg-zinc-100/50 dark:bg-zinc-900/50 rounded-lg p-3 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="flex justify-between text-[10px]">
              <span className="text-zinc-500 dark:text-zinc-500">Node ID</span>
              <span className="text-zinc-700 dark:text-zinc-300 font-mono">{selectedNode.id.slice(-12)}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-zinc-500 dark:text-zinc-500">Position X</span>
              <span className="text-zinc-700 dark:text-zinc-300 font-mono">{Math.round(selectedNode.position.x)}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-zinc-500 dark:text-zinc-500">Position Y</span>
              <span className="text-zinc-700 dark:text-zinc-300 font-mono">{Math.round(selectedNode.position.y)}</span>
            </div>
          </div>

          {/* Delete Button */}
          <button
            onClick={() => deleteNode(selectedNode.id)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
          >
            <TrashIcon className="w-3 h-3" />
            Delete Node
          </button>
        </div>
      </aside>
    );
  }

  if (selectedEdge) {
    const edgeData = (selectedEdge.data || {}) as ArchitectureEdgeData;
    
    return (
      <aside className="w-80 bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 flex flex-col z-20">
        {/* Header */}
        <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-5 justify-between">
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Connection</span>
          <button
            onClick={() => setSelectedEdge(null)}
            className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors">
          
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 animate-slide-in">
          {/* Fields */}
          <div className="space-y-4">
            {/* Label */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Label
              </label>
              <input
                type="text"
                value={edgeData.label || ''}
                onChange={(e) => updateEdgeData(selectedEdge.id, { label: e.target.value })}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="e.g., /api/users"
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none transition-colors"
              />
            </div>

            {/* Protocol */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Protocol
              </label>
              <div className="relative">
                <select
                  value={edgeData.protocol || 'http'}
                  onChange={(e) => updateEdgeData(selectedEdge.id, { protocol: e.target.value as EdgeProtocol })}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="w-full appearance-none bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none transition-colors"
                >
                  <option value="http">HTTP/REST</option>
                  <option value="grpc">gRPC</option>
                  <option value="websocket">WebSocket</option>
                  <option value="tcp">TCP</option>
                  <option value="amqp">AMQP</option>
                  <option value="kafka">Kafka</option>
                </select>
                <ChevronDownIcon className="absolute right-2 top-2 w-3 h-3 text-zinc-500 pointer-events-none" />
              </div>
            </div>

            {/* HTTP Method */}
            {(edgeData.protocol === 'http' || !edgeData.protocol) && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  HTTP Method
                </label>
                <div className="relative">
                  <select
                    value={edgeData.method || ''}
                    onChange={(e) => updateEdgeData(selectedEdge.id, { method: e.target.value as HttpMethod || undefined })}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="w-full appearance-none bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-200 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none transition-colors"
                  >
                    <option value="">None</option>
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                  <ChevronDownIcon className="absolute right-2 top-2 w-3 h-3 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Animated Toggle */}
            <div className="flex items-center justify-between py-1">
              <label className="text-xs text-zinc-700 dark:text-zinc-300">Animated</label>
              <div className="flex flex-col">
                <label className="text-xs text-zinc-300">Animated Flow</label>
                <span className="text-[10px] text-zinc-500">Show data passing</span>
              </div>
              <ToggleSwitch
                checked={edgeData.animated || false}
                onChange={(checked) => updateEdgeData(selectedEdge.id, { animated: checked })}
              />
            </div>

            {/* Async Toggle */}
            <div className="flex items-center justify-between py-1">
              <label className="text-xs text-zinc-700 dark:text-zinc-300">Asynchronous</label>
              <ToggleSwitch
                checked={edgeData.async || false}
                onChange={(checked) => updateEdgeData(selectedEdge.id, { async: checked })}
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Description
              </label>
              <textarea
                value={edgeData.description || ''}
                onChange={(e) => updateEdgeData(selectedEdge.id, { description: e.target.value })}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="Describe this connection..."
                rows={3}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none transition-colors resize-none"
              />
            </div>
          </div>

          {/* Metadata Section */}
          <div className="bg-zinc-100/50 dark:bg-zinc-900/50 rounded-lg p-3 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="flex justify-between text-[10px]">
              <span className="text-zinc-500 dark:text-zinc-500">Edge ID</span>
              <span className="text-zinc-700 dark:text-zinc-300 font-mono">{selectedEdge.id.slice(-12)}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-zinc-500 dark:text-zinc-500">Source</span>
              <span className="text-zinc-700 dark:text-zinc-300 font-mono">{selectedEdge.source.slice(-8)}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-zinc-500 dark:text-zinc-500">Target</span>
              <span className="text-zinc-700 dark:text-zinc-300 font-mono">{selectedEdge.target.slice(-8)}</span>
            </div>
          </div>

          {/* Delete Button */}
          <button
            onClick={() => deleteEdge(selectedEdge.id)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
          >
            <TrashIcon className="w-3 h-3" />
            Delete Connection
          </button>
        </div>
      </aside>
    );
  }

  return null;
}

// Custom Toggle Switch Component
function ToggleSwitch({ 
  checked, 
  onChange 
}: { 
  checked: boolean; 
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        'w-9 h-5 rounded-full border relative transition-colors',
        checked 
          ? 'bg-zinc-900 dark:bg-zinc-100 border-zinc-700 dark:border-zinc-300' 
          : 'bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all',
          checked 
            ? 'left-4.5 bg-zinc-100 dark:bg-zinc-900' 
            : 'left-0.5 bg-zinc-600 dark:bg-zinc-400'
        )}
      />
    </button>
  );
}
