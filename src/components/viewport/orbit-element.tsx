import type { KonvaEventObject } from 'konva/lib/Node';
import { Circle, Group, Line } from 'react-konva';

import {
  ORBIT_CENTER_FILL,
  ORBIT_CENTER_STROKE,
  ORBIT_CIRCLE_COLOR,
  ORBIT_LINE_COLOR,
  ORBIT_POINT_FILL,
  ORBIT_POINT_STROKE,
  SELECTION_COLOR,
} from '@/constants';
import { useStore } from '@/store';
import { PositionOrbit } from '@/types';
import { snapToRotatedGrid } from '@/utils/grid-helpers';
import { getOrbitPoints } from '@/utils/orbit-helpers';

type OrbitElementProps = {
  id: string;
  orbit: PositionOrbit;
  isSelected: boolean | null;
  onSelect: () => void;
  onContextMenu: (id: string, x: number, y: number) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
};

export const OrbitElement = ({
  id,
  orbit,
  isSelected,
  onSelect,
  onContextMenu,
  onDragStart,
  onDragEnd,
}: OrbitElementProps) => {
  const updateOrbit = useStore((state) => state.updateOrbit);
  const gridSettings = useStore((state) => state.gridSettings);

  const points = getOrbitPoints(orbit);
  const centerPoint = points[0];
  const orbitPoints = points.slice(1);

  const handleDragMove = (e: KonvaEventObject<DragEvent>) => {
    if (gridSettings.enabled) {
      const snapped = snapToRotatedGrid(
        e.target.x(),
        e.target.y(),
        gridSettings.size,
        gridSettings.rotation
      );
      e.target.position(snapped);
    }
  };

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    let finalX: number;
    let finalY: number;

    if (gridSettings.enabled) {
      const snapped = snapToRotatedGrid(
        e.target.x(),
        e.target.y(),
        gridSettings.size,
        gridSettings.rotation
      );
      finalX = snapped.x;
      finalY = snapped.y;
    } else {
      finalX = e.target.x();
      finalY = e.target.y();
    }

    updateOrbit(id, {
      x: finalX,
      y: finalY,
    });
    onDragEnd();
  };

  const handleContextMenu = (e: KonvaEventObject<PointerEvent>) => {
    e.evt.preventDefault();
    e.cancelBubble = true;
    onContextMenu(id, e.evt.clientX, e.evt.clientY);
  };

  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    onSelect();
  };

  return (
    <Group
      x={orbit.x}
      y={orbit.y}
      draggable={isSelected === true}
      onDragStart={onDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onContextMenu={handleContextMenu}
      onClick={handleClick}
    >
      {/* Орбита (круг) */}
      <Circle
        radius={orbit.radius}
        stroke={isSelected ? SELECTION_COLOR : ORBIT_CIRCLE_COLOR}
        strokeWidth={isSelected ? 2 : 1}
        listening={false}
      />

      {/* Центральная точка снаппинга */}
      <Circle
        x={0}
        y={0}
        radius={10}
        fill={isSelected ? SELECTION_COLOR : ORBIT_CENTER_FILL}
        stroke={isSelected ? SELECTION_COLOR : ORBIT_CENTER_STROKE}
        strokeWidth={2}
      />

      {/* Точки снаппинга на орбите */}
      {orbitPoints.map((point, index) => (
        <Circle
          key={index}
          x={point.x - orbit.x}
          y={point.y - orbit.y}
          radius={4}
          fill={isSelected ? SELECTION_COLOR : ORBIT_POINT_FILL}
          stroke={isSelected ? SELECTION_COLOR : ORBIT_POINT_STROKE}
          strokeWidth={1}
          listening={false}
        />
      ))}

      {/* Линии от центра к точкам (опционально, для наглядности) */}
      {isSelected
        ? orbitPoints.map((point, index) => (
            <Line
              key={`line-${index}`}
              points={[0, 0, point.x - orbit.x, point.y - orbit.y]}
              stroke={ORBIT_LINE_COLOR}
              strokeWidth={1}
              listening={false}
            />
          ))
        : null}
    </Group>
  );
};
