import type { Graphics } from 'pixi.js';

import { CONNECTION_TEMP_COLOR } from '@/constants';

type TempConnectionLineProps = {
  from: { x: number; y: number };
  to: { x: number; y: number };
  curvature?: number;
};

export const TempConnectionLine = ({ from, to, curvature = 0 }: TempConnectionLineProps) => {
  const getControlPoint = () => {
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy);

    if (length === 0) return { x: midX, y: midY };

    const perpX = -dy / length;
    const perpY = dx / length;

    const controlX = midX + perpX * curvature;
    const controlY = midY + perpY * curvature;

    return { x: controlX, y: controlY };
  };

  const controlPoint = getControlPoint();

  const generateCurvePoints = () => {
    const points: number[] = [];
    const segments = 20;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const t1 = 1 - t;

      const x = t1 * t1 * from.x + 2 * t1 * t * controlPoint.x + t * t * to.x;
      const y = t1 * t1 * from.y + 2 * t1 * t * controlPoint.y + t * t * to.y;

      points.push(x, y);
    }

    return points;
  };

  const curvePoints = generateCurvePoints();

  const drawPolyline = (graphics: Graphics, points: number[]) => {
    if (points.length < 2) return;
    graphics.moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 2) {
      graphics.lineTo(points[i], points[i + 1]);
    }
  };

  return (
    <pixiGraphics
      draw={(graphics: Graphics) => {
        graphics.clear();
        graphics.setStrokeStyle({ width: 4, color: CONNECTION_TEMP_COLOR });
        drawPolyline(graphics, curvePoints);
        graphics.stroke();
      }}
      eventMode="none"
    />
  );
};
