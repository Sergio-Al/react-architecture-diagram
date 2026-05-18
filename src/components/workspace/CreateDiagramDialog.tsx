import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { diagramsApi } from '@/services/api';

interface Props {
  projectId: string;
  onClose: () => void;
}

export function CreateDiagramDialog({ projectId, onClose }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const mutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      diagramsApi.create(projectId, data),
    onSuccess: (diagram) => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'diagrams'] });
      navigate(`/projects/${projectId}/diagrams/${diagram.id}`);
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">New Diagram</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            mutation.mutate({ name: name.trim(), description: description.trim() || undefined });
          }}
        >
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            placeholder="My Diagram"
            className="w-full border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm bg-transparent focus:outline-none focus:border-zinc-500 dark:focus:border-zinc-400 mb-3"
          />

          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            rows={2}
            className="w-full border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm bg-transparent focus:outline-none focus:border-zinc-500 dark:focus:border-zinc-400 mb-3 resize-none"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || mutation.isPending}
              className="px-3 py-1.5 text-xs font-semibold bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors shadow-sm"
            >
              {mutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
