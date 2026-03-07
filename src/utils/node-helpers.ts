import {
  NODE_RADIUS_EXTRALARGE,
  NODE_RADIUS_LARGE,
  NODE_RADIUS_MEDIUM,
  NODE_RADIUS_SMALL,
} from '@/constants';

import { EditorConnections, NodeType } from '../types';

export function getNodeRadius(type: NodeType): number {
  switch (type) {
    case NodeType.MediumNode: {
      return NODE_RADIUS_MEDIUM;
    }
    case NodeType.LargeNode: {
      return NODE_RADIUS_LARGE;
    }
    case NodeType.ExtraLargeNode: {
      return NODE_RADIUS_EXTRALARGE;
    }
    default: {
      return NODE_RADIUS_SMALL;
    }
  }
}

export function isPointInCircle(
  pointX: number,
  pointY: number,
  circleX: number,
  circleY: number,
  radius: number
): boolean {
  const dx = pointX - circleX;
  const dy = pointY - circleY;
  return dx * dx + dy * dy <= radius * radius;
}

export function isPointInRect(
  pointX: number,
  pointY: number,
  rectX: number,
  rectY: number,
  width: number,
  height: number
): boolean {
  return pointX >= rectX && pointX <= rectX + width && pointY >= rectY && pointY <= rectY + height;
}

/**
 * Находит все ноды, связанные с указанной нодой через connections (обход графа в ширину)
 * @param nodeId - ID ноды, для которой ищем связанные ноды
 * @param connections - Объект со всеми соединениями
 * @returns Set с ID всех связанных нод (включая исходную ноду)
 */
export function getConnectedNodeIds(nodeId: string, connections: EditorConnections): Set<string> {
  const connectedIds = new Set<string>();
  const queue: string[] = [nodeId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const currentId = queue.shift()!;

    if (visited.has(currentId)) continue;
    visited.add(currentId);
    connectedIds.add(currentId);

    // Найти все соединения с текущей нодой
    for (const connection of Object.values(connections)) {
      if (connection.fromId === currentId && !visited.has(connection.toId)) {
        queue.push(connection.toId);
      } else if (connection.toId === currentId && !visited.has(connection.fromId)) {
        queue.push(connection.fromId);
      }
    }
  }

  return connectedIds;
}
