import type { Graphics } from 'pixi.js';

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
    <pixiGraphics
      draw={(graphics: Graphics) => {
        graphics.clear();
        graphics.lineStyle(WEB_LINE_WIDTH, WEB_COLOR, 1);

        const centerX = 0;
        const centerY = 0;

        const rotationRad = (rotation * Math.PI) / 180;

        graphics.beginPath();
        graphics.arc(centerX, centerY, size, 0, Math.PI * 2);
        graphics.stroke();

        for (let i = 0; i < spokes; i++) {
          const angle = ((Math.PI * 2) / spokes) * i + rotationRad;
          const endX = centerX + Math.cos(angle) * size;
          const endY = centerY + Math.sin(angle) * size;

          const startX = centerX + Math.cos(angle) * innerRadius;
          const startY = centerY + Math.sin(angle) * innerRadius;

          graphics.beginPath();
          graphics.moveTo(startX, startY);
          graphics.lineTo(endX, endY);
          graphics.stroke();
        }

        const radiusStep = (size - innerRadius) / (concentricCircles + 1);

        for (let i = 1; i <= concentricCircles; i++) {
          const radius = innerRadius + radiusStep * i;
          graphics.beginPath();
          graphics.arc(centerX, centerY, radius, 0, Math.PI * 2);
          graphics.stroke();
        }

        if (innerRadius > 0) {
          graphics.beginPath();
          graphics.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
          graphics.stroke();
        }
      }}
      eventMode="none"
    />
  );
};
