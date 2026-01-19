import { useCallback, useRef } from 'react';
import { toPng } from 'html-to-image';
import { useDiagramStore } from '@/store/diagramStore';
import { useThemeStore } from '@/store/themeStore';
import { cn } from '@/lib/utils';
import {
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  ArrowUpTrayIcon,
  TrashIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  PhotoIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';

interface ToolbarProps {
  reactFlowWrapper: React.RefObject<HTMLDivElement>;
}

export function Toolbar({ reactFlowWrapper }: ToolbarProps) {
  const { 
    undo, 
    redo, 
    history, 
    historyIndex, 
    exportDiagram, 
    importDiagram,
    clearDiagram,
  } = useDiagramStore();
  
  const { theme, setTheme } = useThemeStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Export as PNG
  const handleExportPng = useCallback(async () => {
    if (!reactFlowWrapper.current) return;
    
    const element = reactFlowWrapper.current.querySelector('.react-flow') as HTMLElement;
    if (!element) return;

    try {
      const dataUrl = await toPng(element, {
        backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
        quality: 1,
      });
      
      const link = document.createElement('a');
      link.download = `architecture-diagram-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to export PNG:', error);
    }
  }, [reactFlowWrapper, theme]);

  // Export as JSON
  const handleExportJson = useCallback(() => {
    const data = exportDiagram();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = `architecture-diagram-${Date.now()}.json`;
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
  }, [exportDiagram]);

  // Import JSON
  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        importDiagram(data);
      } catch (error) {
        console.error('Failed to import diagram:', error);
        alert('Failed to import diagram. Please check the file format.');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  }, [importDiagram]);

  const themeIcons = {
    light: SunIcon,
    dark: MoonIcon,
    system: ComputerDesktopIcon,
  };
  const ThemeIcon = themeIcons[theme];

  const cycleTheme = () => {
    const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 px-2 py-1.5 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-lg">
      {/* Undo/Redo */}
      <ToolbarButton
        icon={ArrowUturnLeftIcon}
        onClick={undo}
        disabled={!canUndo}
        title="Undo"
      />
      <ToolbarButton
        icon={ArrowUturnRightIcon}
        onClick={redo}
        disabled={!canRedo}
        title="Redo"
      />

      <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

      {/* Export */}
      <ToolbarButton
        icon={PhotoIcon}
        onClick={handleExportPng}
        title="Export as PNG"
      />
      <ToolbarButton
        icon={DocumentIcon}
        onClick={handleExportJson}
        title="Export as JSON"
      />

      <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

      {/* Import */}
      <ToolbarButton
        icon={ArrowUpTrayIcon}
        onClick={() => fileInputRef.current?.click()}
        title="Import JSON"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
      />

      <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

      {/* Clear */}
      <ToolbarButton
        icon={TrashIcon}
        onClick={() => {
          if (confirm('Are you sure you want to clear the diagram?')) {
            clearDiagram();
          }
        }}
        title="Clear diagram"
        danger
      />

      <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

      {/* Theme Toggle */}
      <ToolbarButton
        icon={ThemeIcon}
        onClick={cycleTheme}
        title={`Theme: ${theme}`}
      />
    </div>
  );
}

interface ToolbarButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
  title: string;
  danger?: boolean;
}

function ToolbarButton({ 
  icon: Icon, 
  onClick, 
  disabled, 
  title,
  danger,
}: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'p-2 rounded-md transition-colors',
        disabled 
          ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
          : danger
            ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
      )}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}
