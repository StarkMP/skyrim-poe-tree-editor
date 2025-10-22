export type GamePerksData = {
  id: string;
  name: string;
  description: string;
  requiredLevel: number | null;
};

export const enum NodeType {
  SmallNode = 0,
  LargeNode = 1,
  MasterNode = 2,
}

type NodeUID = string;

export type EditorNode = {
  type: NodeType;
  perkId: GamePerksData['id'];
  iconUrl: string;
  title: GamePerksData['name'];
  description: GamePerksData['description'];
  requiredLevel: GamePerksData['requiredLevel'];
  keywords: string[];
  x: number;
  y: number;
  connections: NodeUID[];
};

export type EditorNodes = { [uid: NodeUID]: EditorNode };

export type EditorImage = {
  width: number;
  height: number;
  x: number;
  y: number;
  imageUrl: string;
  opacity?: number; // 0-1, default 1
  rotation?: number; // degrees, default 0
};

export type EditorImages = { [uid: string]: EditorImage };

export type ViewportState = {
  x: number;
  y: number;
  scale: number;
};

export type GridSettings = {
  enabled: boolean;
  size: number; // размер ячейки сетки (20-200)
};

export type EditorData = {
  nodes: EditorNodes;
  images: EditorImages;
  viewport?: ViewportState;
  gridSettings?: GridSettings;
};

export type ExportNode = {
  type: NodeType;
  perkId: GamePerksData['id'];
  title: GamePerksData['name'];
  description: GamePerksData['description'];
  requiredLevel: GamePerksData['requiredLevel'];
  keywords: string[];
  x: number;
  y: number;
  connections: string[];
};

export type ExportNodes = { [uid: NodeUID]: ExportNode };

export type ExportData = {
  width: number;
  height: number;
  nodes: ExportNodes;
};

export type ImportData = EditorData;
