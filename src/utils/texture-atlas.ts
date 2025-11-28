import { NODE_ICON_SIZE_PERCENT } from '@/constants';
import { NodeType } from '@/types';

import { getNodeRadius } from './node-helpers';

export type AtlasNode = {
  uid: string;
  type: NodeType;
  iconUrl?: string;
  iconImage: HTMLImageElement | null;
  borderImage: HTMLImageElement;
};

export type AtlasRect = {
  uid: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type TextureAtlasResult = {
  canvas: HTMLCanvasElement;
  rects: Map<string, AtlasRect>;
  width: number;
  height: number;
};

/**
 * Вычисляет размер ноды в атласе с учетом бордера
 */
export function getNodeAtlasSize(type: NodeType): number {
  const radius = getNodeRadius(type);
  const diameter = radius * 2;
  const borderScale = 1.15;
  return Math.ceil(diameter * borderScale);
}

/**
 * Группирует ноды по типу для оптимальной упаковки
 */
function groupNodesByType(nodes: AtlasNode[]): Map<NodeType, AtlasNode[]> {
  const groups = new Map<NodeType, AtlasNode[]>();

  for (const node of nodes) {
    if (!groups.has(node.type)) {
      groups.set(node.type, []);
    }
    groups.get(node.type)!.push(node);
  }

  return groups;
}

/**
 * Упаковывает ноды в атлас текстур используя shelf-packing алгоритм с максимальной шириной
 */
export function packTextureAtlas(
  nodes: AtlasNode[],
  padding: number = 4,
  maxWidth: number = 2048,
  scaleFactor: number = 1
): TextureAtlasResult {
  const rects = new Map<string, AtlasRect>();

  const groups = groupNodesByType(nodes);

  const sortedTypes = Array.from(groups.keys()).toSorted(
    (a, b) => getNodeAtlasSize(b) - getNodeAtlasSize(a)
  );

  // Применяем масштабный коэффициент к padding и maxWidth
  const scaledPadding = padding * scaleFactor;
  const scaledMaxWidth = maxWidth * scaleFactor;

  let currentY = scaledPadding;
  let actualMaxWidth = 0;

  for (const type of sortedTypes) {
    const groupNodes = groups.get(type)!;
    const nodeSize = getNodeAtlasSize(type) * scaleFactor;

    let currentX = scaledPadding;

    for (const node of groupNodes) {
      if (currentX + nodeSize > scaledMaxWidth && currentX > scaledPadding) {
        currentX = scaledPadding;
        currentY += nodeSize + scaledPadding;
      }

      rects.set(node.uid, {
        uid: node.uid,
        x: currentX,
        y: currentY,
        width: nodeSize,
        height: nodeSize,
      });

      currentX += nodeSize + scaledPadding;
      actualMaxWidth = Math.max(actualMaxWidth, currentX);
    }

    currentY += nodeSize + scaledPadding;
  }

  const atlasWidth = Math.min(actualMaxWidth, scaledMaxWidth);
  const atlasHeight = currentY;

  const canvas = document.createElement('canvas');
  canvas.width = atlasWidth;
  canvas.height = atlasHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  for (const node of nodes) {
    const rect = rects.get(node.uid)!;
    const radius = getNodeRadius(node.type) * scaleFactor;
    const centerX = rect.x + rect.width / 2;
    const centerY = rect.y + rect.height / 2;

    if (node.iconImage) {
      ctx.save();

      const iconRadius = radius * NODE_ICON_SIZE_PERCENT;

      ctx.beginPath();
      ctx.arc(centerX, centerY, iconRadius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(
        node.iconImage,
        centerX - iconRadius,
        centerY - iconRadius,
        iconRadius * 2,
        iconRadius * 2
      );
      ctx.restore();
    }

    ctx.drawImage(node.borderImage, rect.x, rect.y, rect.width, rect.height);
  }

  return {
    canvas,
    rects,
    width: atlasWidth,
    height: atlasHeight,
  };
}

/**
 * Загружает изображение
 */
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
