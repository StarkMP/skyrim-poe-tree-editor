import type { KonvaEventObject } from 'konva/lib/Node';
import { Group, Image, Rect } from 'react-konva';
import useImage from 'use-image';

import { useStore } from '@/store';
import { EditorImage } from '@/types';

type BackgroundImageProps = {
  id: string;
  image: EditorImage;
  isSelected: boolean | null;
  onSelect: () => void;
  onContextMenu: (id: string, x: number, y: number) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
};

export const BackgroundImage = ({
  id,
  image,
  isSelected,
  onSelect,
  onContextMenu,
  onDragStart,
  onDragEnd,
}: BackgroundImageProps) => {
  const { updateImage } = useStore();
  const [imageElement] = useImage(image.imageUrl || '', 'anonymous');

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    updateImage(id, {
      x: e.target.x(),
      y: e.target.y(),
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

  const opacity = image.opacity ?? 1;
  const rotation = image.rotation ?? 0;

  const inactiveBorder = imageElement ? undefined : '#404040';
  const activeBorder = '#FFD700';

  return (
    <Group
      x={image.x}
      y={image.y}
      draggable={isSelected === true}
      onDragStart={onDragStart}
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
