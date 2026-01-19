import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { NODE_TYPES_CONFIG } from '@/constants';
import { ArchitectureNodeData } from '@/types';

export const ArchitectureNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as ArchitectureNodeData;
  const config = NODE_TYPES_CONFIG[nodeData.type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'relative flex flex-col items-center gap-2 p-3 min-w-30 rounded-xl bg-zinc-900/90 border backdrop-blur-sm cursor-grab active:cursor-grabbing transition-all hover:border-zinc-600',
        selected 
          ? 'node-selected z-20 border-zinc-400' 
          : 'border-zinc-800 z-10'
      )}
    >
      {/* Input Port - Top */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-2! h-2! rounded-full! bg-zinc-700! border-2! border-zinc-950! -top-1!"
      />

      {/* Icon */}
      <div className={cn('p-2.5 rounded-lg', config.bgClass, config.borderClass, 'border')}>
        <Icon className={cn('w-5 h-5', config.iconColor)} strokeWidth={1.5} />
      </div>
      
      {/* Label & Type */}
      <div className="flex flex-col items-center text-center">
        <span className="text-xs font-semibold text-zinc-200">
          {nodeData.label}
        </span>
        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-tight">
          {nodeData.type}
        </span>
      </div>
      
      {/* Output Port - Bottom */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2! h-2! rounded-full! bg-zinc-700! border-2! border-zinc-950! -bottom-1!"
      />

      {/* Left Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="w-2! h-2! rounded-full! bg-zinc-700! border-2! border-zinc-950!"
      />

      {/* Right Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="w-2! h-2! rounded-full! bg-zinc-700! border-2! border-zinc-950!"
      />
    </div>
  );
});

ArchitectureNode.displayName = 'ArchitectureNode';
