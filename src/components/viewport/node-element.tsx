import { type FederatedMouseEvent, type Graphics, Texture } from 'pixi.js';
import { useEffect, useMemo, useState } from 'react';
import useImage from 'use-image';

import extraLargeNodeBorder from '@/assets/extralarge-node-border.png';
import extraSmallNodeBorder from '@/assets/extrasmall-node-border.png';
import largeNodeBorder from '@/assets/large-node-border.png';
import mediumNodeBorder from '@/assets/medium-node-border.png';
import smallNodeBorder from '@/assets/small-node-border.png';
import superLargeNodeBorder from '@/assets/superlarge-node-border.png';
import { NODE_ICON_SIZE_PERCENT, SELECTION_COLOR, VIEWPORT_BACKGROUND_COLOR } from '@/constants';
import { useStore } from '@/store';
import { EditorNode, NodeType } from '@/types';
import { snapToRotatedGrid } from '@/utils/grid-helpers';
import { getNodeRadius } from '@/utils/node-helpers';
import { findClosestOrbitSnapPoint } from '@/utils/orbit-helpers';

import { type Position, useElementDrag } from './use-element-drag';

const nodeBorderImages: Record<NodeType, string> = {
  [NodeType.ExtraSmallNode]: extraSmallNodeBorder,
  [NodeType.SmallNode]: smallNodeBorder,
  [NodeType.MediumNode]: mediumNodeBorder,
  [NodeType.LargeNode]: largeNodeBorder,
  [NodeType.ExtraLargeNode]: extraLargeNodeBorder,
  [NodeType.SuperLargeNode]: superLargeNodeBorder,
};

type NodeElementProps = {
  id: string;
  node: EditorNode;
  isSelected: boolean | null;
  onSelect: (e: FederatedMouseEvent) => void;
  onContextMenu: (id: string, x: number, y: number) => void;
  onDragStart: () => void;
  onDragMove: (pos: Position) => void;
  onDragEnd: (finalPos: Position) => void;
};

export const NodeElement = ({
  id,
  node,
  isSelected,
  onSelect,
  onContextMenu,
  onDragStart,
  onDragMove,
  onDragEnd,
}: NodeElementProps) => {
  const updateNode = useStore((state) => state.updateNode);
  const gridSettings = useStore((state) => state.gridSettings);
  const orbits = useStore((state) => state.orbits);
  const radius = getNodeRadius(node.type);
  const [iconImage] = useImage(node.iconUrl || '', 'anonymous');
  const [iconTexture, setIconTexture] = useState<Texture | null>(null);
  const [borderImage] = useImage(nodeBorderImages[node.type] || '', 'anonymous');

  const borderTexture = useMemo(
    () => (borderImage ? Texture.from(borderImage) : null),
    [borderImage]
  );

  const borderScale = 1.15;
  const borderSize = radius * 2 * borderScale;
  const outlineRadius = radius * borderScale;
  const iconSize = radius * 2 * NODE_ICON_SIZE_PERCENT;

  useEffect(() => {
    if (!iconImage) {
      setIconTexture(null);
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = iconSize;
    canvas.height = iconSize;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageRadius = iconSize / 2;
    ctx.beginPath();
    ctx.arc(imageRadius, imageRadius, imageRadius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(iconImage, 0, 0, iconSize, iconSize);

    setIconTexture(Texture.from(canvas));
  }, [iconImage, radius]);

  const snap = (pos: Position): Position => {
    const orbitSnapPoint = findClosestOrbitSnapPoint(pos, orbits);
    if (orbitSnapPoint) {
      return orbitSnapPoint;
    }
    if (gridSettings.enabled) {
      return snapToRotatedGrid(pos.x, pos.y, gridSettings.size, gridSettings.rotation);
    }
    return pos;
  };

  const finalize = (finalPos: Position) => {
    updateNode(id, {
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
    onContextMenu(id, e.client.x, e.client.y);
  };

  const handleClick = (e: FederatedMouseEvent) => {
    e.stopPropagation();
    onSelect(e);
  };

  return (
    <pixiContainer
      x={node.x}
      y={node.y}
      eventMode="static"
      onPointerDown={onPointerDown}
      onGlobalPointerMove={onGlobalPointerMove}
      onPointerUp={onPointerUp}
      onPointerUpOutside={onPointerUpOutside}
      onRightClick={handleContextMenu}
      onClick={handleClick}
    >
      {iconTexture ? (
        <pixiSprite
          texture={iconTexture}
          anchor={0.5}
          x={0}
          y={0}
          width={iconSize}
          height={iconSize}
        />
      ) : null}

      {borderTexture ? (
        <pixiSprite
          texture={borderTexture}
          anchor={0.5}
          x={0}
          y={0}
          width={borderSize}
          height={borderSize}
        />
      ) : null}

      <pixiGraphics
        draw={(graphics: Graphics) => {
          graphics.clear();
          graphics.lineStyle(2, VIEWPORT_BACKGROUND_COLOR, 1);
          graphics.circle(0, 0, outlineRadius);
          graphics.stroke();
        }}
      />

      {isSelected ? (
        <pixiGraphics
          draw={(graphics: Graphics) => {
            graphics.clear();
            graphics.lineStyle(6, SELECTION_COLOR, 1);
            graphics.circle(0, 0, radius);
            graphics.stroke();
          }}
        />
      ) : null}
    </pixiContainer>
  );
};
