import { type FederatedMouseEvent, type Graphics, Rectangle } from 'pixi.js';
import { useMemo } from 'react';

import { SELECTION_COLOR, STONE_BORDER_INACTIVE } from '@/constants';
import { useAssets } from '@/lib/pixi';
import { useStore } from '@/store';
import { EditorStoneSelection } from '@/types';
import { snapToRotatedGrid } from '@/utils/grid-helpers';

import { type Position, useElementDrag } from '../use-element-drag';

type StoneSelectionElementProps = {
  stone: EditorStoneSelection;
  isSelected: boolean | null;
  onSelect: (e: FederatedMouseEvent) => void;
  onContextMenu: (x: number, y: number) => void;
  onDragStart: () => void;
  onDragMove?: (pos: Position) => void;
  onDragEnd: (finalPos: Position) => void;
};

export const StoneSelectionElement = ({
  stone,
  isSelected,
  onSelect,
  onContextMenu,
  onDragStart,
  onDragMove,
  onDragEnd,
}: StoneSelectionElementProps) => {
  const updateStoneSelection = useStore((state) => state.updateStoneSelection);
  const gridSettings = useStore((state) => state.gridSettings);
  const texture = useAssets(stone.imageUrl);
  const hitArea = useMemo(() => new Rectangle(0, 0, stone.width, stone.height), [stone]);

  const snap = (pos: Position): Position => {
    if (gridSettings.enabled) {
      return snapToRotatedGrid(pos.x, pos.y, gridSettings.size, gridSettings.rotation);
    }
    return pos;
  };

  const finalize = (finalPos: Position) => {
    updateStoneSelection({
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
    onContextMenu(e.client.x, e.client.y);
  };

  const handleClick = (e: FederatedMouseEvent) => {
    e.stopPropagation();
    if (wasDragged()) return;
    onSelect(e);
  };

  const shouldDrawBorder = isSelected || !texture;
  const stroke = isSelected ? SELECTION_COLOR : STONE_BORDER_INACTIVE;
  const strokeWidth = isSelected ? 4 : 2;

  return (
    <pixiContainer
      x={stone.x}
      y={stone.y}
      eventMode="static"
      hitArea={hitArea}
      onPointerDown={onPointerDown}
      onGlobalPointerMove={onGlobalPointerMove}
      onPointerUp={onPointerUp}
      onPointerUpOutside={onPointerUpOutside}
      onPointerCancel={onPointerCancel}
      onRightClick={handleContextMenu}
      onClick={handleClick}
    >
      {shouldDrawBorder ? (
        <pixiGraphics
          draw={(graphics: Graphics) => {
            graphics.clear();
            graphics.setStrokeStyle({ width: strokeWidth, color: stroke });
            graphics.rect(0, 0, stone.width, stone.height);
            graphics.stroke();
          }}
        />
      ) : null}

      {texture ? (
        <pixiSprite texture={texture} width={stone.width} height={stone.height} x={0} y={0} />
      ) : null}
    </pixiContainer>
  );
};
