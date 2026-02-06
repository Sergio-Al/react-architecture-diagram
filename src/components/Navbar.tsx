import { useState, useRef, useEffect } from 'react';
import { 
  ArrowUturnLeftIcon, 
  ArrowUturnRightIcon,
  ShareIcon,
  CubeIcon,
  ArrowDownTrayIcon,
  CodeBracketIcon,
  PhotoIcon,
  DocumentTextIcon,
  DocumentIcon,
  LinkIcon,
  CheckIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  Squares2X2Icon,
  RectangleStackIcon,
  SparklesIcon,
  Cog6ToothIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';
import { useDiagramStore } from '@/store/diagramStore';
import { useThemeStore } from '@/store/themeStore';
import { useUIStore } from '@/store/uiStore';
import { 
  exportAsPng, 
  exportAsSvg, 
  exportAsPdf, 
  exportAsMarkdown, 
  exportAsJson,
  copyShareableLink 
} from '@/utils/export';
import { SettingsPanel } from '@/components/panels/SettingsPanel';
import { ExportPreviewDialog } from '@/components/ui/ExportPreviewDialog';
import { ArchitectureNodeData } from '@/types';

export function Navbar() {
  const { undo, redo, canUndo, canRedo, exportDiagram, applyAutoLayout, nodes, runAllHealthChecks, healthCheckResults } = useDiagramStore();
  const { theme, setTheme } = useThemeStore();
  const { leftPanelVisible, rightPanelVisible, toggleLeftPanel, toggleRightPanel, addToast } = useUIStore();
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [layoutDropdownOpen, setLayoutDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exportPreviewOpen, setExportPreviewOpen] = useState(false);
  const [selectedExportFormat, setSelectedExportFormat] = useState<'png' | 'svg' | 'pdf' | 'json' | 'markdown'>('png');
  const [isTestingHealth, setIsTestingHealth] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const layoutDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setExportDropdownOpen(false);
      }
      if (layoutDropdownRef.current && !layoutDropdownRef.current.contains(event.target as Node)) {
        setLayoutDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = (type: 'png' | 'svg' | 'pdf' | 'markdown' | 'json') => {
    setSelectedExportFormat(type);
    setExportDropdownOpen(false);
    setExportPreviewOpen(true);
  };

  const handleShareLink = async () => {
    try {
      await copyShareableLink(exportDiagram());
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleLayout = (direction: 'TB' | 'LR') => {
    applyAutoLayout(direction);
    setLayoutDropdownOpen(false);
  };

  const handleTestHealth = async () => {
    // Count nodes with health check URLs
    const healthCheckNodes = nodes.filter(
      n => n.type === 'architecture' && (n.data as ArchitectureNodeData).healthCheckUrl
    );

    if (healthCheckNodes.length === 0) {
      addToast({
        type: 'warning',
        title: 'No health checks configured',
        message: 'Add health check URLs to nodes in the Properties panel',
        duration: 4000,
      });
      return;
    }

    setIsTestingHealth(true);
    
    try {
      await runAllHealthChecks();
      
      // Count results
      const healthyCount = Object.values(healthCheckResults).filter(r => r.status === 'healthy').length;
      const totalCount = healthCheckNodes.length;
      
      if (healthyCount === totalCount) {
        addToast({
          type: 'success',
          title: `All ${totalCount} services healthy ✓`,
          duration: 4000,
        });
      } else {
        const unhealthyCount = totalCount - healthyCount;
        addToast({
          type: 'error',
          title: `${unhealthyCount}/${totalCount} services unhealthy`,
          message: 'Check the Properties panel for details',
          duration: 5000,
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Health check failed',
        message: 'An unexpected error occurred',
        duration: 4000,
      });
    } finally {
      setIsTestingHealth(false);
    }
  };

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <SunIcon className="w-3.5 h-3.5" />;
      case 'dark':
        return <MoonIcon className="w-3.5 h-3.5" />;
      case 'system':
        return <ComputerDesktopIcon className="w-3.5 h-3.5" />;
    }
  };

  return (
    <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md z-50">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 bg-zinc-900 dark:bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-100 dark:text-zinc-950">
          <CubeIcon className="w-4.5 h-4.5" strokeWidth={2} />
        </div>
        <h1 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          ARCHITECT <span className="opacity-40 font-normal ml-1">v2.1</span>
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Panel Toggles */}
        <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-1 gap-1">
          <button 
            onClick={toggleLeftPanel}
            className={`p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors ${
              leftPanelVisible 
                ? 'text-zinc-900 dark:text-zinc-100 bg-zinc-200 dark:bg-zinc-800' 
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
            title="Toggle left panel"
          >
            <Squares2X2Icon className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={toggleRightPanel}
            className={`p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors ${
              rightPanelVisible 
                ? 'text-zinc-900 dark:text-zinc-100 bg-zinc-200 dark:bg-zinc-800' 
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
            title="Toggle right panel"
          >
            <RectangleStackIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-1 gap-1">
          <button 
            onClick={undo}
            disabled={!canUndo()}
            className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Undo (⌘Z)"
          >
            <ArrowUturnLeftIcon className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={redo}
            disabled={!canRedo()}
            className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Redo (⌘⇧Z)"
          >
            <ArrowUturnRightIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Auto-Layout Dropdown */}
        <div className="relative" ref={layoutDropdownRef}>
          <button 
            onClick={() => setLayoutDropdownOpen(!layoutDropdownOpen)}
            className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
            title="Auto-arrange layout (⌘L)"
          >
            <SparklesIcon className="w-3.5 h-3.5" strokeWidth={2} />
            Layout
          </button>
          
          {/* Layout Dropdown Menu */}
          {layoutDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl z-50 overflow-hidden animate-slide-in">
              <div className="p-1">
                <button 
                  onClick={() => handleLayout('TB')}
                  className="w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white rounded-md flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  Top to Bottom
                </button>
                <button 
                  onClick={() => handleLayout('LR')}
                  className="w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white rounded-md flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  Left to Right
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Export Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
            disabled={isExporting}
            className="flex items-center gap-2 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-100 dark:text-zinc-900 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors shadow-sm disabled:opacity-50"
          >
            <ArrowDownTrayIcon className="w-3.5 h-3.5" strokeWidth={2} />
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
          
          {/* Dropdown Menu */}
          {exportDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl z-50 overflow-hidden animate-slide-in">
              <div className="p-1">
                <button 
                  onClick={() => handleExport('svg')}
                  className="w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white rounded-md flex items-center gap-2"
                >
                  <CodeBracketIcon className="w-3.5 h-3.5" />
                  SVG Vector
                </button>
                <button 
                  onClick={() => handleExport('png')}
                  className="w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white rounded-md flex items-center gap-2"
                >
                  <PhotoIcon className="w-3.5 h-3.5" />
                  PNG Image
                </button>
                <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-1" />
                <button 
                  onClick={() => handleExport('pdf')}
                  className="w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white rounded-md flex items-center gap-2"
                >
                  <DocumentTextIcon className="w-3.5 h-3.5" />
                  PDF Report
                </button>
                <button 
                  onClick={() => handleExport('markdown')}
                  className="w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white rounded-md flex items-center gap-2"
                >
                  <DocumentIcon className="w-3.5 h-3.5" />
                  Markdown
                </button>
                <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-1" />
                <button 
                  onClick={() => handleExport('json')}
                  className="w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white rounded-md flex items-center gap-2"
                >
                  <CodeBracketIcon className="w-3.5 h-3.5" />
                  JSON Data
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Test Health Button */}
        <button 
          onClick={handleTestHealth}
          disabled={isTestingHealth}
          className="bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 p-1.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Test all health checks"
        >
          <HeartIcon className={`w-3.5 h-3.5 ${isTestingHealth ? 'animate-pulse' : ''}`} />
        </button>

        {/* AI Settings */}
        <button 
          onClick={() => setSettingsOpen(true)}
          className="bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 p-1.5 rounded-md transition-colors"
          title="AI Settings"
        >
          <Cog6ToothIcon className="w-3.5 h-3.5" />
        </button>

        {/* Theme Toggle */}
        <button 
          onClick={cycleTheme}
          className="bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 p-1.5 rounded-md transition-colors"
          title={`Theme: ${theme} (click to change)`}
        >
          {getThemeIcon()}
        </button>

        {/* Share Button */}
        <button 
          onClick={handleShareLink}
          className="bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 p-1.5 rounded-md transition-colors flex items-center gap-1.5"
          title="Copy shareable link"
        >
          {copiedLink ? (
            <>
              <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs text-emerald-400">Copied!</span>
            </>
          ) : (
            <ShareIcon className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Settings Modal */}
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      
      {/* Export Preview Modal */}
      <ExportPreviewDialog 
        isOpen={exportPreviewOpen} 
        onClose={() => setExportPreviewOpen(false)}
        initialFormat={selectedExportFormat}
      />
    </header>
  );
}
