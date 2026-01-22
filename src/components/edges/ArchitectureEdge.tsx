import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
} from '@xyflow/react';
import { cn } from '@/lib/utils';
import { ArchitectureEdgeData } from '@/types';
import { useThemeStore } from '@/store/themeStore';
import { useEffect, useState } from 'react';
import { PROTOCOL_CONFIG } from '@/constants';

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
  const { theme } = useThemeStore();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Determine if dark mode is active
    if (theme === 'system') {
      setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
    } else {
      setIsDark(theme === 'dark');
    }
  }, [theme]);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isAnimated = edgeData?.animated ?? false;

  // Theme-aware edge colors
  const edgeColors = {
    default: isDark ? '#52525b' : '#a1a1aa',
    selected: isDark ? '#a1a1aa' : '#71717a',
  };

  const getProtocolColor = () => {
    const protocol = edgeData?.protocol || 'http';
    const config = PROTOCOL_CONFIG[protocol];
    return config ? { primary: config.color.primary, secondary: config.color.secondary } : { primary: '#3b82f6', secondary: '#60a5fa' };
  };

  const protocolColors = getProtocolColor();

  const getEdgeStyle = () => {
    const baseStyle: React.CSSProperties = {
      strokeWidth: 2,
      stroke: selected ? edgeColors.selected : edgeColors.default,
    };

    // If async, use dotted pattern regardless of protocol
    if (edgeData?.async) {
      return { ...baseStyle, strokeDasharray: '2 4' };
    }

    const protocol = edgeData?.protocol || 'http';
    const config = PROTOCOL_CONFIG[protocol];
    
    if (config?.style.strokeDasharray) {
      return { ...baseStyle, strokeDasharray: config.style.strokeDasharray };
    }
    if (config?.style.strokeWidth) {
      return { ...baseStyle, strokeWidth: config.style.strokeWidth };
    }
    
    return baseStyle;
  };

  const label = edgeData?.label || (edgeData?.method ? `${edgeData.method}` : edgeData?.protocol?.toUpperCase());
  
  // Build label with async indicator and schema name
  let fullLabel = label;
  
  // Add async indicator
  if (edgeData?.async) {
    fullLabel = fullLabel ? `${fullLabel} (async)` : '(async)';
  }
  
  // Append schema name to label if data contract exists
  if (edgeData?.dataContract?.schemaName) {
    const baseLabel = fullLabel || edgeData?.protocol?.toUpperCase() || 'DATA';
    fullLabel = `${baseLabel} • ${edgeData.dataContract.schemaName}`;
  }

  // Determine marker IDs for bidirectional support
  const isBidirectional = edgeData?.bidirectional ?? false;
  const markerEnd = isBidirectional ? `url(#arrow-${id}-end)` : 'url(#arrow-end)';
  const markerStart = isBidirectional ? `url(#arrow-${id}-start)` : undefined;

  return (
    <>
      {/* Arrow markers for bidirectional edges */}
      {isBidirectional && (
        <defs>
          <marker
            id={`arrow-${id}-end`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path
              d="M 0 0 L 10 5 L 0 10 z"
              fill={selected ? edgeColors.selected : edgeColors.default}
            />
          </marker>
          <marker
            id={`arrow-${id}-start`}
            viewBox="0 0 10 10"
            refX="1"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path
              d="M 0 0 L 10 5 L 0 10 z"
              fill={selected ? edgeColors.selected : edgeColors.default}
            />
          </marker>
        </defs>
      )}

      {/* Base edge line */}
      <BaseEdge 
        id={id} 
        path={edgePath} 
        style={getEdgeStyle()}
        markerEnd={markerEnd}
        markerStart={markerStart}
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
      
      {fullLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            className={cn(
              'px-2 py-0.5 text-[10px] font-medium rounded-full',
              'bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700',
              'text-zinc-600 dark:text-zinc-400',
              selected && 'border-zinc-400 dark:border-zinc-500 text-zinc-800 dark:text-zinc-200'
            )}
            title={edgeData?.dataContract?.description || edgeData?.description}
          >
            {fullLabel}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
