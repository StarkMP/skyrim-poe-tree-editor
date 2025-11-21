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

        const rotationRad = (rotation * Math.PI) / 180;

        context.beginPath();
        context.arc(centerX, centerY, size, 0, Math.PI * 2);
        context.stroke();

        for (let i = 0; i < spokes; i++) {
          const angle = ((Math.PI * 2) / spokes) * i + rotationRad;
          const endX = centerX + Math.cos(angle) * size;
          const endY = centerY + Math.sin(angle) * size;

          const startX = centerX + Math.cos(angle) * innerRadius;
          const startY = centerY + Math.sin(angle) * innerRadius;

          context.beginPath();
          context.moveTo(startX, startY);
          context.lineTo(endX, endY);
          context.stroke();
        }

        const radiusStep = (size - innerRadius) / (concentricCircles + 1);

        for (let i = 1; i <= concentricCircles; i++) {
          const radius = innerRadius + radiusStep * i;
          context.beginPath();
          context.arc(centerX, centerY, radius, 0, Math.PI * 2);
          context.stroke();
        }

        if (innerRadius > 0) {
          context.beginPath();
          context.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
          context.stroke();
        }

        context.fillStrokeShape(shape);
      }}
      listening={false}
    />
  );
};
