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
  CheckIcon
} from '@heroicons/react/24/outline';
import { useDiagramStore } from '@/store/diagramStore';
import { 
  exportAsPng, 
  exportAsSvg, 
  exportAsPdf, 
  exportAsMarkdown, 
  exportAsJson,
  copyShareableLink 
} from '@/utils/export';

export function Navbar() {
  const { undo, redo, canUndo, canRedo, exportDiagram } = useDiagramStore();
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setExportDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (type: 'png' | 'svg' | 'pdf' | 'markdown' | 'json') => {
    setIsExporting(true);
    setExportDropdownOpen(false);
    
    try {
      switch (type) {
        case 'png':
          await exportAsPng();
          break;
        case 'svg':
          await exportAsSvg();
          break;
        case 'pdf':
          await exportAsPdf();
          break;
        case 'markdown':
          exportAsMarkdown(exportDiagram());
          break;
        case 'json':
          exportAsJson(exportDiagram());
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
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

  return (
    <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-950/80 backdrop-blur-md z-50">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-950">
          <CubeIcon className="w-4.5 h-4.5" strokeWidth={2} />
        </div>
        <h1 className="text-sm font-semibold tracking-tight text-zinc-100">
          ARCHITECT <span className="opacity-40 font-normal ml-1">v2.1</span>
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Undo/Redo */}
        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-md p-1 gap-1">
          <button 
            onClick={undo}
            disabled={!canUndo()}
            className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Undo (⌘Z)"
          >
            <ArrowUturnLeftIcon className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={redo}
            disabled={!canRedo()}
            className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Redo (⌘⇧Z)"
          >
            <ArrowUturnRightIcon className="w-3.5 h-3.5" />
          </button>
        </div>
        
        {/* Export Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
            disabled={isExporting}
            className="flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors shadow-sm disabled:opacity-50"
          >
            <ArrowDownTrayIcon className="w-3.5 h-3.5" strokeWidth={2} />
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
          
          {/* Dropdown Menu */}
          {exportDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50 overflow-hidden animate-slide-in">
              <div className="p-1">
                <button 
                  onClick={() => handleExport('svg')}
                  className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-md flex items-center gap-2"
                >
                  <CodeBracketIcon className="w-3.5 h-3.5" />
                  SVG Vector
                </button>
                <button 
                  onClick={() => handleExport('png')}
                  className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-md flex items-center gap-2"
                >
                  <PhotoIcon className="w-3.5 h-3.5" />
                  PNG Image
                </button>
                <div className="h-px bg-zinc-800 my-1" />
                <button 
                  onClick={() => handleExport('pdf')}
                  className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-md flex items-center gap-2"
                >
                  <DocumentTextIcon className="w-3.5 h-3.5" />
                  PDF Report
                </button>
                <button 
                  onClick={() => handleExport('markdown')}
                  className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-md flex items-center gap-2"
                >
                  <DocumentIcon className="w-3.5 h-3.5" />
                  Markdown
                </button>
                <div className="h-px bg-zinc-800 my-1" />
                <button 
                  onClick={() => handleExport('json')}
                  className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-md flex items-center gap-2"
                >
                  <CodeBracketIcon className="w-3.5 h-3.5" />
                  JSON Data
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Share Button */}
        <button 
          onClick={handleShareLink}
          className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 p-1.5 rounded-md transition-colors flex items-center gap-1.5"
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
    </header>
  );
}
