import { nanoid } from 'nanoid';
import { create } from 'zustand';

import { ORBIT_DEFAULT_POINTS, ORBIT_DEFAULT_RADIUS, ORBIT_DEFAULT_ROTATION } from './constants';
import gamePerksData from './data/game-perks.json';
import {
  EditorData,
  EditorImage,
  EditorImages,
  EditorNode,
  EditorNodes,
  EditorOrbits,
  GamePerksData,
  GridSettings,
  NodeType,
  PositionOrbit,
  ViewportState,
} from './types';

const STORAGE_KEY = 'skyrim-poe-tree-editor-data';
const MAX_UNDO_STACK_SIZE = 50;

type SelectedElement = {
  id: string;
  type: 'node' | 'image' | 'orbit';
} | null;

type ViewportCenterRequest = {
  id: string;
  type: 'node' | 'image' | 'orbit';
  timestamp: number;
} | null;

// Undo action types - each represents a reversible operation
type UndoAction =
  | { type: 'ADD_NODE'; nodeId: string }
  | { type: 'DELETE_NODE'; nodeId: string; nodeData: EditorNode }
  | { type: 'UPDATE_NODE'; nodeId: string; previousData: Partial<EditorNode> }
  | { type: 'ADD_CONNECTION'; fromId: string; toId: string }
  | { type: 'REMOVE_CONNECTION'; fromId: string; toId: string }
  | { type: 'REMOVE_ALL_CONNECTIONS'; nodeId: string; connections: string[] }
  | { type: 'ADD_IMAGE'; imageId: string }
  | { type: 'DELETE_IMAGE'; imageId: string; imageData: EditorImage }
  | { type: 'UPDATE_IMAGE'; imageId: string; previousData: Partial<EditorImage> }
  | { type: 'ADD_ORBIT'; orbitId: string }
  | { type: 'DELETE_ORBIT'; orbitId: string; orbitData: PositionOrbit }
  | { type: 'UPDATE_ORBIT'; orbitId: string; previousData: Partial<PositionOrbit> };

export type Store = {
  // Data
  nodes: EditorNodes;
  images: EditorImages;
  orbits: EditorOrbits;
  gamePerks: GamePerksData[];
  selectedElement: SelectedElement;
  viewportCenterRequest: ViewportCenterRequest;
  viewport: ViewportState;
  gridSettings: GridSettings;

  // Undo stack
  undoStack: UndoAction[];

  // Node operations
  addNode: (x: number, y: number) => string;
  updateNode: (id: string, updates: Partial<EditorNode>) => void;
  deleteNode: (id: string) => void;
  addConnection: (fromId: string, toId: string) => void;
  removeConnection: (fromId: string, toId: string) => void;
  removeAllConnections: (nodeId: string) => void;

  // Image operations
  addImage: (x: number, y: number) => string;
  updateImage: (id: string, updates: Partial<EditorImage>) => void;
  deleteImage: (id: string) => void;

  // Orbit operations
  addOrbit: (x: number, y: number) => string;
  updateOrbit: (id: string, updates: Partial<PositionOrbit>) => void;
  deleteOrbit: (id: string) => void;

  // Selection
  selectElement: (id: string | null, type: 'node' | 'image' | 'orbit' | null) => void;

  // Viewport
  requestCenterOnElement: (id: string, type: 'node' | 'image' | 'orbit') => void;
  updateViewport: (viewport: ViewportState) => void;

  // Grid settings
  updateGridSettings: (settings: Partial<GridSettings>) => void;

  // Undo operation
  undo: () => void;
  canUndo: () => boolean;

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
  opacity: 1,
  rotation: 0,
});

const createDefaultOrbit = (x: number, y: number): PositionOrbit => ({
  x,
  y,
  radius: ORBIT_DEFAULT_RADIUS,
  pointCount: ORBIT_DEFAULT_POINTS,
  rotation: ORBIT_DEFAULT_ROTATION,
});

// Helper to add action to undo stack
const pushUndoAction = (state: Store, action: UndoAction) => {
  const newStack = [...state.undoStack, action];

  // Limit stack size
  if (newStack.length > MAX_UNDO_STACK_SIZE) {
    newStack.shift();
  }

  return { undoStack: newStack };
};

// Default values for initial state
const DEFAULT_VIEWPORT: ViewportState = { x: 0, y: 0, scale: 1 };
const DEFAULT_GRID_SETTINGS: GridSettings = { enabled: false, size: 100 };

