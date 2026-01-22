import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { NODE_TYPES_CONFIG } from '@/constants';
import { ArchitectureNodeData } from '@/types';

export const ArchitectureNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as ArchitectureNodeData;
  const config = NODE_TYPES_CONFIG[nodeData.type];
  const Icon = config.icon;

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
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">
            {nodeData.label}
          </span>
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
    </div>
  );
});

ArchitectureNode.displayName = 'ArchitectureNode';
