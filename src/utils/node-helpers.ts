import { NodeType } from '../types';

export const RADIUS_SMALL = 20;
export const RADIUS_LARGE = 30;
export const RADIUS_MASTER = 40;
export const STROKE_WIDTH = 8;

export function getNodeRadius(type: NodeType): number {
  switch (type) {
    case NodeType.LargeNode: {
      return RADIUS_LARGE;
    }
    case NodeType.MasterNode: {
      return RADIUS_MASTER;
    }
    default: {
      return RADIUS_SMALL;
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
