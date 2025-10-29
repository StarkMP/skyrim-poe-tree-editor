import type { KonvaEventObject } from 'konva/lib/Node';
import { useEffect, useState } from 'react';
import { Circle, Group, Image } from 'react-konva';
import useImage from 'use-image';

import largeNodeBorder from '@/assets/large-node-border.png';
import masterNodeBorder from '@/assets/master-node-border.png';
import smallNodeBorder from '@/assets/small-node-border.png';
import { NODE_ICON_SIZE_PERCENT, SELECTION_COLOR } from '@/constants';
import { useStore } from '@/store';
import { EditorNode, NodeType } from '@/types';
import { snapToRotatedGrid } from '@/utils/grid-helpers';
import { getNodeRadius } from '@/utils/node-helpers';
import { findClosestOrbitSnapPoint } from '@/utils/orbit-helpers';

// Border images for each node type
const nodeBorderImages: Record<NodeType, string> = {
  [NodeType.SmallNode]: smallNodeBorder,
  [NodeType.LargeNode]: largeNodeBorder,
  [NodeType.MasterNode]: masterNodeBorder,
};

type NodeElementProps = {
  id: string;
  node: EditorNode;
  isSelected: boolean | null;
  onSelect: (e: KonvaEventObject<MouseEvent>) => void;
  onContextMenu: (id: string, x: number, y: number) => void;
  onDragStart: () => void;
  onDragMove: (pos: { x: number; y: number }) => void;
  onDragEnd: (finalPos: { x: number; y: number }) => void;
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
  const [image] = useImage(node.iconUrl || '', 'anonymous');
  const [borderImage] = useImage(nodeBorderImages[node.type], 'anonymous');
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);

  // Border size slightly larger than node
  const borderScale = 1.15;
  const borderSize = radius * 2 * borderScale;

  // Create circular clipped image
  useEffect(() => {
    if (!image) {
      setImageElement(null);
      return;
    }

    const canvas = document.createElement('canvas');
    const size = radius * 2 * NODE_ICON_SIZE_PERCENT;
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create circular clip
    const imageRadius = size / 2;
    ctx.beginPath();
    ctx.arc(imageRadius, imageRadius, imageRadius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Draw image
    ctx.drawImage(image, 0, 0, size, size);

    // Convert to image element using toBlob (more efficient)
    canvas.toBlob((blob) => {
      if (!blob) return;

      const img = new window.Image();
      const url = URL.createObjectURL(blob);
      img.src = url;
      img.onload = () => {
        setImageElement(img);
        // Clean up the object URL after image is loaded
        URL.revokeObjectURL(url);
      };
    });
  }, [image, radius]);

  const handleDragMove = (e: KonvaEventObject<DragEvent>) => {
    const currentPos = { x: e.target.x(), y: e.target.y() };

    // Приоритет 1: Проверяем снаппинг к орбитам
    const orbitSnapPoint = findClosestOrbitSnapPoint(currentPos, orbits);

    if (orbitSnapPoint) {
      // Снаппинг к орбите
      e.target.position(orbitSnapPoint);
      onDragMove(orbitSnapPoint);
    } else if (gridSettings.enabled) {
      // Приоритет 2: Снаппинг к сетке (если орбиты не найдены)
      const snapped = snapToRotatedGrid(
        currentPos.x,
        currentPos.y,
        gridSettings.size,
        gridSettings.rotation
      );
      e.target.position(snapped);
      onDragMove(snapped);
    } else {
      // Без снаппинга
      onDragMove(currentPos);
    }
  };

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    const currentPos = { x: e.target.x(), y: e.target.y() };

    // Приоритет 1: Проверяем снаппинг к орбитам
    const orbitSnapPoint = findClosestOrbitSnapPoint(currentPos, orbits);

    let finalX: number;
    let finalY: number;

    if (orbitSnapPoint) {
      // Снаппинг к орбите
      finalX = orbitSnapPoint.x;
      finalY = orbitSnapPoint.y;
    } else if (gridSettings.enabled) {
      // Приоритет 2: Снаппинг к сетке
      const snapped = snapToRotatedGrid(
        currentPos.x,
        currentPos.y,
        gridSettings.size,
        gridSettings.rotation
      );
      finalX = snapped.x;
      finalY = snapped.y;
    } else {
      // Без снаппинга
      finalX = currentPos.x;
      finalY = currentPos.y;
    }

    updateNode(id, {
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

  return (
    <Group
      x={node.x}
      y={node.y}
      draggable={isSelected === true}
      onDragStart={onDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onContextMenu={handleContextMenu}
      onClick={handleClick}
    >
      {/* Icon image */}
      {imageElement ? (
        <Image
          image={imageElement}
          x={-(radius * 2 * NODE_ICON_SIZE_PERCENT) / 2}
          y={-(radius * 2 * NODE_ICON_SIZE_PERCENT) / 2}
          width={radius * 2 * NODE_ICON_SIZE_PERCENT}
          height={radius * 2 * NODE_ICON_SIZE_PERCENT}
        />
      ) : null}

      {/* Border image (above the node icon) */}
      {borderImage ? (
        <Image
          image={borderImage}
          x={-borderSize / 2}
          y={-borderSize / 2}
          width={borderSize}
          height={borderSize}
        />
      ) : null}

      {/* Selection highlight */}
      {isSelected ? (
        <Circle
          radius={radius}
          stroke={SELECTION_COLOR}
          strokeWidth={6}
          fill="transparent"
          listening={false}
        />
      ) : null}
    </Group>
  );
};
