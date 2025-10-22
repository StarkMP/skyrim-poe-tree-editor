import { NODE_RADIUS_LARGE, NODE_RADIUS_MASTER, NODE_RADIUS_SMALL } from '@/constants';

import { NodeType } from '../types';

export function getNodeRadius(type: NodeType): number {
  switch (type) {
    case NodeType.LargeNode: {
      return NODE_RADIUS_LARGE;
    }
    case NodeType.MasterNode: {
      return NODE_RADIUS_MASTER;
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
