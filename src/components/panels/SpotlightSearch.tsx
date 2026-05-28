import { useEffect, useMemo, useRef, useState } from 'react';
import { useReactFlow, useStoreApi } from '@xyflow/react';
import { Icon as IconifyIcon } from '@iconify/react';
import { MagnifyingGlassIcon, CommandLineIcon } from '@heroicons/react/24/outline';
import { useDiagramStore } from '@/store/diagramStore';
import { useUIStore } from '@/store/uiStore';
import { NODE_TYPES_CONFIG } from '@/constants';
import { ArchitectureNodeData } from '@/types';
import { cn } from '@/lib/utils';

const MAX_RESULTS = 8;

interface Result {
  id: string;
  label: string;
  type: string;
  description?: string;
  iconifyIcon?: string;
  /** Lower is better. Used for ranking. */
  score: number;
}

export function SpotlightSearch() {
  const open = useUIStore((s) => s.spotlightOpen);
  const setOpen = useUIStore((s) => s.setSpotlightOpen);
  const nodes = useDiagramStore((s) => s.nodes);
  const setSelectedNode = useDiagramStore((s) => s.setSelectedNode);
  const { setCenter, getZoom } = useReactFlow();
  const rfStore = useStoreApi();

  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state each time the modal opens.
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      // Focus next tick so the modal mount completes first.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const results = useMemo<Result[]>(() => {
    const archNodes = nodes.filter((n) => n.type === 'architecture');
    const q = query.trim().toLowerCase();

    if (!q) {
      // Empty query → most recent nodes (last in array first).
      return archNodes
        .slice(-MAX_RESULTS)
        .reverse()
        .map((n) => {
          const data = n.data as ArchitectureNodeData;
          return {
            id: n.id,
            label: data.label || n.id,
            type: data.type,
            description: data.description,
            iconifyIcon: data.iconifyIcon,
            score: 0,
          };
        });
    }

    const scored: Result[] = [];
    for (const n of archNodes) {
      const data = n.data as ArchitectureNodeData;
      const label = (data.label || '').toLowerCase();
      const type = (data.type || '').toLowerCase();
      const description = (data.description || '').toLowerCase();
      const technology = (data.technology || '').toLowerCase();

      let score = Infinity;
      if (label.startsWith(q)) score = 0;
      else if (label.includes(q)) score = 10;
      else if (type.includes(q)) score = 20;
      else if (technology.includes(q)) score = 30;
      else if (description.includes(q)) score = 40;
      else continue;

      scored.push({
        id: n.id,
        label: data.label || n.id,
        type: data.type,
        description: data.description,
        iconifyIcon: data.iconifyIcon,
        score,
      });
    }
    scored.sort((a, b) => a.score - b.score || a.label.localeCompare(b.label));
    return scored.slice(0, MAX_RESULTS);
  }, [query, nodes]);

  // Clamp active index when results shrink.
  useEffect(() => {
    if (activeIdx >= results.length) setActiveIdx(0);
  }, [results, activeIdx]);

  const handleSelect = (id: string) => {
    const node = nodes.find((n) => n.id === id);
    if (!node) return;

    // node.position is relative to the parent group, so we need the React
    // Flow store's positionAbsolute for nested nodes. Fall back to the raw
    // position for ungrouped nodes (or when nodeLookup hasn't measured yet).
    const { nodeLookup } = rfStore.getState();
    const internalNode = nodeLookup.get(id);
    const abs = internalNode?.internals.positionAbsolute ?? node.position;

    const w = node.measured?.width ?? (node.width ?? 160);
    const h = node.measured?.height ?? (node.height ?? 80);
    const cx = abs.x + w / 2;
    const cy = abs.y + h / 2;
    const zoom = Math.max(getZoom(), 1.1);
    setCenter(cx, cy, { zoom, duration: 400 });
    setSelectedNode(id);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-sm animate-slide-in"
      onClick={() => setOpen(false)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false);
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'w-full max-w-lg mx-4',
          'bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl',
          'shadow-2xl shadow-black/40 overflow-hidden'
        )}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <MagnifyingGlassIcon className="w-4 h-4 text-zinc-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIdx((i) => Math.min(i + 1, results.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIdx((i) => Math.max(i - 1, 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                const hit = results[activeIdx];
                if (hit) handleSelect(hit.id);
              } else if (e.key === 'Escape') {
                e.preventDefault();
                setOpen(false);
              }
            }}
            placeholder="Find a node by name, type, technology…"
            className="flex-1 bg-transparent outline-none text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600"
          />
          <kbd className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-zinc-400 dark:text-zinc-600 border border-zinc-200 dark:border-zinc-800 rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[55vh] overflow-y-auto">
          {results.length === 0 && (
            <div className="px-4 py-10 text-center text-xs text-zinc-500 dark:text-zinc-400">
              No matching nodes
            </div>
          )}
          {results.map((r, i) => {
            const config = NODE_TYPES_CONFIG[r.type as keyof typeof NODE_TYPES_CONFIG];
            const Icon = config?.icon;
            const isActive = i === activeIdx;
            return (
              <button
                key={r.id}
                type="button"
                onMouseEnter={() => setActiveIdx(i)}
                onClick={() => handleSelect(r.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                  isActive
                    ? 'bg-zinc-100 dark:bg-zinc-900'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/60'
                )}
              >
                <div
                  className={cn(
                    'flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center border',
                    config?.bgClass,
                    config?.borderClass
                  )}
                >
                  {r.iconifyIcon ? (
                    <IconifyIcon icon={r.iconifyIcon} width={14} height={14} />
                  ) : Icon ? (
                    <Icon className={cn('w-3.5 h-3.5', config?.iconColor)} strokeWidth={1.5} />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {r.label}
                  </div>
                  {r.description && (
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                      {r.description}
                    </div>
                  )}
                </div>
                <span className="text-[9px] font-mono uppercase tracking-tight text-zinc-400 dark:text-zinc-600 flex-shrink-0">
                  {r.type}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer hints */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 text-[10px] font-mono text-zinc-500 dark:text-zinc-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="border border-zinc-200 dark:border-zinc-800 rounded px-1">↑↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="border border-zinc-200 dark:border-zinc-800 rounded px-1">⏎</kbd>
              jump
            </span>
          </div>
          <span className="flex items-center gap-1 opacity-60">
            <CommandLineIcon className="w-3 h-3" />
            Spotlight
          </span>
        </div>
      </div>
    </div>
  );
}
