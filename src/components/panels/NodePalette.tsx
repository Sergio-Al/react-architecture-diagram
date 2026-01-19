import { useDragEvent } from '@/hooks/useDragEvent';
import { NODE_TYPES_CONFIG, GROUP_TYPES_CONFIG } from '@/constants';
import { ArchitectureNodeType, GroupNodeType } from '@/types';
import { cn } from '@/lib/utils';
import { MagnifyingGlassIcon, UserCircleIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import { useState } from 'react';

// Group configuration for node categories
const NODE_CATEGORIES = {
  'Compute & Services': ['service', 'gateway'] as ArchitectureNodeType[],
  'Data Store': ['database', 'cache', 'storage'] as ArchitectureNodeType[],
  'Messaging': ['queue'] as ArchitectureNodeType[],
  'External': ['external', 'client'] as ArchitectureNodeType[],
};

// Infrastructure groups
const GROUP_CATEGORIES: GroupNodeType[] = ['vpc', 'cluster', 'region', 'subnet'];

export function NodePalette() {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter regular nodes
  const filteredCategories = Object.entries(NODE_CATEGORIES).reduce((acc, [category, types]) => {
    const filtered = types.filter(type => {
      const config = NODE_TYPES_CONFIG[type];
      return config.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
             type.toLowerCase().includes(searchQuery.toLowerCase());
    });
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {} as Record<string, ArchitectureNodeType[]>);

  // Filter groups
  const filteredGroups = GROUP_CATEGORIES.filter(type => {
    const config = GROUP_TYPES_CONFIG[type];
    return config.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
           config.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
           type.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col z-20">
      {/* Search */}
      <div className="p-4 border-b border-zinc-800">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search components..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 placeholder-zinc-500 rounded-md pl-8 pr-3 py-2 focus:outline-none focus:border-zinc-600 focus:ring-0 transition-colors"
          />
        </div>
      </div>
      
      {/* Categories */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Infrastructure Groups Section */}
        {filteredGroups.length > 0 && (
          <div>
            <h3 className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 mb-3 flex items-center gap-2">
              <Squares2X2Icon className="w-3 h-3" />
              Infrastructure
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {filteredGroups.map((type) => (
                <GroupDraggableNode key={type} type={type} />
              ))}
            </div>
          </div>
        )}

        {filteredGroups.length > 0 && Object.keys(filteredCategories).length > 0 && (
          <div className="h-px bg-zinc-800 w-full" />
        )}

        {/* Regular Node Categories */}
        {Object.entries(filteredCategories).map(([category, types]) => (
          <div key={category}>
            <h3 className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 mb-3">
              {category}
            </h3>
            {category === 'Compute & Services' ? (
              <div className="grid grid-cols-2 gap-2">
                {types.map((type) => (
                  <GridDraggableNode key={type} type={type} />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {types.map((type) => (
                  <ListDraggableNode key={type} type={type} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* User Profile / Footer */}
      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-linear-to-tr from-zinc-700 to-zinc-600 border border-zinc-500 flex items-center justify-center">
            <UserCircleIcon className="w-5 h-5 text-zinc-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-zinc-200">User</span>
            <span className="text-[10px] text-zinc-500">Workspace Owner</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

// Draggable group component
function GroupDraggableNode({ type }: { type: GroupNodeType }) {
  const config = GROUP_TYPES_CONFIG[type];
  const Icon = config.icon;
  const { onDragStart } = useDragEvent(`group-${type}`);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="cursor-grab active:cursor-grabbing bg-zinc-900/30 hover:bg-zinc-900 border border-dashed border-zinc-700 hover:border-zinc-500 rounded-lg p-3 flex flex-col items-center gap-2 transition-all"
    >
      <Icon className="w-4 h-4 text-zinc-500" />
      <span className="text-xs font-medium text-zinc-400">
        {config.label}
      </span>
    </div>
  );
}

function GridDraggableNode({ type }: { type: ArchitectureNodeType }) {
  const config = NODE_TYPES_CONFIG[type];
  const Icon = config.icon;
  const { onDragStart } = useDragEvent(type);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="group cursor-grab active:cursor-grabbing bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg p-3 flex flex-col items-center gap-2 transition-all"
    >
      <div className={cn('p-2 rounded-md', config.bgClass)}>
        <Icon className={cn('w-4.5 h-4.5', config.iconColor, 'group-hover:opacity-90')} strokeWidth={1.5} />
      </div>
      <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-200">
        {config.label}
      </span>
    </div>
  );
}

function ListDraggableNode({ type }: { type: ArchitectureNodeType }) {
  const config = NODE_TYPES_CONFIG[type];
  const Icon = config.icon;
  const { onDragStart } = useDragEvent(type);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="cursor-grab active:cursor-grabbing flex items-center gap-3 p-2 rounded-md hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-all"
    >
      <span className={cn('p-1.5 rounded', config.bgClass)}>
        <Icon className={cn('w-4 h-4', config.iconColor)} />
      </span>
      <div className="flex flex-col">
        <span className="text-xs font-medium text-zinc-300">{config.label}</span>
        <span className="text-[10px] text-zinc-600">{config.description}</span>
      </div>
    </div>
  );
}
