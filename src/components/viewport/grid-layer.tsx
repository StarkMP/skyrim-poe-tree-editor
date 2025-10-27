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

  // Скрываем сетку при сильном отдалении
  if (scale < GRID_MIN_SCALE) return null;

  // Вычисляем opacity в зависимости от масштаба для плавного исчезновения
  const opacity = Math.min(1, (scale - GRID_MIN_SCALE) / (0.5 - GRID_MIN_SCALE));

  return (
    <Shape
      sceneFunc={(context, shape) => {
        // Extract opacity value from GRID_DOT_COLOR and multiply by calculated opacity
        const baseOpacity = 0.2;
        context.fillStyle = `rgba(255, 255, 255, ${baseOpacity * opacity})`;

        // Получаем видимую область в мировых координатах
        const visibleRect = getVisibleRect(stagePos, stageSize, scale);

        // Вычисляем углы видимой области
        const corners = [
          { x: visibleRect.x1, y: visibleRect.y1 }, // top-left
          { x: visibleRect.x2, y: visibleRect.y1 }, // top-right
          { x: visibleRect.x2, y: visibleRect.y2 }, // bottom-right
          { x: visibleRect.x1, y: visibleRect.y2 }, // bottom-left
        ];

        // Подготавливаем тригонометрические функции для поворота
        const rad = (-rotation * Math.PI) / 180; // Обратный поворот
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        // Поворачиваем углы в систему координат сетки (обратный поворот)
        const rotatedCorners = corners.map((corner) => ({
          x: corner.x * cos - corner.y * sin,
          y: corner.x * sin + corner.y * cos,
        }));

        // Находим ограничивающий прямоугольник в системе координат сетки
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

        // Добавляем небольшой запас (padding) для плавности при движении
        const padding = gridSize * 2;
        minX -= padding;
        maxX += padding;
        minY -= padding;
        maxY += padding;

        // Вычисляем диапазон точек сетки в системе координат сетки
        const startX = Math.floor(minX / gridSize) * gridSize;
        const endX = Math.ceil(maxX / gridSize) * gridSize;
        const startY = Math.floor(minY / gridSize) * gridSize;
        const endY = Math.ceil(maxY / gridSize) * gridSize;

        // Подготавливаем тригонометрические функции для прямого поворота
        const forwardRad = (rotation * Math.PI) / 180;
        const forwardCos = Math.cos(forwardRad);
        const forwardSin = Math.sin(forwardRad);

        // Рисуем точки сетки
        for (let x = startX; x <= endX; x += gridSize) {
          for (let y = startY; y <= endY; y += gridSize) {
            // Поворачиваем точку обратно в мировые координаты
            const worldX = x * forwardCos - y * forwardSin;
            const worldY = x * forwardSin + y * forwardCos;

            context.beginPath();
            context.arc(worldX, worldY, 2, 0, Math.PI * 2);
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
