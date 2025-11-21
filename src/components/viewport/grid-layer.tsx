import { Shape } from 'react-konva';

import { GRID_DOT_COLOR, GRID_MIN_SCALE } from '@/constants';
import { getGridRange, getVisibleRect } from '@/utils/grid-helpers';

type GridLayerProps = {
  gridSize: number;
  enabled: boolean;
  rotation: number;
  stagePos: { x: number; y: number };
  stageSize: { width: number; height: number };
  scale: number;
};

export const GridLayer = ({
  gridSize,
  enabled,
  rotation,
  stagePos,
  stageSize,
  scale,
}: GridLayerProps) => {
  if (!enabled) return null;

  if (scale < GRID_MIN_SCALE) return null;

  const opacity = Math.min(1, (scale - GRID_MIN_SCALE) / (0.5 - GRID_MIN_SCALE));

  return (
    <Shape
      sceneFunc={(context, shape) => {
        const baseOpacity = 0.2;
        context.fillStyle = `rgba(255, 255, 255, ${baseOpacity * opacity})`;

        const visibleRect = getVisibleRect(stagePos, stageSize, scale);

        const corners = [
          { x: visibleRect.x1, y: visibleRect.y1 },
          { x: visibleRect.x2, y: visibleRect.y1 },
          { x: visibleRect.x2, y: visibleRect.y2 },
          { x: visibleRect.x1, y: visibleRect.y2 },
        ];

        const rad = (-rotation * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        const rotatedCorners = corners.map((corner) => ({
          x: corner.x * cos - corner.y * sin,
          y: corner.x * sin + corner.y * cos,
        }));

        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        for (const corner of rotatedCorners) {
          minX = Math.min(minX, corner.x);
          maxX = Math.max(maxX, corner.x);
          minY = Math.min(minY, corner.y);
          maxY = Math.max(maxY, corner.y);
        }

        const padding = gridSize * 2;
        minX -= padding;
        maxX += padding;
        minY -= padding;
        maxY += padding;

        const startX = Math.floor(minX / gridSize) * gridSize;
        const endX = Math.ceil(maxX / gridSize) * gridSize;
        const startY = Math.floor(minY / gridSize) * gridSize;
        const endY = Math.ceil(maxY / gridSize) * gridSize;

        const forwardRad = (rotation * Math.PI) / 180;
        const forwardCos = Math.cos(forwardRad);
        const forwardSin = Math.sin(forwardRad);

        for (let x = startX; x <= endX; x += gridSize) {
          for (let y = startY; y <= endY; y += gridSize) {
            const worldX = x * forwardCos - y * forwardSin;
            const worldY = x * forwardSin + y * forwardCos;

            context.beginPath();
            context.arc(worldX, worldY, 2, 0, Math.PI * 2);
            context.fill();
          }
        }

        context.fillStrokeShape(shape);
      }}
      listening={false}
    />
  );
};
