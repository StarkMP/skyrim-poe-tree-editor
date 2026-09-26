import type { KonvaEventObject } from 'konva/lib/Node';
import { Group, Image, Rect } from 'react-konva';
import useImage from 'use-image';

import { SELECTION_COLOR, STONE_BORDER_INACTIVE } from '@/constants';
import { useStore } from '@/store';
import { EditorStoneSelection } from '@/types';
import { snapToRotatedGrid } from '@/utils/grid-helpers';

type StoneSelectionElementProps = {
  stone: EditorStoneSelection;
  isSelected: boolean | null;
  onSelect: (e: KonvaEventObject<MouseEvent>) => void;
  onContextMenu: (x: number, y: number) => void;
  onDragStart: () => void;
  onDragMove?: (pos: { x: number; y: number }) => void;
  onDragEnd: (finalPos: { x: number; y: number }) => void;
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
  const [imageElement] = useImage(stone.imageUrl || '', 'anonymous');

  const handleDragMove = (e: KonvaEventObject<DragEvent>) => {
    const currentPos = { x: e.target.x(), y: e.target.y() };

    if (gridSettings.enabled) {
      const snapped = snapToRotatedGrid(
        currentPos.x,
        currentPos.y,
        gridSettings.size,
        gridSettings.rotation
      );
      e.target.position(snapped);
      onDragMove?.(snapped);
    } else {
      onDragMove?.(currentPos);
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

    updateStoneSelection({
      x: finalX,
      y: finalY,
    });
    onDragEnd({ x: finalX, y: finalY });
  };

  const handleContextMenu = (e: KonvaEventObject<PointerEvent>) => {
    e.evt.preventDefault();
    e.cancelBubble = true;
    onContextMenu(e.evt.clientX, e.evt.clientY);
  };

  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    onSelect(e);
  };

  const inactiveBorder = imageElement ? undefined : STONE_BORDER_INACTIVE;
  const activeBorder = SELECTION_COLOR;

  return (
    <Group
      x={stone.x}
      y={stone.y}
      draggable={isSelected === true}
      onDragStart={onDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onContextMenu={handleContextMenu}
      onClick={handleClick}
    >
      <Group
        offsetX={stone.width / 2}
        offsetY={stone.height / 2}
        x={stone.width / 2}
        y={stone.height / 2}
      >
        {/* Border rectangle (always visible) */}
        <Rect
          width={stone.width}
          height={stone.height}
          stroke={isSelected ? activeBorder : inactiveBorder}
          strokeWidth={isSelected ? 4 : 2}
          fill="transparent"
          dash={imageElement ? undefined : [10, 5]}
        />

        {/* Image (if loaded) */}
        {imageElement ? (
          <Image image={imageElement} width={stone.width} height={stone.height} />
        ) : null}
      </Group>
    </Group>
  );
};
