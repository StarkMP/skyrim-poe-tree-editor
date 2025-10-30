import { Shape } from 'react-konva';

import { WEB_COLOR, WEB_LINE_WIDTH } from '@/constants';

type WebLayerProps = {
  enabled: boolean;
  size: number;
  spokes: number;
  rotation: number;
  innerRadius: number;
  concentricCircles: number;
};

export const WebLayer = ({
  enabled,
  size,
  spokes,
  rotation,
  innerRadius,
  concentricCircles,
}: WebLayerProps) => {
  if (!enabled) return null;

  return (
    <Shape
      sceneFunc={(context, shape) => {
        context.strokeStyle = WEB_COLOR;
        context.lineWidth = WEB_LINE_WIDTH;

        const centerX = 0;
        const centerY = 0;

        // Конвертируем rotation в радианы
        const rotationRad = (rotation * Math.PI) / 180;

        // 1. Рисуем внешний круг
        context.beginPath();
        context.arc(centerX, centerY, size, 0, Math.PI * 2);
        context.stroke();

        // 2. Рисуем лучи от центра к внешнему кругу
        for (let i = 0; i < spokes; i++) {
          const angle = ((Math.PI * 2) / spokes) * i + rotationRad;
          const endX = centerX + Math.cos(angle) * size;
          const endY = centerY + Math.sin(angle) * size;

          // Луч от внутреннего круга до внешнего
          const startX = centerX + Math.cos(angle) * innerRadius;
          const startY = centerY + Math.sin(angle) * innerRadius;

          context.beginPath();
          context.moveTo(startX, startY);
          context.lineTo(endX, endY);
          context.stroke();
        }

        // 3. Рисуем концентрические окружности (паутину)
        // Расстояние между внутренним и внешним кругом
        const radiusStep = (size - innerRadius) / (concentricCircles + 1);

        for (let i = 1; i <= concentricCircles; i++) {
          const radius = innerRadius + radiusStep * i;
          context.beginPath();
          context.arc(centerX, centerY, radius, 0, Math.PI * 2);
          context.stroke();
        }

        // 4. Рисуем внутренний круг (пустое пространство)
        if (innerRadius > 0) {
          context.beginPath();
          context.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
          context.stroke();
        }

        // Необходимо для корректной работы Konva
        context.fillStrokeShape(shape);
      }}
      listening={false}
    />
  );
};
