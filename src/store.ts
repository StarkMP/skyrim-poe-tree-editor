import { nanoid } from 'nanoid';
import { create } from 'zustand';

import {
  ORBIT_DEFAULT_POINTS,
  ORBIT_DEFAULT_RADIUS,
  ORBIT_DEFAULT_ROTATION,
  WEB_DEFAULT_CONCENTRIC_CIRCLES,
  WEB_DEFAULT_INNER_RADIUS,
  WEB_DEFAULT_ROTATION,
  WEB_DEFAULT_SIZE,
  WEB_DEFAULT_SPOKES,
} from './constants';
import gamePerksData from './data/game-perks.json';
import {
  Connection,
  EditorConnections,
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
  WebSettings,
} from './types';
import { getSecretKey } from './utils/s3-credentials';

const STORAGE_KEY = 'skyrim-poe-tree-editor-data';
const MAX_UNDO_STACK_SIZE = 50;
const SAVE_DEBOUNCE_MS = 300;

let saveToLocalStorageTimer: NodeJS.Timeout | null = null;

const debouncedSaveToLocalStorage = (state: Store) => {
  if (saveToLocalStorageTimer) {
    clearTimeout(saveToLocalStorageTimer);
  }

  saveToLocalStorageTimer = setTimeout(() => {
    const data: EditorData = {
      nodes: state.nodes,
      images: state.images,
      orbits: state.orbits,
      connections: state.connections,
      viewport: state.viewport,
      gridSettings: state.gridSettings,
      webSettings: state.webSettings,
      globalSettingsExpanded: state.globalSettingsExpanded,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, SAVE_DEBOUNCE_MS);
};

type SelectedElement = {
  id: string;
  type: 'node' | 'image' | 'orbit' | 'connection';
} | null;

type MultiSelectedElement = {
  id: string;
  type: 'node' | 'image' | 'orbit';
};

type ViewportCenterRequest = {
  id: string;
  type: 'node' | 'image' | 'orbit';
  timestamp: number;
} | null;

type UndoAction =
  | { type: 'ADD_NODE'; nodeId: string }
  | { type: 'DELETE_NODE'; nodeId: string; nodeData: EditorNode }
  | { type: 'UPDATE_NODE'; nodeId: string; previousData: Partial<EditorNode> }
  | { type: 'ADD_CONNECTION'; connectionId: string; connectionData: Connection }
  | { type: 'REMOVE_CONNECTION'; connectionId: string; connectionData: Connection }
  | { type: 'UPDATE_CONNECTION'; connectionId: string; previousData: Partial<Connection> }
  | { type: 'REMOVE_ALL_CONNECTIONS'; nodeId: string; connections: string[] }
  | { type: 'ADD_IMAGE'; imageId: string }
  | { type: 'DELETE_IMAGE'; imageId: string; imageData: EditorImage }
  | { type: 'UPDATE_IMAGE'; imageId: string; previousData: Partial<EditorImage> }
  | { type: 'ADD_ORBIT'; orbitId: string }
  | { type: 'DELETE_ORBIT'; orbitId: string; orbitData: PositionOrbit }
  | { type: 'UPDATE_ORBIT'; orbitId: string; previousData: Partial<PositionOrbit> };

export type Store = {
  nodes: EditorNodes;
  images: EditorImages;
  orbits: EditorOrbits;
  connections: EditorConnections;
  gamePerks: GamePerksData;
  gamePerkIdsSet: Set<string>;
  selectedElement: SelectedElement;
  selectedElements: Set<string>;
  multiSelectedElementsData: Map<string, MultiSelectedElement>;
  viewportCenterRequest: ViewportCenterRequest;
  viewport: ViewportState;
  gridSettings: GridSettings;
  webSettings: WebSettings;

  globalSettingsExpanded: boolean;

  s3SecretKey: string | null;
  isS3KeyValid: boolean;

  undoStack: UndoAction[];

  addNode: (x: number, y: number) => string;
  updateNode: (id: string, updates: Partial<EditorNode>) => void;
  deleteNode: (id: string) => void;
  addConnection: (fromId: string, toId: string) => void;
  removeConnection: (connectionId: string) => void;
  updateConnection: (id: string, updates: Partial<Connection>) => void;
  removeAllConnections: (nodeId: string) => void;

  addImage: (x: number, y: number) => string;
  updateImage: (id: string, updates: Partial<EditorImage>) => void;
  deleteImage: (id: string) => void;

  addOrbit: (x: number, y: number) => string;
  updateOrbit: (id: string, updates: Partial<PositionOrbit>) => void;
  deleteOrbit: (id: string) => void;

  selectElement: (
    id: string | null,
    type: 'node' | 'image' | 'orbit' | 'connection' | null
  ) => void;
  toggleElementSelection: (id: string, type: 'node' | 'image' | 'orbit') => void;
  clearSelection: () => void;
  isElementSelected: (id: string) => boolean;

  updateMultipleElements: (
    updates: Array<{
      id: string;
      type: 'node' | 'image' | 'orbit';
      updates: Partial<EditorNode> | Partial<EditorImage> | Partial<PositionOrbit>;
    }>
  ) => void;

  requestCenterOnElement: (id: string, type: 'node' | 'image' | 'orbit') => void;
  clearCenterRequest: () => void;
  updateViewport: (viewport: ViewportState) => void;

  updateGridSettings: (settings: Partial<GridSettings>) => void;

  updateWebSettings: (settings: Partial<WebSettings>) => void;

  setGlobalSettingsExpanded: (expanded: boolean) => void;

  setS3SecretKey: (key: string) => void;
  clearS3SecretKey: () => void;
  getS3SecretKey: () => string | null;

  undo: () => void;
  canUndo: () => boolean;

  importData: (data: EditorData) => void;
  exportData: () => EditorData;
  clearAll: () => void;

  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
};

const createDefaultNode = (x: number, y: number): EditorNode => ({
  type: NodeType.SmallNode,
  perkId: '',
  iconUrl: '',
  title: '',
  description: '',
  reqDescription: '',
  keywords: [],
  x,
  y,
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

const pushUndoAction = (state: Store, action: UndoAction) => {
  const newStack = [...state.undoStack, action];

  if (newStack.length > MAX_UNDO_STACK_SIZE) {
    newStack.shift();
  }

  return { undoStack: newStack };
};

const DEFAULT_VIEWPORT: ViewportState = { x: 0, y: 0, scale: 1 };
const DEFAULT_GRID_SETTINGS: GridSettings = { enabled: false, size: 100, rotation: 0 };
const DEFAULT_WEB_SETTINGS: WebSettings = {
  enabled: false,
  size: WEB_DEFAULT_SIZE,
  spokes: WEB_DEFAULT_SPOKES,
  rotation: WEB_DEFAULT_ROTATION,
  innerRadius: WEB_DEFAULT_INNER_RADIUS,
  concentricCircles: WEB_DEFAULT_CONCENTRIC_CIRCLES,
};

const loadInitialData = () => {
  const defaults = {
    nodes: {},
    images: {},
    orbits: {},
    connections: {},
    viewport: DEFAULT_VIEWPORT,
    gridSettings: DEFAULT_GRID_SETTINGS,
    webSettings: DEFAULT_WEB_SETTINGS,
    globalSettingsExpanded: true,
  };

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaults;

    const data: EditorData = JSON.parse(stored);

    return {
      nodes: data.nodes || defaults.nodes,
      images: data.images || defaults.images,
      orbits: data.orbits || defaults.orbits,
      connections: data.connections || defaults.connections,
      viewport: data.viewport || defaults.viewport,
      gridSettings: data.gridSettings || defaults.gridSettings,
      webSettings: data.webSettings || defaults.webSettings,
      globalSettingsExpanded: data.globalSettingsExpanded ?? defaults.globalSettingsExpanded,
    };
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return defaults;
  }
};

export const useStore = create<Store>((set, get) => {
  const initialData = loadInitialData();
  const gamePerks = gamePerksData as GamePerksData;
  const storedSecretKey = getSecretKey();

  return {
    nodes: initialData.nodes,
    images: initialData.images,
    orbits: initialData.orbits,
    connections: initialData.connections,
    gamePerks,
    gamePerkIdsSet: new Set(Object.keys(gamePerks)),
    selectedElement: null,
    selectedElements: new Set(),
    multiSelectedElementsData: new Map(),
    viewportCenterRequest: null,
    viewport: initialData.viewport,
    gridSettings: initialData.gridSettings,
    webSettings: initialData.webSettings,
    globalSettingsExpanded: initialData.globalSettingsExpanded,
    s3SecretKey: storedSecretKey,
    isS3KeyValid: !!storedSecretKey,
    undoStack: [],

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

        const newConnections = { ...state.connections };
        for (const [connId, conn] of Object.entries(newConnections)) {
          if (conn.fromId === id || conn.toId === id) {
            delete newConnections[connId];
          }
        }

        return {
          ...pushUndoAction(state, { type: 'DELETE_NODE', nodeId: id, nodeData: nodeToDelete }),
          nodes: newNodes,
          connections: newConnections,
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

        const existingConnection = Object.values(state.connections).find(
          (conn) =>
            (conn.fromId === fromId && conn.toId === toId) ||
            (conn.fromId === toId && conn.toId === fromId)
        );
        if (existingConnection) return state;

        const connectionId = nanoid();
        const connectionData: Connection = {
          fromId,
          toId,
          curvature: 0,
        };

        return {
          ...pushUndoAction(state, { type: 'ADD_CONNECTION', connectionId, connectionData }),
          connections: {
            ...state.connections,
            [connectionId]: connectionData,
          },
        };
      });
      get().saveToLocalStorage();
    },

    removeConnection: (connectionId: string) => {
      set((state) => {
        const connection = state.connections[connectionId];
        if (!connection) return state;

        const newConnections = { ...state.connections };
        delete newConnections[connectionId];

        return {
          ...pushUndoAction(state, {
            type: 'REMOVE_CONNECTION',
            connectionId,
            connectionData: connection,
          }),
          connections: newConnections,
          selectedElement:
            state.selectedElement?.id === connectionId ? null : state.selectedElement,
        };
      });
      get().saveToLocalStorage();
    },

    updateConnection: (id: string, updates: Partial<Connection>) => {
      set((state) => {
        const currentConnection = state.connections[id];
        if (!currentConnection) return state;

        const previousData: Partial<Connection> = {};
        for (const key of Object.keys(updates) as Array<keyof Connection>) {
          previousData[key] = currentConnection[key] as any;
        }

        return {
          ...pushUndoAction(state, { type: 'UPDATE_CONNECTION', connectionId: id, previousData }),
          connections: {
            ...state.connections,
            [id]: { ...currentConnection, ...updates },
          },
        };
      });
      get().saveToLocalStorage();
    },

    removeAllConnections: (nodeId: string) => {
      set((state) => {
        const node = state.nodes[nodeId];
        if (!node) return state;

        const connectionsToRemove: string[] = [];
        const newConnections = { ...state.connections };

        for (const [connId, conn] of Object.entries(newConnections)) {
          if (conn.fromId === nodeId || conn.toId === nodeId) {
            connectionsToRemove.push(connId);
            delete newConnections[connId];
          }
        }

        return {
          ...pushUndoAction(state, {
            type: 'REMOVE_ALL_CONNECTIONS',
            nodeId,
            connections: connectionsToRemove,
          }),
          connections: newConnections,
        };
      });
      get().saveToLocalStorage();
    },

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

    selectElement: (id: string | null, type: 'node' | 'image' | 'orbit' | 'connection' | null) => {
      set({
        selectedElement: id && type ? { id, type } : null,
        selectedElements: new Set(),
        multiSelectedElementsData: new Map(),
      });
    },

    toggleElementSelection: (id: string, type: 'node' | 'image' | 'orbit') => {
      set((state) => {
        const newSelectedElements = new Set(state.selectedElements);
        const newMultiSelectedElementsData = new Map(state.multiSelectedElementsData);

        if (newSelectedElements.has(id)) {
          newSelectedElements.delete(id);
          newMultiSelectedElementsData.delete(id);
        } else {
          newSelectedElements.add(id);
          newMultiSelectedElementsData.set(id, { id, type });
        }

        return {
          selectedElement: null,
          selectedElements: newSelectedElements,
          multiSelectedElementsData: newMultiSelectedElementsData,
        };
      });
    },

    clearSelection: () => {
      set({
        selectedElement: null,
        selectedElements: new Set(),
        multiSelectedElementsData: new Map(),
      });
    },

    isElementSelected: (id: string) => {
      const state = get();
      return state.selectedElements.has(id) || state.selectedElement?.id === id;
    },

    updateMultipleElements: (
      updates: Array<{
        id: string;
        type: 'node' | 'image' | 'orbit';
        updates: Partial<EditorNode> | Partial<EditorImage> | Partial<PositionOrbit>;
      }>
    ) => {
      set((state) => {
        const newNodes = { ...state.nodes };
        const newImages = { ...state.images };
        const newOrbits = { ...state.orbits };

        for (const update of updates) {
          if (update.type === 'node' && newNodes[update.id]) {
            const currentNode = newNodes[update.id];
            newNodes[update.id] = { ...currentNode, ...update.updates };
          } else if (update.type === 'image' && newImages[update.id]) {
            const currentImage = newImages[update.id];
            newImages[update.id] = { ...currentImage, ...update.updates };
          } else if (update.type === 'orbit' && newOrbits[update.id]) {
            const currentOrbit = newOrbits[update.id];
            newOrbits[update.id] = { ...currentOrbit, ...update.updates };
          }
        }

        return {
          nodes: newNodes,
          images: newImages,
          orbits: newOrbits,
        };
      });
      debouncedSaveToLocalStorage(get());
    },

    requestCenterOnElement: (id: string, type: 'node' | 'image' | 'orbit') => {
      set({
        viewportCenterRequest: { id, type, timestamp: Date.now() },
      });
    },

    clearCenterRequest: () => {
      set({ viewportCenterRequest: null });
    },

    updateViewport: (viewport: ViewportState) => {
      set({ viewport });
      get().saveToLocalStorage();
    },

    updateGridSettings: (settings: Partial<GridSettings>) => {
      set((state) => ({
        gridSettings: { ...state.gridSettings, ...settings },
      }));
      get().saveToLocalStorage();
    },

    updateWebSettings: (settings: Partial<WebSettings>) => {
      set((state) => ({
        webSettings: { ...state.webSettings, ...settings },
      }));
      get().saveToLocalStorage();
    },

    setGlobalSettingsExpanded: (expanded: boolean) => {
      set({ globalSettingsExpanded: expanded });
      get().saveToLocalStorage();
    },

    setS3SecretKey: (key: string) => {
      set({ s3SecretKey: key, isS3KeyValid: true });
    },

    clearS3SecretKey: () => {
      set({ s3SecretKey: null, isS3KeyValid: false });
    },

    getS3SecretKey: () => get().s3SecretKey,

    undo: () => {
      const state = get();
      if (state.undoStack.length === 0) return;

      const action = state.undoStack.at(-1);
      if (!action) return;

      const newStack = state.undoStack.slice(0, -1);

      set({ undoStack: newStack });

      switch (action.type) {
        case 'ADD_NODE': {
          const newNodes = { ...state.nodes };
          delete newNodes[action.nodeId];

          const newConnections = { ...state.connections };
          for (const [connId, conn] of Object.entries(newConnections)) {
            if (conn.fromId === action.nodeId || conn.toId === action.nodeId) {
              delete newConnections[connId];
            }
          }

          set({
            nodes: newNodes,
            connections: newConnections,
            selectedElement:
              state.selectedElement?.id === action.nodeId ? null : state.selectedElement,
          });
          break;
        }

        case 'DELETE_NODE': {
          set({
            nodes: {
              ...state.nodes,
              [action.nodeId]: action.nodeData,
            },
          });
          break;
        }

        case 'UPDATE_NODE': {
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
          const newConnections = { ...state.connections };
          delete newConnections[action.connectionId];

          set({
            connections: newConnections,
            selectedElement:
              state.selectedElement?.id === action.connectionId ? null : state.selectedElement,
          });
          break;
        }

        case 'REMOVE_CONNECTION': {
          set({
            connections: {
              ...state.connections,
              [action.connectionId]: action.connectionData,
            },
          });
          break;
        }

        case 'UPDATE_CONNECTION': {
          const currentConnection = state.connections[action.connectionId];
          if (currentConnection) {
            set({
              connections: {
                ...state.connections,
                [action.connectionId]: { ...currentConnection, ...action.previousData },
              },
            });
          }
          break;
        }

        case 'REMOVE_ALL_CONNECTIONS': {
          break;
        }

        case 'ADD_IMAGE': {
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
          set({
            images: {
              ...state.images,
              [action.imageId]: action.imageData,
            },
          });
          break;
        }

        case 'UPDATE_IMAGE': {
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
          set({
            orbits: {
              ...state.orbits,
              [action.orbitId]: action.orbitData,
            },
          });
          break;
        }

        case 'UPDATE_ORBIT': {
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

    importData: (data: EditorData) => {
      set({
        nodes: data.nodes,
        images: data.images,
        orbits: data.orbits || {},
        connections: data.connections || {},
        viewport: data.viewport || DEFAULT_VIEWPORT,
        gridSettings: data.gridSettings || DEFAULT_GRID_SETTINGS,
        selectedElement: null,
        selectedElements: new Set(),
        multiSelectedElementsData: new Map(),
        undoStack: [],
      });
      get().saveToLocalStorage();
    },

    exportData: () => {
      const state = get();
      return {
        nodes: state.nodes,
        images: state.images,
        orbits: state.orbits,
        connections: state.connections,
        viewport: state.viewport,
        gridSettings: state.gridSettings,
      };
    },

    clearAll: () => {
      set({
        nodes: {},
        images: {},
        orbits: {},
        connections: {},
        viewport: DEFAULT_VIEWPORT,
        gridSettings: DEFAULT_GRID_SETTINGS,
        selectedElement: null,
        selectedElements: new Set(),
        multiSelectedElementsData: new Map(),
        undoStack: [],
      });
      localStorage.removeItem(STORAGE_KEY);
    },

    saveToLocalStorage: () => {
      const state = get();
      const data: EditorData = {
        nodes: state.nodes,
        images: state.images,
        orbits: state.orbits,
        connections: state.connections,
        viewport: state.viewport,
        gridSettings: state.gridSettings,
        webSettings: state.webSettings,
        globalSettingsExpanded: state.globalSettingsExpanded,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    },

    loadFromLocalStorage: () => {
      const data = loadInitialData();
      set({
        nodes: data.nodes,
        images: data.images,
        orbits: data.orbits,
        connections: data.connections,
        viewport: data.viewport,
        gridSettings: data.gridSettings,
        webSettings: data.webSettings,
        globalSettingsExpanded: data.globalSettingsExpanded,
        selectedElements: new Set(),
        multiSelectedElementsData: new Map(),
        undoStack: [],
      });
    },
  };
});
