import { create } from 'zustand';

import perksTreeData from './exported-data/game-data.json';
import { PrecomputedTreeData, precomputeTreeData } from './precompute';
import { PerksTreeData } from './types';

export type PerksTreeStore = {
  data: PerksTreeData;
  precomputed: PrecomputedTreeData | null;
  hoveredNodeId: string | null;
  setHoveredNodeId: (nodeId: string | null) => void;
  initializePrecomputed: () => void;
};

export const usePerksTreeStore = create<PerksTreeStore>((set, get) => ({
  data: perksTreeData,
  precomputed: null,
  hoveredNodeId: null,
  setHoveredNodeId: (nodeId) => set({ hoveredNodeId: nodeId }),
  initializePrecomputed: () => {
    const state = get();

    // Предотвращаем повторную инициализацию
    if (state.precomputed) {
      return;
    }

    try {
      const precomputed = precomputeTreeData(state.data);
      set({ precomputed });
    } catch (error) {
      console.error('Failed to precompute tree data:', error);
    }
  },
}));
