/**
 * Выравнивает значение по сетке
 * @param value - координата для выравнивания
 * @param gridSize - размер ячейки сетки
 * @returns выровненное значение, кратное gridSize
 */
export const snapToGrid = (value: number, gridSize: number): number =>
  Math.round(value / gridSize) * gridSize;

/**
 * Поворачивает точку вокруг начала координат
 * @param x - координата X
 * @param y - координата Y
 * @param angle - угол поворота в градусах
 * @returns повернутые координаты
 */
const rotatePoint = (x: number, y: number, angle: number): { x: number; y: number } => {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  };
};

/**
 * Выравнивает координаты по повернутой сетке
 * @param x - координата X
 * @param y - координата Y
 * @param gridSize - размер ячейки сетки
 * @param rotation - угол поворота сетки в градусах
 * @returns выровненные координаты
 */
export const snapToRotatedGrid = (
  x: number,
  y: number,
  gridSize: number,
  rotation: number
): { x: number; y: number } => {
  if (rotation === 0) {
    return {
      x: snapToGrid(x, gridSize),
      y: snapToGrid(y, gridSize),
    };
  }

  const rotated = rotatePoint(x, y, -rotation);

  const snapped = {
    x: snapToGrid(rotated.x, gridSize),
    y: snapToGrid(rotated.y, gridSize),
  };

  return rotatePoint(snapped.x, snapped.y, rotation);
};

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
