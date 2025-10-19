import nodeIconsImage from './exported-data/node-icons.png';
import { NodeWithRadius, SpatialIndex } from './spatial-index';
import { PerksTreeData, PerksTreeNodeType } from './types';

const RADIUS_SMALL = 20;
const RADIUS_LARGE = 30;
const RADIUS_MASTER = 40;

export type PrecomputedTreeData = {
  linesPath: string;
  circlesPath: string;
  nodesImage: string;
  spatialIndex: SpatialIndex;
  nodesWithRadius: NodeWithRadius[];
};

/**
 * Получает радиус ноды по её типу
 */
function getNodeRadius(type: PerksTreeNodeType): number {
  switch (type) {
    case PerksTreeNodeType.LargeNode: {
      return RADIUS_LARGE;
    }
    case PerksTreeNodeType.MasterNode: {
      return RADIUS_MASTER;
    }
    default: {
      return RADIUS_SMALL;
    }
  }
}

/**
 * Генерирует SVG path для всех линий соединений
 */
function generateLinesPath(data: PerksTreeData): string {
  const commands: string[] = [];
  const processedConnections = new Set<string>();

  // Используем entries один раз и кешируем
  const nodesEntries = Object.entries(data.nodes);

  for (const [nodeId, node] of nodesEntries) {
    for (const connectedNodeId of node.connections) {
      const connectionKey = [nodeId, connectedNodeId].toSorted().join('-');

      if (processedConnections.has(connectionKey)) continue;

      const connectedNode = data.nodes[connectedNodeId];
      if (!connectedNode) continue;

      commands.push(`M${node.x},${node.y}L${connectedNode.x},${connectedNode.y}`);
      processedConnections.add(connectionKey);
    }
  }

  return commands.join('');
}

/**
 * Генерирует SVG path для всех кругов нод
 */
function generateCirclesPath(nodesWithRadius: NodeWithRadius[]): string {
  const commands: string[] = [];

  for (const node of nodesWithRadius) {
    const radius = node.radius;
    // Рисуем круг через path: два полукруга
    commands.push(
      `M${node.x - radius},${node.y}a${radius},${radius} 0 1,0 ${radius * 2},0a${radius},${radius} 0 1,0 -${radius * 2},0`
    );
  }

  return commands.join('');
}

/**
 * Создает пространственный индекс для быстрого поиска нод
 */
function createSpatialIndex(nodesWithRadius: NodeWithRadius[]): SpatialIndex {
  const spatialIndex = new SpatialIndex(100); // размер ячейки 100px

  for (const node of nodesWithRadius) {
    spatialIndex.addNode(node);
  }

  return spatialIndex;
}

/**
 * Предвычисляет все данные для древа умений
 * Выполняется один раз при инициализации
 */
export function precomputeTreeData(data: PerksTreeData): PrecomputedTreeData {
  // 1. Создаем массив нод с предвычисленными радиусами
  const nodesWithRadius: NodeWithRadius[] = Object.entries(data.nodes).map(([id, node]) => ({
    id,
    x: node.x,
    y: node.y,
    radius: getNodeRadius(node.type),
  }));

  // 2. Генерируем пути (выполняется синхронно, быстро)
  const linesPath = generateLinesPath(data);
  const circlesPath = generateCirclesPath(nodesWithRadius);

  // 3. Создаем пространственный индекс
  const spatialIndex = createSpatialIndex(nodesWithRadius);

  // 4. Используем заранее подготовленное изображение
  const nodesImage = nodeIconsImage;

  return {
    linesPath,
    circlesPath,
    nodesImage,
    spatialIndex,
    nodesWithRadius,
  };
}
