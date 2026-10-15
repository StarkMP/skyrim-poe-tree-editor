import type { Graphics } from 'pixi.js';
import { useState } from 'react';

import {
  CONNECTION_BORDER_DEFAULT,
  CONNECTION_BORDER_SELECTED,
  CONNECTION_COLOR_DEFAULT,
  CONNECTION_COLOR_HOVER,
  CONNECTION_COLOR_SELECTED,
} from '@/constants';
import { EditorNode } from '@/types';

type ConnectionLineProps = {
  from: EditorNode;
  to: EditorNode;
  curvature: number;
  isSelected: boolean | null;
  onSelect: () => void;
  opacity?: number;
};

export const ConnectionLine = ({
  from,
  to,
  curvature,
  isSelected,
  onSelect,
  opacity = 1,
}: ConnectionLineProps) => {
  const [isHovered, setIsHovered] = useState(false);

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

  const getLineColor = () => {
    if (isSelected === true) return CONNECTION_COLOR_SELECTED;
    if (isHovered) return CONNECTION_COLOR_HOVER;
    return CONNECTION_COLOR_DEFAULT;
  };

  const getBorderColor = () => {
    if (isSelected === true) return CONNECTION_BORDER_SELECTED;
    return CONNECTION_BORDER_DEFAULT;
  };

  const drawPolyline = (graphics: Graphics, points: number[]) => {
    if (points.length < 2) return;
    graphics.moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 2) {
      graphics.lineTo(points[i], points[i + 1]);
    }
  };

  const lineColor = getLineColor();
  const borderColor = getBorderColor();
  const borderWidth = isSelected === true ? 7 : 5;
  const lineWidth = isSelected === true ? 5 : 3;

  return (
    <pixiGraphics
      draw={(graphics: Graphics) => {
        graphics.clear();

        // Invisible wider line for easier hover and click
        graphics.lineStyle(20, 'transparent', 1);
        drawPolyline(graphics, curvePoints);
        graphics.stroke();

        // Visible connection line border
        graphics.lineStyle(borderWidth, borderColor, 1);
        drawPolyline(graphics, curvePoints);
        graphics.stroke();

        // Visible connection line
        graphics.lineStyle(lineWidth, lineColor, 1);
        drawPolyline(graphics, curvePoints);
        graphics.stroke();
      }}
      alpha={opacity}
      eventMode="static"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
    />
  );
};
