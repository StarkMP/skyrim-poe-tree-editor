import { useMemo } from 'react';

import { useStore } from '@/store';
import { Connection } from '@/types';

import { useDraggingNodesStore } from './dragging-nodes';
import { TempConnectionLine } from './tree-elements/temp-connection-line';

export const TempConnectionsDragging = () => {
  const connections = useStore((state) => state.connections);

  const draggingNodeId = useDraggingNodesStore(({ draggingNodeId }) => draggingNodeId);
  const multiDraggingNodeIds = useDraggingNodesStore(
    ({ multiDraggingNodeIds }) => multiDraggingNodeIds
  );

  const connectionsArray = useMemo(() => Object.entries(connections), [connections]);
  const draggingNodeConnections = useMemo(
    () => filterNodeConnections(draggingNodeId, connectionsArray),
    [connectionsArray, draggingNodeId]
  );
  const multiDraggingNodeConnections = useMemo(
    () => filterMultiNodesConnections(multiDraggingNodeIds, connectionsArray),
    [connectionsArray, multiDraggingNodeIds]
  );

  return (
    <pixiContainer>
      {draggingNodeId
        ? draggingNodeConnections.map(([connId, connection]) => (
            <SingleDragTempConnection key={`temp-single-${connId}`} connection={connection} />
          ))
        : null}

      {multiDraggingNodeIds.size > 0
        ? multiDraggingNodeConnections.map(([connId, connection]) => (
            <MultiDragTempConnection key={`temp-multi-${connId}`} connection={connection} />
          ))
        : null}
    </pixiContainer>
  );
};

const SingleDragTempConnection = ({ connection }: { connection: Connection }) => {
  const draggingNodePos = useDraggingNodesStore(({ draggingNodePos }) => draggingNodePos);

  const connectedId = useDraggingNodesStore(({ draggingNodeId }) =>
    connection.fromId === draggingNodeId ? connection.toId : connection.fromId
  );
  const connectedNode = useStore((state) => state.nodes[connectedId]);
  const shouldInvertCurvature = useDraggingNodesStore(
    ({ draggingNodeId }) => connection.fromId === connectedId && connection.toId === draggingNodeId
  );

  if (!connectedNode || !draggingNodePos) return null;

  const curvature = connection.curvature ?? 0;
  const adjustedCurvature = shouldInvertCurvature ? -curvature : curvature;

  return (
    <TempConnectionLine
      from={draggingNodePos}
      to={{ x: connectedNode.x, y: connectedNode.y }}
      curvature={adjustedCurvature}
    />
  );
};

const MultiDragTempConnection = ({ connection }: { connection: Connection }) => {
  const fromNode = useStore((state) => state.nodes[connection.fromId]);
  const toNode = useStore((state) => state.nodes[connection.toId]);

  if (!fromNode || !toNode) return null;

  return (
    <TempConnectionLine
      from={{ x: fromNode.x, y: fromNode.y }}
      to={{ x: toNode.x, y: toNode.y }}
      curvature={connection.curvature ?? 0}
    />
  );
};

const filterNodeConnections = (nodeId: string | null, connections: [string, Connection][]) =>
  nodeId ? connections.filter(([, conn]) => conn.fromId === nodeId || conn.toId === nodeId) : [];

const filterMultiNodesConnections = (nodeIds: Set<string>, connections: [string, Connection][]) =>
  nodeIds.size > 0
    ? connections.filter(([, conn]) => nodeIds.has(conn.fromId) || nodeIds.has(conn.toId))
    : [];
