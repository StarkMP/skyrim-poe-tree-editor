import { Shape } from 'react-konva';

import { getGridRange, getVisibleRect } from '@/utils/grid-helpers';

type GridLayerProps = {
  gridSize: number;
  enabled: boolean;
  stagePos: { x: number; y: number };
  stageSize: { width: number; height: number };
  scale: number;
};

// Минимальный масштаб, при котором отображается сетка
const MIN_SCALE_FOR_GRID = 0.3;

export const GridLayer = ({ gridSize, enabled, stagePos, stageSize, scale }: GridLayerProps) => {
  if (!enabled) return null;

  // Скрываем сетку при сильном отдалении
  if (scale < MIN_SCALE_FOR_GRID) return null;

  const visibleRect = getVisibleRect(stagePos, stageSize, scale);
  const { startX, endX, startY, endY } = getGridRange(visibleRect, gridSize);

  // Вычисляем opacity в зависимости от масштаба для плавного исчезновения
  const opacity = Math.min(1, (scale - MIN_SCALE_FOR_GRID) / (0.5 - MIN_SCALE_FOR_GRID));

  return (
    <Shape
      sceneFunc={(context, shape) => {
        context.fillStyle = `rgba(255, 255, 255, ${0.2 * opacity})`;

        // Рисуем все точки за один проход
        for (let x = startX; x <= endX; x += gridSize) {
          for (let y = startY; y <= endY; y += gridSize) {
            context.beginPath();
            context.arc(x, y, 2, 0, Math.PI * 2);
            context.fill();
          }
        }

        // Необходимо для корректной работы Konva
        context.fillStrokeShape(shape);
      }}
      listening={false}
    />
  );
};
