import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
} from '@xyflow/react';
import { cn } from '@/lib/utils';
import { ArchitectureEdgeData } from '@/types';

export function ArchitectureEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) {
  const edgeData = data as ArchitectureEdgeData | undefined;
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isAnimated = edgeData?.animated ?? false;

  const getProtocolColor = () => {
    switch (edgeData?.protocol) {
      case 'http':
      case 'https':
        return { primary: '#3b82f6', secondary: '#60a5fa' }; // Blue
      case 'grpc':
        return { primary: '#10b981', secondary: '#34d399' }; // Green
      case 'websocket':
        return { primary: '#8b5cf6', secondary: '#a78bfa' }; // Purple
      case 'amqp':
      case 'rabbitmq':
        return { primary: '#f59e0b', secondary: '#fbbf24' }; // Amber
      case 'kafka':
        return { primary: '#ef4444', secondary: '#f87171' }; // Red
      case 'tcp':
        return { primary: '#06b6d4', secondary: '#22d3ee' }; // Cyan
      case 'udp':
        return { primary: '#ec4899', secondary: '#f472b6' }; // Pink
      default:
        return { primary: '#3b82f6', secondary: '#60a5fa' }; // Default blue
    }
  };

  const protocolColors = getProtocolColor();

  const getEdgeStyle = () => {
    const baseStyle: React.CSSProperties = {
      strokeWidth: 2,
      stroke: selected ? '#a1a1aa' : '#52525b',
    };

    switch (edgeData?.protocol) {
      case 'grpc':
        return { ...baseStyle, strokeDasharray: '5 5' };
      case 'websocket':
      case 'amqp':
      case 'kafka':
        return { ...baseStyle, strokeDasharray: '3 3' };
      case 'tcp':
        return { ...baseStyle, strokeWidth: 3 };
      default:
        return baseStyle;
    }
  };

  const label = edgeData?.label || (edgeData?.method ? `${edgeData.method}` : edgeData?.protocol?.toUpperCase());

  return (
    <>
      {/* Base edge line */}
      <BaseEdge 
        id={id} 
        path={edgePath} 
        style={getEdgeStyle()}
      />
      
      {/* Animated flow overlay - only when animated is enabled */}
      {isAnimated && (
        <g>
          {/* Glow effect layer */}
          <path
            d={edgePath}
            fill="none"
            strokeWidth={6}
            stroke={protocolColors.primary}
            strokeLinecap="round"
            opacity={0.3}
          />
          {/* Animated dashes */}
          <path
            d={edgePath}
            fill="none"
            strokeWidth={3}
            stroke={protocolColors.secondary}
            strokeDasharray="8 16"
            strokeLinecap="round"
            className="animated-edge-flow"
          />
          {/* Moving dot */}
          <circle r="4" fill={protocolColors.secondary} className="animated-edge-dot">
            <animateMotion dur="1.5s" repeatCount="indefinite" path={edgePath} />
          </circle>
          <circle r="6" fill={protocolColors.primary} opacity={0.4}>
            <animateMotion dur="1.5s" repeatCount="indefinite" path={edgePath} />
          </circle>
        </g>
      )}
      
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            className={cn(
              'px-2 py-0.5 text-[10px] font-medium rounded-full',
              'bg-zinc-900 border border-zinc-700',
              'text-zinc-400',
              selected && 'border-zinc-500 text-zinc-200'
            )}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
