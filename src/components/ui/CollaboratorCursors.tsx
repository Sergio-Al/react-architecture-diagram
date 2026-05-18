import { type RefObject } from 'react';
import type { RemoteCursor } from '@/hooks/useCollaboration';

interface CollaboratorCursorsProps {
  cursors: RemoteCursor[];
  flowToScreenPosition: (position: { x: number; y: number }) => { x: number; y: number };
  containerRef: RefObject<HTMLDivElement | null>;
}

export function CollaboratorCursors({ cursors, flowToScreenPosition, containerRef }: CollaboratorCursorsProps) {
  // Get container offset so we can convert viewport coords → container-relative coords
  const rect = containerRef.current?.getBoundingClientRect();
  const offsetX = rect?.left ?? 0;
  const offsetY = rect?.top ?? 0;

  return (
    <div className="pointer-events-none absolute inset-0 z-[50] overflow-hidden">
      {cursors.map((c) => {
        if (!c.cursor) return null;
        // Convert flow coords → viewport coords → container-relative coords
        const screenPos = flowToScreenPosition(c.cursor);
        return (
          <div
            key={c.socketId}
            className="absolute transition-all duration-100 ease-out"
            style={{
              left: screenPos.x - offsetX,
              top: screenPos.y - offsetY,
              transform: 'translate(-2px, -2px)',
            }}
          >
            {/* Cursor arrow */}
            <svg
              width="16"
              height="20"
              viewBox="0 0 16 20"
              fill="none"
              className="drop-shadow-md"
            >
              <path
                d="M0.928711 0.5L15.0713 10.9091L7.38612 11.3636L3.6107 19L0.928711 0.5Z"
                fill={c.color}
                stroke="white"
                strokeWidth="1"
              />
            </svg>
            {/* Name label */}
            <div
              className="absolute left-3 top-4 px-1.5 py-0.5 rounded text-[10px] font-medium text-white whitespace-nowrap shadow-sm"
              style={{ backgroundColor: c.color }}
            >
              {c.userName}
            </div>
          </div>
        );
      })}
    </div>
  );
}
