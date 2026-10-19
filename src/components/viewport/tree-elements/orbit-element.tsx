import { type FederatedMouseEvent, type Graphics } from 'pixi.js';

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

import { type Position, useElementDrag } from '../use-element-drag';

type OrbitElementProps = {
  id: string;
  orbit: PositionOrbit;
  isSelected: boolean | null;
  onSelect: (e: FederatedMouseEvent) => void;
  onContextMenu: (id: string, x: number, y: number) => void;
  onDragStart: () => void;
  onDragMove?: (pos: Position) => void;
  onDragEnd: (finalPos: Position) => void;
};

export const OrbitElement = ({
  id,
  orbit,
  isSelected,
  onSelect,
  onContextMenu,
  onDragStart,
  onDragMove,
  onDragEnd,
}: OrbitElementProps) => {
  const updateOrbit = useStore((state) => state.updateOrbit);
  const gridSettings = useStore((state) => state.gridSettings);

  const points = getOrbitPoints(orbit);
  const orbitPoints = points.slice(1);

  const snap = (pos: Position): Position => {
    if (gridSettings.enabled) {
      return snapToRotatedGrid(pos.x, pos.y, gridSettings.size, gridSettings.rotation);
    }
    return pos;
  };

  const finalize = (finalPos: Position) => {
    updateOrbit(id, {
      x: finalPos.x,
      y: finalPos.y,
    });
  };

  const {
    onPointerDown,
    onGlobalPointerMove,
    onPointerUp,
    onPointerUpOutside,
    onPointerCancel,
    wasDragged,
  } = useElementDrag({
    isDraggable: isSelected === true,
    snap,
    finalize,
    onDragStart,
    onDragMove,
    onDragEnd,
  });

  const handleContextMenu = (e: FederatedMouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(id, e.client.x, e.client.y);
  };

  const handleClick = (e: FederatedMouseEvent) => {
    e.stopPropagation();
    if (wasDragged()) return;
    onSelect(e);
  };

  const circleStroke = isSelected ? SELECTION_COLOR : ORBIT_CIRCLE_COLOR;
  const circleWidth = isSelected ? 2 : 1;
  const centerFill = isSelected ? SELECTION_COLOR : ORBIT_CENTER_FILL;
  const centerStroke = isSelected ? SELECTION_COLOR : ORBIT_CENTER_STROKE;
  const pointFill = isSelected ? SELECTION_COLOR : ORBIT_POINT_FILL;
  const pointStroke = isSelected ? SELECTION_COLOR : ORBIT_POINT_STROKE;

  return (
    <pixiContainer
      x={orbit.x}
      y={orbit.y}
      eventMode="static"
      onPointerDown={onPointerDown}
      onGlobalPointerMove={onGlobalPointerMove}
      onPointerUp={onPointerUp}
      onPointerUpOutside={onPointerUpOutside}
      onPointerCancel={onPointerCancel}
      onRightClick={handleContextMenu}
      onClick={handleClick}
    >
      <pixiGraphics
        draw={(graphics: Graphics) => {
          graphics.clear();
          graphics.lineStyle(circleWidth, circleStroke, 1);
          graphics.circle(0, 0, orbit.radius);
          graphics.stroke();
        }}
      />

      <pixiGraphics
        draw={(graphics: Graphics) => {
          graphics.clear();
          graphics.fillStyle = centerFill;
          graphics.circle(0, 0, 10);
          graphics.fill();
          graphics.lineStyle(2, centerStroke, 1);
          graphics.circle(0, 0, 10);
          graphics.stroke();
        }}
      />

      {orbitPoints.length > 0 ? (
        <pixiGraphics
          draw={(graphics: Graphics) => {
            graphics.clear();
            graphics.fillStyle = pointFill;
            graphics.lineStyle(1, pointStroke, 1);
            for (const point of orbitPoints) {
              const px = point.x - orbit.x;
              const py = point.y - orbit.y;
              graphics.circle(px, py, 4);
              graphics.fill();
              graphics.circle(px, py, 4);
              graphics.stroke();
            }
          }}
        />
      ) : null}

      {isSelected ? (
        <pixiGraphics
          draw={(graphics: Graphics) => {
            graphics.clear();
            graphics.lineStyle(1, ORBIT_LINE_COLOR, 1);
            for (const point of orbitPoints) {
              graphics.moveTo(0, 0);
              graphics.lineTo(point.x - orbit.x, point.y - orbit.y);
              graphics.stroke();
            }
          }}
        />
      ) : null}
    </pixiContainer>
  );
};
