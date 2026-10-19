import { useMemo } from 'react';

import { useStore } from '@/store';
import { Connection } from '@/types';

import { useDraggingNodesStore } from './dragging-nodes';
import { TempConnectionLine } from './tree-elements/temp-connection-line';

const filterNodeConnections = (nodeId: string | null, connections: [string, Connection][]) =>
  nodeId ? connections.filter(([, conn]) => conn.fromId === nodeId || conn.toId === nodeId) : [];

const filterMultiNodesConnections = (nodeIds: Set<string>, connections: [string, Connection][]) =>
  nodeIds.size > 0
    ? connections.filter(([, conn]) => nodeIds.has(conn.fromId) || nodeIds.has(conn.toId))
    : [];

export const TempConnectionsDragging = () => {
  const connections = useStore((state) => state.connections);
  const nodes = useStore((state) => state.nodes);

  const draggingNodeId = useDraggingNodesStore(({ draggingNodeId }) => draggingNodeId);
  const multiDraggingNodeIds = useDraggingNodesStore(
    ({ multiDraggingNodeIds }) => multiDraggingNodeIds
  );
  const draggingNodePos = useDraggingNodesStore(({ draggingNodePos }) => draggingNodePos);

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
      {draggingNodeId && draggingNodePos
        ? draggingNodeConnections.map(([connId, connection]) => {
            const connectedId =
              connection.fromId === draggingNodeId ? connection.toId : connection.fromId;
            const connectedNode = nodes[connectedId];
            if (!connectedNode) return null;

            const shouldInvertCurvature =
              connection.fromId === connectedId && connection.toId === draggingNodeId;

            const curvature = connection.curvature ?? 0;
            const adjustedCurvature = shouldInvertCurvature ? -curvature : curvature;

            return (
              <TempConnectionLine
                key={`temp-${connId}`}
                from={draggingNodePos}
                to={{ x: connectedNode.x, y: connectedNode.y }}
                curvature={adjustedCurvature}
              />
            );
          })
        : null}

      {multiDraggingNodeIds.size > 0
        ? multiDraggingNodeConnections.map(([connId, connection]) => {
            const fromNode = nodes[connection.fromId];
            const toNode = nodes[connection.toId];
            if (!fromNode || !toNode) return null;

            return (
              <TempConnectionLine
                key={`temp-multi-${connId}`}
                from={{ x: fromNode.x, y: fromNode.y }}
                to={{ x: toNode.x, y: toNode.y }}
                curvature={connection.curvature ?? 0}
              />
            );
          })
        : null}
    </pixiContainer>
  );
};
