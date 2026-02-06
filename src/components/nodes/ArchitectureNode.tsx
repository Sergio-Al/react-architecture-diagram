import { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { NODE_TYPES_CONFIG, HEALTH_STATUS_STYLES } from '@/constants';
import { ArchitectureNodeData } from '@/types';
import { useDiagramStore } from '@/store/diagramStore';
import { HeartIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export const ArchitectureNode = memo(({ data, selected, id }: NodeProps) => {
  const nodeData = data as unknown as ArchitectureNodeData;
  const config = NODE_TYPES_CONFIG[nodeData.type];
  const Icon = config.icon;
  const getNodeHealthResult = useDiagramStore(state => state.getNodeHealthResult);
  const updateNodeData = useDiagramStore(state => state.updateNodeData);
  
  // Inline editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Auto-focus and select text when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const getStatusColor = () => {
    switch (nodeData.status) {
      case 'active':
        return 'bg-emerald-500 border-emerald-400';
      case 'warning':
        return 'bg-amber-500 border-amber-400';
      case 'inactive':
        return 'bg-zinc-400 dark:bg-zinc-600 border-zinc-300 dark:border-zinc-500';
      default:
        return null;
    }
  };

  const statusColor = getStatusColor();
  const healthResult = getNodeHealthResult(id);
  const hasHealthCheck = !!nodeData.healthCheckUrl;

  return (
    <div
      className={cn(
        'relative flex flex-col items-center gap-2 p-3 min-w-30 rounded-xl bg-white/90 dark:bg-zinc-900/90 border backdrop-blur-sm cursor-grab active:cursor-grabbing transition-all hover:border-zinc-400 dark:hover:border-zinc-600',
        selected
          ? 'node-selected z-20 border-zinc-500 dark:border-zinc-400'
          : 'border-zinc-300 dark:border-zinc-800 z-10'
      )}
    >
      {/* Input Port - Top */}
      <Handle
        type="target"
        position={Position.Top}
        title="Input"
        className="!w-2 !h-2 !rounded-full !bg-zinc-300 dark:!bg-zinc-700 !border-2 !border-white dark:!border-zinc-950 !-top-1 hover:!scale-150 !transition-transform"
      />

      {/* Icon */}
      <div className={cn('p-2.5 rounded-lg', config.bgClass, config.borderClass, 'border')}>
        <Icon className={cn('w-5 h-5', config.iconColor)} strokeWidth={1.5} />
      </div>

      {/* Label & Type */}
      <div className="flex flex-col items-center text-center">
        <div className='flex items-center gap-1.5'>
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') {
                  const trimmed = editValue.trim();
                  if (trimmed) {
                    updateNodeData(id, { label: trimmed });
                  }
                  setIsEditing(false);
                } else if (e.key === 'Escape') {
                  setIsEditing(false);
                }
              }}
              onBlur={() => setIsEditing(false)}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="nodrag nowheel nopan text-xs font-semibold text-zinc-900 dark:text-zinc-200 bg-transparent border-b border-zinc-400 dark:border-zinc-600 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-center w-full max-w-[120px] px-1"
            />
          ) : (
            <span 
              className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 cursor-text"
              onDoubleClick={() => {
                setEditValue(nodeData.label);
                setIsEditing(true);
              }}
            >
              {nodeData.label}
            </span>
          )}
          {statusColor && (
            <div className={cn(
              'w-2 h-2 rounded-full border border-white dark:border-zinc-950 shadow-sm',
              statusColor
            )} />
          )}
        </div>
        <span className="text-[9px] font-mono text-zinc-500 dark:text-zinc-500 uppercase tracking-tight">
          {nodeData.type}
        </span>
      </div>

      {/* Output Port - Bottom */}
      <Handle
        type="source"
        position={Position.Bottom}
        title="Output"
        className="!w-2 !h-2 !rounded-full !bg-zinc-200 dark:!bg-zinc-500 !border-2 !border-white dark:!border-zinc-950 !-bottom-1 hover:!scale-150 !transition-transform"
      />

      {/* Left Handle - Input */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        title="Input"
        className="!w-2 !h-2 !rounded-full !bg-zinc-300 dark:!bg-zinc-700 !border-2 !border-white dark:!border-zinc-950 hover:!scale-150 !transition-transform"
      />

      {/* Right Handle - Output */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        title="Output"
        className="!w-2 !h-2 !rounded-full !bg-zinc-300 dark:!bg-zinc-700 !border-2 !border-white dark:!border-zinc-950 hover:!scale-150 !transition-transform"
      />

      {/* Health Check Indicator */}
      {hasHealthCheck && (
        <div className="absolute -top-1 -right-1 z-10">
          {healthResult?.loading ? (
            <div className={cn(
              'w-4 h-4 rounded-full border-2 border-white dark:border-zinc-950 flex items-center justify-center shadow-sm',
              HEALTH_STATUS_STYLES.loading.bg
            )}>
              <ArrowPathIcon className={cn('w-2.5 h-2.5 animate-spin', HEALTH_STATUS_STYLES.loading.icon)} />
            </div>
          ) : healthResult ? (
            <div 
              className={cn(
                'w-4 h-4 rounded-full border-2 border-white dark:border-zinc-950 flex items-center justify-center shadow-sm',
                HEALTH_STATUS_STYLES[healthResult.status].bg
              )}
              title={`Health: ${healthResult.status} (${healthResult.latency}ms)`}
            >
              <HeartIcon className={cn('w-2.5 h-2.5', HEALTH_STATUS_STYLES[healthResult.status].icon)} strokeWidth={2} />
            </div>
          ) : (
            <div 
              className="w-4 h-4 rounded-full border-2 border-white dark:border-zinc-950 bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center shadow-sm"
              title="Health check configured"
            >
              <HeartIcon className="w-2.5 h-2.5 text-zinc-500 dark:text-zinc-400" strokeWidth={2} />
            </div>
          )}
        </div>
      )}
    </div>
  );
});

ArchitectureNode.displayName = 'ArchitectureNode';
