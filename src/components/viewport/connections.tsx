import { useMemo } from 'react';

import { useStore } from '@/store';

import { useDraggingNodesStore } from './dragging-nodes';
import { ConnectionLine } from './tree-elements/connection-line';

export const Connections = () => {
  const connections = useStore((state) => state.connections);
  const nodes = useStore((state) => state.nodes);
  const isElementSelected = useStore((state) => state.isElementSelected);
  const selectElement = useStore((state) => state.selectElement);

  const draggingNodeId = useDraggingNodesStore((state) => state.draggingNodeId);
  const multiDraggingNodeIds = useDraggingNodesStore((state) => state.multiDraggingNodeIds);

  const connectionsArray = useMemo(() => Object.entries(connections), [connections]);

  return (
    <pixiContainer>
      {connectionsArray.map(([connectionId, connection]) => {
        const fromNode = nodes[connection.fromId];
        const toNode = nodes[connection.toId];
        if (!fromNode || !toNode) return null;

        const isHidden =
          (draggingNodeId &&
            (connection.fromId === draggingNodeId || connection.toId === draggingNodeId)) ||
          (multiDraggingNodeIds.size > 0 &&
            (multiDraggingNodeIds.has(connection.fromId) ||
              multiDraggingNodeIds.has(connection.toId)));

        return (
          <ConnectionLine
            key={connectionId}
            from={fromNode}
            to={toNode}
            curvature={connection.curvature}
            isSelected={isElementSelected(connectionId, 'connection')}
            onSelect={() => selectElement(connectionId, 'connection')}
            opacity={isHidden ? 0 : 1}
          />
        );
      })}
    </pixiContainer>
  );
};
