import { useMemo } from 'react';

import { useStore } from '@/store';
import { type Connection } from '@/types';

import { useDraggingNodesStore } from './dragging-nodes';
import { ConnectionLine } from './tree-elements/connection-line';

export const Connections = () => {
  const connections = useStore((state) => state.connections);
  const connectionsArray = useMemo(() => Object.entries(connections), [connections]);

  return (
    <pixiContainer>
      {connectionsArray.map(([connectionId, connection]) => (
        <ConnectionItem key={connectionId} connectionId={connectionId} connection={connection} />
      ))}
    </pixiContainer>
  );
};

const ConnectionItem = ({
  connectionId,
  connection,
}: {
  connectionId: string;
  connection: Connection;
}) => {
  const isSelected = useStore((state) => state.isElementSelected(connectionId, 'connection'));
  const selectElement = useStore((state) => state.selectElement);

  const fromNode = useStore((state) => state.nodes[connection.fromId]);
  const toNode = useStore((state) => state.nodes[connection.toId]);

  const isHidden = useDraggingNodesStore(
    ({ draggingNodeId, multiDraggingNodeIds }) =>
      (draggingNodeId &&
        (connection.fromId === draggingNodeId || connection.toId === draggingNodeId)) ||
      (multiDraggingNodeIds.size > 0 &&
        (multiDraggingNodeIds.has(connection.fromId) || multiDraggingNodeIds.has(connection.toId)))
  );

  if (!fromNode || !toNode) return null;

  return (
    <ConnectionLine
      from={fromNode}
      to={toNode}
      curvature={connection.curvature}
      isSelected={isSelected}
      onSelect={() => selectElement(connectionId, 'connection')}
      opacity={isHidden ? 0 : 1}
    />
  );
};
