import type { KonvaEventObject } from 'konva/lib/Node';
import { Circle, Group, Line } from 'react-konva';

import { useStore } from '@/store';
import { PositionOrbit } from '@/types';
import { snapToGrid } from '@/utils/grid-helpers';
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
      const snappedX = snapToGrid(e.target.x(), gridSettings.size);
      const snappedY = snapToGrid(e.target.y(), gridSettings.size);
      e.target.position({ x: snappedX, y: snappedY });
    }
  };

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    const finalX = gridSettings.enabled
      ? snapToGrid(e.target.x(), gridSettings.size)
      : e.target.x();
    const finalY = gridSettings.enabled
      ? snapToGrid(e.target.y(), gridSettings.size)
      : e.target.y();

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
        stroke={isSelected ? '#FFD700' : 'rgba(255, 255, 255, 0.3)'}
        strokeWidth={isSelected ? 2 : 1}
        listening={false}
      />

      {/* Центральная точка снаппинга */}
      <Circle
        x={0}
        y={0}
        radius={10}
        fill={isSelected ? '#FFD700' : 'rgba(255, 255, 255, 0.5)'}
        stroke={isSelected ? '#FFD700' : 'rgba(255, 255, 255, 0.8)'}
        strokeWidth={2}
      />

      {/* Точки снаппинга на орбите */}
      {orbitPoints.map((point, index) => (
        <Circle
          key={index}
          x={point.x - orbit.x}
          y={point.y - orbit.y}
          radius={4}
          fill={isSelected ? '#FFD700' : 'rgba(255, 255, 255, 0.4)'}
          stroke={isSelected ? '#FFD700' : 'rgba(255, 255, 255, 0.6)'}
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
              stroke="rgba(255, 215, 0, 0.2)"
              strokeWidth={1}
              listening={false}
            />
          ))
        : null}
    </Group>
  );
};
