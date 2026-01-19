import { ReactFlowProvider } from '@xyflow/react';
import { DiagramEditor } from '@/components/DiagramEditor';
import { NodePalette } from '@/components/panels/NodePalette';
import { PropertiesPanel } from '@/components/panels/PropertiesPanel';
import { Navbar } from '@/components/Navbar';

function App() {
  return (
    <ReactFlowProvider>
      <div className="h-screen w-screen overflow-hidden flex flex-col bg-zinc-950 text-zinc-300 antialiased">
        {/* Navbar */}
        <Navbar />
        
        {/* Main Layout */}
        <main className="flex-1 flex overflow-hidden">
          {/* Left Sidebar: Toolbox */}
          <NodePalette />
          
          {/* Center: Interactive Canvas */}
          <DiagramEditor />
          
          {/* Right Sidebar: Properties */}
          <PropertiesPanel />
        </main>
      </div>
    </ReactFlowProvider>
  );
}

export default App;
