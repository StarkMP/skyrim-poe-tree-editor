/**
 * Выравнивает значение по сетке
 * @param value - координата для выравнивания
 * @param gridSize - размер ячейки сетки
 * @returns выровненное значение, кратное gridSize
 */
export const snapToGrid = (value: number, gridSize: number): number =>
  Math.round(value / gridSize) * gridSize;

/**
 * Вычисляет видимую область viewport в мировых координатах
 * @param stagePos - позиция stage
 * @param stageSize - размер stage
 * @param scale - масштаб
 * @returns границы видимой области
 */
export const getVisibleRect = (
  stagePos: { x: number; y: number },
  stageSize: { width: number; height: number },
  scale: number
) => ({
  x1: -stagePos.x / scale,
  y1: -stagePos.y / scale,
  x2: (-stagePos.x + stageSize.width) / scale,
  y2: (-stagePos.y + stageSize.height) / scale,
});

/**
 * Вычисляет диапазон линий сетки для видимой области
 * @param visibleRect - видимая область
 * @param gridSize - размер ячейки сетки
 * @returns диапазон координат сетки
 */
export const getGridRange = (
  visibleRect: { x1: number; y1: number; x2: number; y2: number },
  gridSize: number
) => ({
  startX: Math.floor(visibleRect.x1 / gridSize) * gridSize,
  endX: Math.ceil(visibleRect.x2 / gridSize) * gridSize,
  startY: Math.floor(visibleRect.y1 / gridSize) * gridSize,
  endY: Math.ceil(visibleRect.y2 / gridSize) * gridSize,
});
