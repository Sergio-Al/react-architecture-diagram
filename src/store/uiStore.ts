import { create } from 'zustand';

interface UIState {
  leftPanelVisible: boolean;
  rightPanelVisible: boolean;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  leftPanelVisible: true,
  rightPanelVisible: true,
  toggleLeftPanel: () => set((state) => ({ leftPanelVisible: !state.leftPanelVisible })),
  toggleRightPanel: () => set((state) => ({ rightPanelVisible: !state.rightPanelVisible })),
}));
