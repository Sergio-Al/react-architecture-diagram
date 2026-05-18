import { create } from 'zustand';

export type EdgeStyle = 'step' | 'bezier';

interface UIState {
  leftPanelVisible: boolean;
  rightPanelVisible: boolean;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  
  // Edge style
  edgeStyle: EdgeStyle;
  toggleEdgeStyle: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  leftPanelVisible: true,
  rightPanelVisible: true,
  toggleLeftPanel: () => set((state) => ({ leftPanelVisible: !state.leftPanelVisible })),
  toggleRightPanel: () => set((state) => ({ rightPanelVisible: !state.rightPanelVisible })),
  
  // Edge style
  edgeStyle: 'step',
  toggleEdgeStyle: () => set((state) => ({ edgeStyle: state.edgeStyle === 'step' ? 'bezier' : 'step' })),
}));
