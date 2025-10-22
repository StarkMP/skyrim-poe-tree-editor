import { useState } from 'react';
import { Group, Line } from 'react-konva';

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

  // Determine line color based on state
  const getLineColor = () => {
    if (isSelected === true) return '#60a5fa'; // Blue when selected
    if (isHovered) return '#525252'; // Lighter gray when hovered
    return '#404040'; // Default gray
  };

  const getBorderColor = () => {
    if (isSelected === true) return '#1e40af'; // Darker blue border when selected
    return '#292929'; // Default dark border
  };

  return (
    <Group opacity={opacity}>
      {/* Invisible wider line for easier hover and click */}
      <Line
        points={curvePoints}
        stroke="transparent"
        strokeWidth={20}
        tension={0}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onSelect}
      />

      {/* Visible connection line border */}
      <Line
        points={curvePoints}
        stroke={getBorderColor()}
        strokeWidth={isSelected === true ? 10 : 8}
        tension={0}
        listening={false}
      />

      {/* Visible connection line */}
      <Line
        points={curvePoints}
        stroke={getLineColor()}
        strokeWidth={isSelected === true ? 6 : 4}
        tension={0}
        listening={false}
      />
    </Group>
  );
};
