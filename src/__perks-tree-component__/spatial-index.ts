/**
 * Простой grid-based spatial index для быстрого поиска нод по координатам
 * Разбивает пространство на ячейки и хранит ноды в соответствующих ячейках
 */

export type NodeWithRadius = {
  id: string;
  x: number;
  y: number;
  radius: number;
};

export class SpatialIndex {
  private cellSize: number;
  private grid: Map<string, NodeWithRadius[]>;
  private nodes: NodeWithRadius[];

  constructor(cellSize: number = 100) {
    this.cellSize = cellSize;
    this.grid = new Map();
    this.nodes = [];
  }

  /**
   * Добавляет ноду в индекс
   */
  addNode(node: NodeWithRadius): void {
    this.nodes.push(node);

    // Определяем все ячейки, которые может занимать нода (с учетом радиуса)
    const minCellX = Math.floor((node.x - node.radius) / this.cellSize);
    const maxCellX = Math.floor((node.x + node.radius) / this.cellSize);
    const minCellY = Math.floor((node.y - node.radius) / this.cellSize);
    const maxCellY = Math.floor((node.y + node.radius) / this.cellSize);

    for (let cellX = minCellX; cellX <= maxCellX; cellX++) {
      for (let cellY = minCellY; cellY <= maxCellY; cellY++) {
        const key = `${cellX},${cellY}`;
        const cell = this.grid.get(key);
        if (cell) {
          cell.push(node);
        } else {
          this.grid.set(key, [node]);
        }
      }
    }
  }

  /**
   * Находит ноду в указанной точке
   * Возвращает первую найденную ноду или null
   */
  findNodeAt(x: number, y: number): NodeWithRadius | null {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    const key = `${cellX},${cellY}`;

    const cell = this.grid.get(key);
    if (!cell) return null;

    // Проверяем только ноды в этой ячейке
    for (const node of cell) {
      const dx = x - node.x;
      const dy = y - node.y;
      const distanceSquared = dx * dx + dy * dy;
      const radiusSquared = node.radius * node.radius;

      if (distanceSquared <= radiusSquared) {
        return node;
      }
    }

    return null;
  }

  /**
   * Возвращает все ноды
   */
  getAllNodes(): NodeWithRadius[] {
    return this.nodes;
  }
}
