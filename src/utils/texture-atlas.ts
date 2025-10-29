import { NODE_ICON_SIZE_PERCENT } from '@/constants';
import { NodeType } from '@/types';

import { getNodeRadius } from './node-helpers';

export type AtlasNode = {
  uid: string;
  type: NodeType;
  iconUrl?: string; // опционально - для нод без иконки
  iconImage: HTMLImageElement | null; // null если нет иконки
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
  maxWidth: number = 2048
): TextureAtlasResult {
  const rects = new Map<string, AtlasRect>();

  // Группируем ноды по типу (размеру)
  const groups = groupNodesByType(nodes);

  // Сортируем группы по размеру (от большего к меньшему)
  const sortedTypes = Array.from(groups.keys()).toSorted(
    (a, b) => getNodeAtlasSize(b) - getNodeAtlasSize(a)
  );

  let currentY = padding;
  let actualMaxWidth = 0;

  // Упаковываем каждую группу с учетом максимальной ширины (flex-wrap)
  for (const type of sortedTypes) {
    const groupNodes = groups.get(type)!;
    const nodeSize = getNodeAtlasSize(type);

    let currentX = padding;

    // Размещаем ноды в текущей группе с переносом на новую строку
    for (const node of groupNodes) {
      // Проверяем, поместится ли нода в текущую строку
      if (currentX + nodeSize > maxWidth && currentX > padding) {
        // Переносим на новую строку
        currentX = padding;
        currentY += nodeSize + padding;
      }

      rects.set(node.uid, {
        uid: node.uid,
        x: currentX,
        y: currentY,
        width: nodeSize,
        height: nodeSize,
      });

      currentX += nodeSize + padding;
      actualMaxWidth = Math.max(actualMaxWidth, currentX);
    }

    // Переходим к следующей группе (новый ряд)
    currentY += nodeSize + padding;
  }

  // Итоговые размеры атласа
  const atlasWidth = Math.min(actualMaxWidth, maxWidth);
  const atlasHeight = currentY;

  // Создаем canvas для атласа
  const canvas = document.createElement('canvas');
  canvas.width = atlasWidth;
  canvas.height = atlasHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Рисуем каждую ноду в атласе
  for (const node of nodes) {
    const rect = rects.get(node.uid)!;
    const radius = getNodeRadius(node.type);
    const centerX = rect.x + rect.width / 2;
    const centerY = rect.y + rect.height / 2;

    // Рисуем иконку с круглой маской (если есть иконка)
    if (node.iconImage) {
      ctx.save();

      // Применяем NODE_ICON_SIZE_PERCENT для размера иконки
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

    // Рисуем бордер поверх иконки (или просто бордер, если иконки нет)
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
