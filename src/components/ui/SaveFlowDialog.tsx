import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, PlayIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import type { NamedFlow } from '@/types/simulation';
import type { SimulationSpeed } from '@/types/simulation';

const FLOW_COLORS: string[] = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#ec4899', // pink
];

const SPEEDS: SimulationSpeed[] = [0.25, 0.5, 1, 2, 4];

interface SaveFlowDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with the user-edited fields. */
  onSubmit: (data: Pick<NamedFlow, 'name' | 'description' | 'color' | 'speed'>) => void;
  /** Existing flow to edit. When undefined the dialog acts as "create". */
  existing?: Pick<NamedFlow, 'name' | 'description' | 'color' | 'speed'>;
  /** Label of the source node, shown for context only. */
  sourceNodeLabel?: string;
}

export function SaveFlowDialog({ isOpen, onClose, onSubmit, existing, sourceNodeLabel }: SaveFlowDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<string>(FLOW_COLORS[0]);
  const [speed, setSpeed] = useState<SimulationSpeed>(1);

  // Hydrate from existing on open.
  useEffect(() => {
    if (!isOpen) return;
    setName(existing?.name ?? '');
    setDescription(existing?.description ?? '');
    setColor(existing?.color ?? FLOW_COLORS[0]);
    setSpeed(existing?.speed ?? 1);
  }, [isOpen, existing]);

  if (!isOpen) return null;

  const trimmedName = name.trim();
  const canSave = trimmedName.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    onSubmit({
      name: trimmedName,
      description: description.trim() || undefined,
      color,
      speed,
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white dark:bg-zinc-950 rounded-xl shadow-2xl w-full max-w-sm mx-4 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <PlayIcon className="w-4 h-4 text-zinc-500" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {existing ? 'Edit Flow' : 'Save Flow'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-500 transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {sourceNodeLabel && (
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Source · <span className="font-mono text-zinc-700 dark:text-zinc-200">{sourceNodeLabel}</span>
            </div>
          )}

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="flow-name" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Name
            </label>
            <input
              id="flow-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Checkout, Refund pipeline"
              maxLength={80}
              autoFocus
              className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="flow-desc" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Description <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="flow-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this flow demonstrate?"
              rows={2}
              className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition resize-none"
            />
          </div>

          {/* Color */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Accent color</label>
            <div className="flex items-center gap-1.5">
              {FLOW_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'w-6 h-6 rounded-full border-2 transition-all',
                    color === c
                      ? 'border-zinc-900 dark:border-zinc-100 scale-110'
                      : 'border-transparent hover:scale-105'
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>

          {/* Speed */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Playback speed</label>
            <div className="grid grid-cols-5 gap-1 p-0.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSpeed(s)}
                  className={cn(
                    'text-[11px] font-mono py-1 rounded transition-colors',
                    speed === s
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                  )}
                >
                  {s}×
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSave}
              className="px-4 py-1.5 text-xs font-semibold bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 rounded-md hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {existing ? 'Save changes' : 'Save flow'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
