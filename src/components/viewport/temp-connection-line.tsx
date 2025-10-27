import { Line } from 'react-konva';

import { CONNECTION_TEMP_COLOR } from '@/constants';

type TempConnectionLineProps = {
  from: { x: number; y: number };
  to: { x: number; y: number };
  curvature?: number;
};

export const TempConnectionLine = ({ from, to, curvature = 0 }: TempConnectionLineProps) => {
  // Calculate control point for quadratic curve
  const getControlPoint = () => {
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;

    // Perpendicular vector to the line
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy);

    if (length === 0) return { x: midX, y: midY };

    // Perpendicular direction (rotated 90 degrees)
    const perpX = -dy / length;
    const perpY = dx / length;

    // Apply curvature offset
    const controlX = midX + perpX * curvature;
    const controlY = midY + perpY * curvature;

    return { x: controlX, y: controlY };
  };

  const controlPoint = getControlPoint();

  // Generate points for quadratic curve
  const generateCurvePoints = () => {
    const points: number[] = [];
    const segments = 20; // Number of segments for smooth curve

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const t1 = 1 - t;

      // Quadratic Bezier formula: B(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2
      const x = t1 * t1 * from.x + 2 * t1 * t * controlPoint.x + t * t * to.x;
      const y = t1 * t1 * from.y + 2 * t1 * t * controlPoint.y + t * t * to.y;

      points.push(x, y);
    }

    return points;
  };

  const curvePoints = generateCurvePoints();

  return (
    <Line
      points={curvePoints}
      stroke={CONNECTION_TEMP_COLOR}
      strokeWidth={4}
      dash={[10, 5]}
      tension={0}
      listening={false}
    />
  );
};
