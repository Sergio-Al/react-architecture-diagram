import { ReactFlowProvider } from '@xyflow/react';
import { DiagramEditor } from '@/components/DiagramEditor';
import { NodePalette } from '@/components/panels/NodePalette';
import { PropertiesPanel } from '@/components/panels/PropertiesPanel';
import { Navbar } from '@/components/Navbar';
import { useThemeStore } from '@/store/themeStore';
import { useUIStore } from '@/store/uiStore';
import { useEffect } from 'react';

function App() {
  const theme = useThemeStore((state) => state.theme);
  const { leftPanelVisible, rightPanelVisible } = useUIStore();

  // Apply theme on mount and when it changes
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  return (
    <ReactFlowProvider>
      <div className="h-screen w-screen overflow-hidden flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-300 antialiased">
        {/* Navbar */}
        <Navbar />
        
        {/* Main Layout */}
        <main className="flex-1 flex overflow-hidden">
          {/* Left Sidebar: Toolbox */}
          {leftPanelVisible && <NodePalette />}
          
          {/* Center: Interactive Canvas */}
          <DiagramEditor />
          
          {/* Right Sidebar: Properties */}
          {rightPanelVisible && <PropertiesPanel />}
        </main>
      </div>
    </ReactFlowProvider>
  );
}

export default App;
