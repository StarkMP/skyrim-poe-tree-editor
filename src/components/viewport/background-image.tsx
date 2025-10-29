import type { KonvaEventObject } from 'konva/lib/Node';
import { Group, Image, Rect } from 'react-konva';
import useImage from 'use-image';

import { IMAGE_BORDER_INACTIVE, SELECTION_COLOR } from '@/constants';
import { useStore } from '@/store';
import { EditorImage } from '@/types';
import { snapToRotatedGrid } from '@/utils/grid-helpers';

type BackgroundImageProps = {
  id: string;
  image: EditorImage;
  isSelected: boolean | null;
  onSelect: (e: KonvaEventObject<MouseEvent>) => void;
  onContextMenu: (id: string, x: number, y: number) => void;
  onDragStart: () => void;
  onDragMove?: (pos: { x: number; y: number }) => void;
  onDragEnd: (finalPos: { x: number; y: number }) => void;
};

export const BackgroundImage = ({
  id,
  image,
  isSelected,
  onSelect,
  onContextMenu,
  onDragStart,
  onDragMove,
  onDragEnd,
}: BackgroundImageProps) => {
  const { updateImage, gridSettings } = useStore();
  const [imageElement] = useImage(image.imageUrl || '', 'anonymous');

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

    updateImage(id, {
      x: finalX,
      y: finalY,
    });
    onDragEnd({ x: finalX, y: finalY });
  };

  const handleContextMenu = (e: KonvaEventObject<PointerEvent>) => {
    e.evt.preventDefault();
    e.cancelBubble = true;
    onContextMenu(id, e.evt.clientX, e.evt.clientY);
  };

  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    onSelect(e);
  };

  const opacity = image.opacity ?? 1;
  const rotation = image.rotation ?? 0;

  const inactiveBorder = imageElement ? undefined : IMAGE_BORDER_INACTIVE;
  const activeBorder = SELECTION_COLOR;

  return (
    <Group
      x={image.x}
      y={image.y}
      draggable={isSelected === true}
      onDragStart={onDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onContextMenu={handleContextMenu}
      onClick={handleClick}
    >
      <Group
        offsetX={image.width / 2}
        offsetY={image.height / 2}
        x={image.width / 2}
        y={image.height / 2}
        rotation={rotation}
      >
        {/* Border rectangle (always visible) */}
        <Rect
          width={image.width}
          height={image.height}
          stroke={isSelected ? activeBorder : inactiveBorder}
          strokeWidth={isSelected ? 4 : 2}
          fill="transparent"
          dash={imageElement ? undefined : [10, 5]}
          opacity={opacity}
        />

        {/* Image (if loaded) */}
        {imageElement ? (
          <Image image={imageElement} width={image.width} height={image.height} opacity={opacity} />
        ) : null}
      </Group>
    </Group>
  );
};
