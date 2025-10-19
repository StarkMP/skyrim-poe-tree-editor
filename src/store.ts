import { nanoid } from 'nanoid';
import { create } from 'zustand';

import gamePerksData from './data/game-perks.json';
import {
  EditorData,
  EditorImage,
  EditorImages,
  EditorNode,
  EditorNodes,
  GamePerksData,
  NodeType,
} from './types';

const STORAGE_KEY = 'skyrim-poe-tree-editor-data';

type SelectedElement = {
  id: string;
  type: 'node' | 'image';
} | null;

export type Store = {
  // Data
  nodes: EditorNodes;
  images: EditorImages;
  gamePerks: GamePerksData[];
  selectedElement: SelectedElement;

  // Node operations
  addNode: (x: number, y: number) => string;
  updateNode: (id: string, updates: Partial<EditorNode>) => void;
  deleteNode: (id: string) => void;
  addConnection: (fromId: string, toId: string) => void;
  removeConnection: (fromId: string, toId: string) => void;

  // Image operations
  addImage: (x: number, y: number) => string;
  updateImage: (id: string, updates: Partial<EditorImage>) => void;
  deleteImage: (id: string) => void;

  // Selection
  selectElement: (id: string | null, type: 'node' | 'image' | null) => void;

  // Import/Export
  importData: (data: EditorData) => void;
  exportData: () => EditorData;
  clearAll: () => void;

  // Persistence
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
};

const createDefaultNode = (x: number, y: number): EditorNode => ({
  type: NodeType.SmallNode,
  perkId: '',
  iconUrl: '',
  title: '',
  description: '',
  requiredLevel: null,
  keywords: [],
  x,
  y,
  connections: [],
});

const createDefaultImage = (x: number, y: number): EditorImage => ({
  width: 200,
  height: 200,
  x,
  y,
  imageUrl: '',
});

export const useStore = create<Store>((set, get) => ({
  // Initial state
  nodes: {},
  images: {},
  gamePerks: gamePerksData as GamePerksData[],
  selectedElement: null,

  // Node operations
  addNode: (x: number, y: number) => {
    const id = nanoid();
    set((state) => ({
      nodes: {
        ...state.nodes,
        [id]: createDefaultNode(x, y),
      },
    }));
    get().saveToLocalStorage();
    return id;
  },

  updateNode: (id: string, updates: Partial<EditorNode>) => {
    set((state) => ({
      nodes: {
        ...state.nodes,
        [id]: { ...state.nodes[id], ...updates },
      },
    }));
    get().saveToLocalStorage();
  },

  deleteNode: (id: string) => {
    set((state) => {
      const newNodes = { ...state.nodes };
      delete newNodes[id];

      // Remove all connections to this node
      for (const nodeId of Object.keys(newNodes)) {
        newNodes[nodeId] = {
          ...newNodes[nodeId],
          connections: newNodes[nodeId].connections.filter((connId) => connId !== id),
        };
      }

      return {
        nodes: newNodes,
        selectedElement: state.selectedElement?.id === id ? null : state.selectedElement,
      };
    });
    get().saveToLocalStorage();
  },

  addConnection: (fromId: string, toId: string) => {
    set((state) => {
      const fromNode = state.nodes[fromId];
      const toNode = state.nodes[toId];

      if (!fromNode || !toNode) return state;

      // Check if connection already exists
      if (fromNode.connections.includes(toId)) return state;

      return {
        nodes: {
          ...state.nodes,
          [fromId]: {
            ...fromNode,
            connections: [...fromNode.connections, toId],
          },
          [toId]: {
            ...toNode,
            connections: [...toNode.connections, fromId],
          },
        },
      };
    });
    get().saveToLocalStorage();
  },

  removeConnection: (fromId: string, toId: string) => {
    set((state) => {
      const fromNode = state.nodes[fromId];
      const toNode = state.nodes[toId];

      if (!fromNode || !toNode) return state;

      return {
        nodes: {
          ...state.nodes,
          [fromId]: {
            ...fromNode,
            connections: fromNode.connections.filter((id) => id !== toId),
          },
          [toId]: {
            ...toNode,
            connections: toNode.connections.filter((id) => id !== fromId),
          },
        },
      };
    });
    get().saveToLocalStorage();
  },

  // Image operations
  addImage: (x: number, y: number) => {
    const id = nanoid();
    set((state) => ({
      images: {
        ...state.images,
        [id]: createDefaultImage(x, y),
      },
    }));
    get().saveToLocalStorage();
    return id;
  },

  updateImage: (id: string, updates: Partial<EditorImage>) => {
    set((state) => ({
      images: {
        ...state.images,
        [id]: { ...state.images[id], ...updates },
      },
    }));
    get().saveToLocalStorage();
  },

  deleteImage: (id: string) => {
    set((state) => {
      const newImages = { ...state.images };
      delete newImages[id];

      return {
        images: newImages,
        selectedElement: state.selectedElement?.id === id ? null : state.selectedElement,
      };
    });
    get().saveToLocalStorage();
  },

  // Selection
  selectElement: (id: string | null, type: 'node' | 'image' | null) => {
    set({
      selectedElement: id && type ? { id, type } : null,
    });
  },

  // Import/Export
  importData: (data: EditorData) => {
    set({
      nodes: data.nodes,
      images: data.images,
      selectedElement: null,
    });
    get().saveToLocalStorage();
  },

  exportData: () => {
    const state = get();
    return {
      nodes: state.nodes,
      images: state.images,
    };
  },

  clearAll: () => {
    set({
      nodes: {},
      images: {},
      selectedElement: null,
    });
    localStorage.removeItem(STORAGE_KEY);
  },

  // Persistence
  saveToLocalStorage: () => {
    const state = get();
    const data: EditorData = {
      nodes: state.nodes,
      images: state.images,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  loadFromLocalStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: EditorData = JSON.parse(stored);
        set({
          nodes: data.nodes || {},
          images: data.images || {},
        });
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
  },
}));
