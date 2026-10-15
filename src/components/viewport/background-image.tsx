import { type FederatedMouseEvent, type Graphics, Texture } from 'pixi.js';
import { useMemo } from 'react';
import useImage from 'use-image';

import { IMAGE_BORDER_INACTIVE, SELECTION_COLOR } from '@/constants';
import { useStore } from '@/store';
import { EditorImage } from '@/types';
import { snapToRotatedGrid } from '@/utils/grid-helpers';

import { type Position, useElementDrag } from './use-element-drag';

type BackgroundImageProps = {
  id: string;
  image: EditorImage;
  isSelected: boolean | null;
  onSelect: (e: FederatedMouseEvent) => void;
  onContextMenu: (id: string, x: number, y: number) => void;
  onDragStart: () => void;
  onDragMove?: (pos: Position) => void;
  onDragEnd: (finalPos: Position) => void;
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
  const texture = useMemo(() => (imageElement ? Texture.from(imageElement) : null), [imageElement]);

  const snap = (pos: Position): Position => {
    if (gridSettings.enabled) {
      return snapToRotatedGrid(pos.x, pos.y, gridSettings.size, gridSettings.rotation);
    }
    return pos;
  };

  const finalize = (finalPos: Position) => {
    updateImage(id, {
      x: finalPos.x,
      y: finalPos.y,
    });
  };

  const { onPointerDown, onGlobalPointerMove, onPointerUp, onPointerUpOutside } = useElementDrag({
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
    onContextMenu(id, e.global.x, e.global.y);
  };

  const handleClick = (e: FederatedMouseEvent) => {
    e.stopPropagation();
    onSelect(e);
  };

  const opacity = image.opacity ?? 1;
  const rotation = image.rotation ?? 0;
  const rotationRad = (rotation * Math.PI) / 180;

  const shouldDrawBorder = isSelected || !imageElement;
  const stroke = isSelected ? SELECTION_COLOR : IMAGE_BORDER_INACTIVE;
  const strokeWidth = isSelected ? 4 : 2;

  return (
    <pixiContainer
      x={image.x}
      y={image.y}
      eventMode="static"
      onPointerDown={onPointerDown}
      onGlobalPointerMove={onGlobalPointerMove}
      onPointerUp={onPointerUp}
      onPointerUpOutside={onPointerUpOutside}
      onRightClick={handleContextMenu}
      onClick={handleClick}
    >
      <pixiContainer rotation={rotationRad}>
        {shouldDrawBorder ? (
          <pixiGraphics
            draw={(graphics: Graphics) => {
              graphics.clear();
              graphics.lineStyle(strokeWidth, stroke, 1);
              graphics.rect(0, 0, image.width, image.height);
              graphics.stroke();
            }}
            alpha={opacity}
            eventMode="none"
          />
        ) : null}

        {texture ? (
          <pixiSprite
            texture={texture}
            width={image.width}
            height={image.height}
            x={0}
            y={0}
            alpha={opacity}
            eventMode="none"
          />
        ) : null}
      </pixiContainer>
    </pixiContainer>
  );
};
