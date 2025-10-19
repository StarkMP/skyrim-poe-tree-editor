export const enum PerksTreeNodeType {
  SmallNode = 0,
  LargeNode = 1,
  MasterNode = 2,
}

export type PerksTreeNode = {
  type: PerksTreeNodeType;
  title: string;
  description: string;
  requiredLevel: number;
  gameId: string;
  keywords: string[];
  x: number;
  y: number;
  connections: string[];
};

export type PerksTreeNodes = { [uid: string]: PerksTreeNode };

export type PerksTreeData = {
  width: number;
  height: number;
  nodes: PerksTreeNodes;
};
