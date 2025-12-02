export type GamePerk = {
  name: string;
  description: string;
};

export type GamePerksData = {
  [id: string]: GamePerk;
};

export const enum SkillTree {
  Illusion,
  Conjuration,
  Destruction,
  Restoration,
  Alteration,
  Enchanting,
  Smithing,
  HeavyArmor,
  Blocking,
  TwoHanded,
  OneHanded,
  Archery,
  Evasion,
  Sneak,
  Alchemy,
  Pickpocket,
  Thuum,
  Speech,
  Vampire,
  Lycanthropy,
}

export const enum NodeType {
  SmallNode = 0,
  LargeNode = 1,
  MasterNode = 2,
}

export type EditorNode = {
  type: NodeType;
  perkId: string;
  iconUrl?: string;
  title: string;
  description: string;
  reqDescription: string;
  keywords: string[];
  x: number;
  y: number;
  skillTree?: SkillTree;
};

export type EditorNodes = { [uid: string]: EditorNode };

export type Connection = {
  fromId: string;
  toId: string;
  curvature: number;
};

export type EditorConnections = { [uid: string]: Connection };

export type EditorImage = {
  width: number;
  height: number;
  x: number;
  y: number;
  imageUrl: string;
  opacity?: number;
  rotation?: number;
};

export type EditorImages = { [uid: string]: EditorImage };

export type ViewportState = {
  x: number;
  y: number;
  scale: number;
};

export type GridSettings = {
  enabled: boolean;
  size: number;
  rotation: number;
};

export type WebSettings = {
  enabled: boolean;
  size: number;
  spokes: number;
  rotation: number;
  innerRadius: number;
  concentricCircles: number;
};

export type PositionOrbit = {
  x: number;
  y: number;
  radius: number;
  pointCount: number;
  rotation?: number;
};

export type EditorOrbits = { [uid: string]: PositionOrbit };

export type EditorData = {
  nodes: EditorNodes;
  images: EditorImages;
  orbits?: EditorOrbits;
  connections?: EditorConnections;
  viewport?: ViewportState;
  gridSettings?: GridSettings;
  webSettings?: WebSettings;
  globalSettingsExpanded?: boolean;
};

export type ExportNode = {
  type: NodeType;
  title: string;
  description: string;
  reqDescription: string;
  keywords: string[];
  x: number;
  y: number;
  skillTree?: SkillTree;
  texture: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

export type ExportNodes = { [uid: EditorNode['perkId']]: ExportNode };

export type ExportData = {
  width: number;
  height: number;
  nodes: ExportNodes;
  connections: EditorConnections;
  backgroundImages: Array<{
    filename: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
  }>;
};

export type ImportData = EditorData;
