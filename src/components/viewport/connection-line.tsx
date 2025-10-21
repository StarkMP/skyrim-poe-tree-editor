import { useState } from 'react';
import { Circle, Group, Line } from 'react-konva';

import { EditorNode } from '@/types';

type ConnectionLineProps = {
  from: EditorNode;
  to: EditorNode;
  onDelete: () => void;
  opacity?: number;
};

export const ConnectionLine = ({ from, to, onDelete, opacity = 1 }: ConnectionLineProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const midPoint = {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2,
  };

  return (
    <Group opacity={opacity}>
      {/* Invisible wider line for easier hover */}
      <Line
        points={[from.x, from.y, to.x, to.y]}
        stroke="transparent"
        strokeWidth={20}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />

      {/* Visible connection line border */}
      <Line
        points={[from.x, from.y, to.x, to.y]}
        stroke="#292929"
        strokeWidth={10}
        listening={false}
      />

      {/* Visible connection line */}
      <Line
        points={[from.x, from.y, to.x, to.y]}
        stroke="#404040"
        strokeWidth={6}
        listening={false}
      />

      {/* Delete button (visible on hover) */}
      {isHovered ? (
        <Group x={midPoint.x} y={midPoint.y}>
          {/* Background circle */}
          <Circle radius={12} fill="white" stroke="red" strokeWidth={2} onClick={onDelete} />

          {/* X icon */}
          <Line points={[-6, -6, 6, 6]} stroke="red" strokeWidth={2} listening={false} />
          <Line points={[-6, 6, 6, -6]} stroke="red" strokeWidth={2} listening={false} />
        </Group>
      ) : null}
    </Group>
  );
};
