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
};

export type EditorNodes = { [uid: NodeUID]: EditorNode };

export type Connection = {
  fromId: string;
  toId: string;
  curvature: number; // -100 до 100, где 0 = прямая линия
};

export type EditorConnections = { [uid: string]: Connection };

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

export type PositionOrbit = {
  x: number; // центр орбиты
  y: number; // центр орбиты
  radius: number; // радиус орбиты (расстояние до точек)
  pointCount: number; // количество точек на орбите (4-16)
  rotation?: number; // поворот орбиты в градусах (0-360), по умолчанию 0
};

export type EditorOrbits = { [uid: string]: PositionOrbit };

export type EditorData = {
  nodes: EditorNodes;
  images: EditorImages;
  orbits?: EditorOrbits;
  connections?: EditorConnections;
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
};

export type ExportNodes = { [uid: NodeUID]: ExportNode };

export type ExportData = {
  width: number;
  height: number;
  nodes: ExportNodes;
  connections: EditorConnections;
};

export type ImportData = EditorData;
