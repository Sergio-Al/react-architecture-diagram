import { ReactFlowProvider } from '@xyflow/react';
import { DiagramEditor } from '@/components/DiagramEditor';
import { NodePalette } from '@/components/panels/NodePalette';
import { PropertiesPanel } from '@/components/panels/PropertiesPanel';
import { Navbar } from '@/components/Navbar';
import { ToastContainer } from '@/components/ui/Toast';
import { JoinDiagramDialog } from '@/components/ui/JoinDiagramDialog';
import { useThemeStore } from '@/store/themeStore';
import { useUIStore } from '@/store/uiStore';
import { useDiagramStore } from '@/store/diagramStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useCollaboration } from '@/hooks/useCollaboration';
import { diagramsApi } from '@/services/api';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { DiagramData } from '@/types';

function App() {
  const theme = useThemeStore((state) => state.theme);
  const { leftPanelVisible, rightPanelVisible, toasts, removeToast } = useUIStore();
  const { importDiagram, loadDiagram } = useDiagramStore();
  const { setCurrentProject, setCurrentDiagram } = useWorkspaceStore();
  const { projectId, diagramId } = useParams<{ projectId: string; diagramId: string }>();

  // Collaboration state
  const [collabUserName, setCollabUserName] = useState<string | null>(() => {
    return localStorage.getItem('archdiagram-collab-name');
  });
  const showJoinDialog = !!diagramId && !collabUserName;

  // Guard flag to prevent sync loops: remote update → store → send → remote...
  const isApplyingRemoteRef = useRef(false);

  // Callback when remote diagram state arrives
  const handleRemoteDiagramState = useCallback(
    (nodes: import('@xyflow/react').Node[], edges: import('@xyflow/react').Edge[]) => {
      isApplyingRemoteRef.current = true;
      importDiagram({ nodes, edges } as DiagramData);
      // Reset flag after a tick so the store subscription doesn't re-broadcast
      requestAnimationFrame(() => {
        isApplyingRemoteRef.current = false;
      });
    },
    [importDiagram],
  );

  const {
    users: collabUsers,
    remoteCursors,
    connected: collabConnected,
    sendCursorUpdate,
    sendDiagramState,
    myColor,
  } = useCollaboration({
    diagramId: diagramId ?? null,
    userName: collabUserName,
    onRemoteDiagramState: handleRemoteDiagramState,
  });

  // Subscribe to diagramStore changes and broadcast to other clients
  useEffect(() => {
    if (!collabConnected || !diagramId) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = useDiagramStore.subscribe((state) => {
      if (isApplyingRemoteRef.current) return;

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        sendDiagramState(state.nodes, state.edges);
      }, 50);
    });

    return () => {
      unsubscribe();
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [collabConnected, diagramId, sendDiagramState]);

  // Track current project/diagram in workspace store
  useEffect(() => {
    setCurrentProject(projectId ?? null);
    setCurrentDiagram(diagramId ?? null);
  }, [projectId, diagramId, setCurrentProject, setCurrentDiagram]);

  // Load diagram data from API or fallback to localStorage
  useEffect(() => {
    if (diagramId) {
      diagramsApi.get(diagramId).then((diagram) => {
        const data = diagram.data as unknown as DiagramData;
        if (data && (data.nodes?.length || data.edges?.length)) {
          importDiagram(data);
        }
      }).catch(() => {
        // Fallback to localStorage if API is unavailable
        loadDiagram();
      });
    } else {
      loadDiagram();
    }
  }, [diagramId]); // eslint-disable-line react-hooks/exhaustive-deps

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
        {/* Join Dialog */}
        <JoinDiagramDialog
          open={showJoinDialog}
          onJoin={(name) => setCollabUserName(name)}
        />

        {/* Navbar */}
        <Navbar collabUsers={collabUsers} collabConnected={collabConnected} />
        
        {/* Main Layout */}
        <main className="flex-1 flex overflow-hidden">
          {/* Left Sidebar: Toolbox */}
          {leftPanelVisible && <NodePalette />}
          
          {/* Center: Interactive Canvas */}
          <DiagramEditor
            remoteCursors={remoteCursors}
            sendCursorUpdate={sendCursorUpdate}
            myColor={myColor}
          />
          
          {/* Right Sidebar: Properties */}
          {rightPanelVisible && <PropertiesPanel />}
        </main>

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    </ReactFlowProvider>
  );
}

export default App;