// Helper to load initial data from localStorage
const loadInitialData = () => {
  const defaults = {
    nodes: {},
    images: {},
    orbits: {},
    viewport: DEFAULT_VIEWPORT,
    gridSettings: DEFAULT_GRID_SETTINGS,
  };

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaults;

    const data: EditorData = JSON.parse(stored);
    return {
      nodes: data.nodes || defaults.nodes,
      images: data.images || defaults.images,
      orbits: data.orbits || defaults.orbits,
      viewport: data.viewport || defaults.viewport,
      gridSettings: data.gridSettings || defaults.gridSettings,
    };
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return defaults;
  }
};

export const useStore = create<Store>((set, get) => {
  const initialData = loadInitialData();

  return {
    // Initial state
    nodes: initialData.nodes,
    images: initialData.images,
    orbits: initialData.orbits,
    gamePerks: gamePerksData as GamePerksData[],
    selectedElement: null,
    viewportCenterRequest: null,
    viewport: initialData.viewport,
    gridSettings: initialData.gridSettings,
    undoStack: [],

    // Node operations
    addNode: (x: number, y: number) => {
      const id = nanoid();
      set((state) => ({
        ...pushUndoAction(state, { type: 'ADD_NODE', nodeId: id }),
        nodes: {
          ...state.nodes,
          [id]: createDefaultNode(x, y),
        },
      }));
      get().saveToLocalStorage();
      return id;
    },

    updateNode: (id: string, updates: Partial<EditorNode>) => {
      set((state) => {
        const currentNode = state.nodes[id];
        if (!currentNode) return state;

        // Save only the fields that are being updated
        const previousData: Partial<EditorNode> = {};
        for (const key of Object.keys(updates) as Array<keyof EditorNode>) {
          previousData[key] = currentNode[key] as any;
        }

        return {
          ...pushUndoAction(state, { type: 'UPDATE_NODE', nodeId: id, previousData }),
          nodes: {
            ...state.nodes,
            [id]: { ...currentNode, ...updates },
          },
        };
      });
      get().saveToLocalStorage();
    },

    deleteNode: (id: string) => {
      set((state) => {
        const nodeToDelete = state.nodes[id];
        if (!nodeToDelete) return state;

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
          ...pushUndoAction(state, { type: 'DELETE_NODE', nodeId: id, nodeData: nodeToDelete }),
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
          ...pushUndoAction(state, { type: 'ADD_CONNECTION', fromId, toId }),
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
          ...pushUndoAction(state, { type: 'REMOVE_CONNECTION', fromId, toId }),
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

    removeAllConnections: (nodeId: string) => {
      set((state) => {
        const node = state.nodes[nodeId];
        if (!node) return state;

        const newNodes = { ...state.nodes };

        // Save connections for undo
        const connections = [...node.connections];

        // Remove connections from all connected nodes
        for (const connectedId of connections) {
          if (newNodes[connectedId]) {
            newNodes[connectedId] = {
              ...newNodes[connectedId],
              connections: newNodes[connectedId].connections.filter((id) => id !== nodeId),
            };
          }
        }

        // Clear connections from the target node
        newNodes[nodeId] = {
          ...node,
          connections: [],
        };

        return {
          ...pushUndoAction(state, { type: 'REMOVE_ALL_CONNECTIONS', nodeId, connections }),
          nodes: newNodes,
        };
      });
      get().saveToLocalStorage();
    },

    // Image operations
    addImage: (x: number, y: number) => {
      const id = nanoid();
      set((state) => ({
        ...pushUndoAction(state, { type: 'ADD_IMAGE', imageId: id }),
        images: {
          ...state.images,
          [id]: createDefaultImage(x, y),
        },
      }));
      get().saveToLocalStorage();
      return id;
    },

    updateImage: (id: string, updates: Partial<EditorImage>) => {
      set((state) => {
        const currentImage = state.images[id];
        if (!currentImage) return state;

        // Save only the fields that are being updated
        const previousData: Partial<EditorImage> = {};
        for (const key of Object.keys(updates) as Array<keyof EditorImage>) {
          previousData[key] = currentImage[key] as any;
        }

        return {
          ...pushUndoAction(state, { type: 'UPDATE_IMAGE', imageId: id, previousData }),
          images: {
            ...state.images,
            [id]: { ...currentImage, ...updates },
          },
        };
      });
      get().saveToLocalStorage();
    },

    deleteImage: (id: string) => {
      set((state) => {
        const imageToDelete = state.images[id];
        if (!imageToDelete) return state;

        const newImages = { ...state.images };
        delete newImages[id];

        return {
          ...pushUndoAction(state, { type: 'DELETE_IMAGE', imageId: id, imageData: imageToDelete }),
          images: newImages,
          selectedElement: state.selectedElement?.id === id ? null : state.selectedElement,
        };
      });
      get().saveToLocalStorage();
    },

    // Orbit operations
    addOrbit: (x: number, y: number) => {
      const id = nanoid();
      set((state) => ({
        ...pushUndoAction(state, { type: 'ADD_ORBIT', orbitId: id }),
        orbits: {
          ...state.orbits,
          [id]: createDefaultOrbit(x, y),
        },
      }));
      get().saveToLocalStorage();
      return id;
    },

    updateOrbit: (id: string, updates: Partial<PositionOrbit>) => {
      set((state) => {
        const currentOrbit = state.orbits[id];
        if (!currentOrbit) return state;

        // Save only the fields that are being updated
        const previousData: Partial<PositionOrbit> = {};
        for (const key of Object.keys(updates) as Array<keyof PositionOrbit>) {
          previousData[key] = currentOrbit[key] as any;
        }

        return {
          ...pushUndoAction(state, { type: 'UPDATE_ORBIT', orbitId: id, previousData }),
          orbits: {
            ...state.orbits,
            [id]: { ...currentOrbit, ...updates },
          },
        };
      });
      get().saveToLocalStorage();
    },

    deleteOrbit: (id: string) => {
      set((state) => {
        const orbitToDelete = state.orbits[id];
        if (!orbitToDelete) return state;

        const newOrbits = { ...state.orbits };
        delete newOrbits[id];

        return {
          ...pushUndoAction(state, { type: 'DELETE_ORBIT', orbitId: id, orbitData: orbitToDelete }),
          orbits: newOrbits,
          selectedElement: state.selectedElement?.id === id ? null : state.selectedElement,
        };
      });
      get().saveToLocalStorage();
    },

    // Selection
    selectElement: (id: string | null, type: 'node' | 'image' | 'orbit' | null) => {
      set({
        selectedElement: id && type ? { id, type } : null,
      });
    },

    // Viewport
    requestCenterOnElement: (id: string, type: 'node' | 'image' | 'orbit') => {
      set({
        viewportCenterRequest: { id, type, timestamp: Date.now() },
      });
    },

    updateViewport: (viewport: ViewportState) => {
      set({ viewport });
      get().saveToLocalStorage();
    },

    // Grid settings
    updateGridSettings: (settings: Partial<GridSettings>) => {
      set((state) => ({
        gridSettings: { ...state.gridSettings, ...settings },
      }));
      get().saveToLocalStorage();
    },

    // Undo operation
    undo: () => {
      const state = get();
      if (state.undoStack.length === 0) return;

      const action = state.undoStack.at(-1);
      if (!action) return;

      const newStack = state.undoStack.slice(0, -1);

      set({ undoStack: newStack });

      // Execute reverse operation based on action type
      switch (action.type) {
        case 'ADD_NODE': {
          // Reverse: delete the node
          const newNodes = { ...state.nodes };
          delete newNodes[action.nodeId];

          // Remove connections to this node
          for (const nodeId of Object.keys(newNodes)) {
            newNodes[nodeId] = {
              ...newNodes[nodeId],
              connections: newNodes[nodeId].connections.filter((id) => id !== action.nodeId),
            };
          }

          set({
            nodes: newNodes,
            selectedElement:
              state.selectedElement?.id === action.nodeId ? null : state.selectedElement,
          });
          break;
        }

        case 'DELETE_NODE': {
          // Reverse: restore the node
          set({
            nodes: {
              ...state.nodes,
              [action.nodeId]: action.nodeData,
            },
          });

          // Restore connections
          const nodesToUpdate = { ...state.nodes, [action.nodeId]: action.nodeData };
          for (const connectedId of action.nodeData.connections) {
            if (
              nodesToUpdate[connectedId] &&
              !nodesToUpdate[connectedId].connections.includes(action.nodeId)
            ) {
              nodesToUpdate[connectedId] = {
                ...nodesToUpdate[connectedId],
                connections: [...nodesToUpdate[connectedId].connections, action.nodeId],
              };
            }
          }
          set({ nodes: nodesToUpdate });
          break;
        }

        case 'UPDATE_NODE': {
          // Reverse: restore previous values
          const currentNode = state.nodes[action.nodeId];
          if (currentNode) {
            set({
              nodes: {
                ...state.nodes,
                [action.nodeId]: { ...currentNode, ...action.previousData },
              },
            });
          }
          break;
        }

        case 'ADD_CONNECTION': {
          // Reverse: remove the connection
          const fromNode = state.nodes[action.fromId];
          const toNode = state.nodes[action.toId];

          if (fromNode && toNode) {
            set({
              nodes: {
                ...state.nodes,
                [action.fromId]: {
                  ...fromNode,
                  connections: fromNode.connections.filter((id) => id !== action.toId),
                },
                [action.toId]: {
                  ...toNode,
                  connections: toNode.connections.filter((id) => id !== action.fromId),
                },
              },
            });
          }
          break;
        }

        case 'REMOVE_CONNECTION': {
          // Reverse: restore the connection
          const fromNode = state.nodes[action.fromId];
          const toNode = state.nodes[action.toId];

          if (fromNode && toNode) {
            set({
              nodes: {
                ...state.nodes,
                [action.fromId]: {
                  ...fromNode,
                  connections: [...fromNode.connections, action.toId],
                },
                [action.toId]: {
                  ...toNode,
                  connections: [...toNode.connections, action.fromId],
                },
              },
            });
          }
          break;
        }

        case 'REMOVE_ALL_CONNECTIONS': {
          // Reverse: restore all connections
          const node = state.nodes[action.nodeId];
          if (node) {
            const newNodes = { ...state.nodes };

            // Restore connections to the node
            newNodes[action.nodeId] = {
              ...node,
              connections: [...action.connections],
            };

            // Restore connections from connected nodes
            for (const connectedId of action.connections) {
              if (
                newNodes[connectedId] &&
                !newNodes[connectedId].connections.includes(action.nodeId)
              ) {
                newNodes[connectedId] = {
                  ...newNodes[connectedId],
                  connections: [...newNodes[connectedId].connections, action.nodeId],
                };
              }
            }

            set({ nodes: newNodes });
          }
          break;
        }

        case 'ADD_IMAGE': {
          // Reverse: delete the image
          const newImages = { ...state.images };
          delete newImages[action.imageId];
          set({
            images: newImages,
            selectedElement:
              state.selectedElement?.id === action.imageId ? null : state.selectedElement,
          });
          break;
        }

        case 'DELETE_IMAGE': {
          // Reverse: restore the image
          set({
            images: {
              ...state.images,
              [action.imageId]: action.imageData,
            },
          });
          break;
        }

        case 'UPDATE_IMAGE': {
          // Reverse: restore previous values
          const currentImage = state.images[action.imageId];
          if (currentImage) {
            set({
              images: {
                ...state.images,
                [action.imageId]: { ...currentImage, ...action.previousData },
              },
            });
          }
          break;
        }

        case 'ADD_ORBIT': {
          // Reverse: delete the orbit
          const newOrbits = { ...state.orbits };
          delete newOrbits[action.orbitId];
          set({
            orbits: newOrbits,
            selectedElement:
              state.selectedElement?.id === action.orbitId ? null : state.selectedElement,
          });
          break;
        }

        case 'DELETE_ORBIT': {
          // Reverse: restore the orbit
          set({
            orbits: {
              ...state.orbits,
              [action.orbitId]: action.orbitData,
            },
          });
          break;
        }

        case 'UPDATE_ORBIT': {
          // Reverse: restore previous values
          const currentOrbit = state.orbits[action.orbitId];
          if (currentOrbit) {
            set({
              orbits: {
                ...state.orbits,
                [action.orbitId]: { ...currentOrbit, ...action.previousData },
              },
            });
          }
          break;
        }
      }

      get().saveToLocalStorage();
    },

    canUndo: () => {
      const state = get();
      return state.undoStack.length > 0;
    },

    // Import/Export
    importData: (data: EditorData) => {
      set({
        nodes: data.nodes,
        images: data.images,
        orbits: data.orbits || {},
        viewport: data.viewport || DEFAULT_VIEWPORT,
        gridSettings: data.gridSettings || DEFAULT_GRID_SETTINGS,
        selectedElement: null,
        undoStack: [], // Clear undo stack on import
      });
      get().saveToLocalStorage();
    },

    exportData: () => {
      const state = get();
      return {
        nodes: state.nodes,
        images: state.images,
        orbits: state.orbits,
        viewport: state.viewport,
        gridSettings: state.gridSettings,
      };
    },

    clearAll: () => {
      set({
        nodes: {},
        images: {},
        orbits: {},
        viewport: DEFAULT_VIEWPORT,
        gridSettings: DEFAULT_GRID_SETTINGS,
        selectedElement: null,
        undoStack: [], // Clear undo stack
      });
      localStorage.removeItem(STORAGE_KEY);
    },

    // Persistence
    saveToLocalStorage: () => {
      const state = get();
      const data: EditorData = {
        nodes: state.nodes,
        images: state.images,
        orbits: state.orbits,
        viewport: state.viewport,
        gridSettings: state.gridSettings,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    },

    loadFromLocalStorage: () => {
      const data = loadInitialData();
      set({
        nodes: data.nodes,
        images: data.images,
        orbits: data.orbits,
        viewport: data.viewport,
        gridSettings: data.gridSettings,
        undoStack: [], // Start with empty undo stack
      });
    },
  };
});
