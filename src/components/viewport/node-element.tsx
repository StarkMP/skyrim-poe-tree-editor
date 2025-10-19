import type { KonvaEventObject } from 'konva/lib/Node';
import { useEffect, useState } from 'react';
import { Circle, Group, Image } from 'react-konva';
import useImage from 'use-image';

import { useStore } from '@/store';
import { EditorNode } from '@/types';
import { getNodeRadius, STROKE_WIDTH } from '@/utils/node-helpers';

type NodeElementProps = {
  id: string;
  node: EditorNode;
  isSelected: boolean | null;
  onSelect: () => void;
  onContextMenu: (id: string, x: number, y: number) => void;
  onDragStart: () => void;
  onDragMove: (pos: { x: number; y: number }) => void;
  onDragEnd: () => void;
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
  const radius = getNodeRadius(node.type);
  const [image] = useImage(node.iconUrl || '', 'anonymous');
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);

  // Create circular clipped image
  useEffect(() => {
    if (!image) {
      setImageElement(null);
      return;
    }

    const canvas = document.createElement('canvas');
    const size = radius * 2;
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create circular clip
    ctx.beginPath();
    ctx.arc(radius, radius, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Draw image
    ctx.drawImage(image, 0, 0, size, size);

    // Convert to image element
    const img = new window.Image();
    img.src = canvas.toDataURL();
    img.onload = () => setImageElement(img);
  }, [image, radius]);

  const handleDragMove = (e: KonvaEventObject<DragEvent>) => {
    onDragMove({ x: e.target.x(), y: e.target.y() });
  };

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    updateNode(id, {
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
      {/* Outer circle border */}
      <Circle radius={radius} stroke="#404040" strokeWidth={STROKE_WIDTH} fill="none" />

      {/* Icon image */}
      {imageElement ? (
        <Image
          image={imageElement}
          x={-radius}
          y={-radius}
          width={radius * 2}
          height={radius * 2}
        />
      ) : null}

      {/* Selection highlight */}
      {isSelected ? (
        <Circle
          radius={radius}
          stroke="#FFD700"
          strokeWidth={4}
          fill="transparent"
          listening={false}
        />
      ) : null}
    </Group>
  );
};
