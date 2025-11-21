import { ORBIT_SNAP_THRESHOLD } from '@/constants';
import { EditorOrbits, PositionOrbit } from '@/types';

/**
 * Вычисляет координаты всех точек снаппинга орбиты
 * @param orbit - орбита
 * @returns массив точек: [центральная точка, ...точки на орбите]
 */
export const getOrbitPoints = (orbit: PositionOrbit): Array<{ x: number; y: number }> => {
  const points: Array<{ x: number; y: number }> = [];

  points.push({ x: orbit.x, y: orbit.y });

  const rotationRad = ((orbit.rotation || 0) * Math.PI) / 180;

  const angleStep = (2 * Math.PI) / orbit.pointCount;

  for (let i = 0; i < orbit.pointCount; i++) {
    const angle = i * angleStep + rotationRad;
    points.push({
      x: orbit.x + orbit.radius * Math.cos(angle),
      y: orbit.y + orbit.radius * Math.sin(angle),
    });
  }

  return points;
};

/**
 * Находит ближайшую точку снаппинга среди всех орбит
 * @param position - текущая позиция
 * @param orbits - все орбиты
 * @param threshold - максимальное расстояние для снаппинга (по умолчанию ORBIT_SNAP_THRESHOLD)
 * @returns координаты точки снаппинга или null, если не найдено
 */
export const findClosestOrbitSnapPoint = (
  position: { x: number; y: number },
  orbits: EditorOrbits,
  threshold: number = ORBIT_SNAP_THRESHOLD
): { x: number; y: number } | null => {
  let closestPoint: { x: number; y: number } | null = null;
  let minDistance = threshold;

  for (const orbit of Object.values(orbits)) {
    const points = getOrbitPoints(orbit);

    for (const point of points) {
      const distance = Math.sqrt(
        Math.pow(point.x - position.x, 2) + Math.pow(point.y - position.y, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    }
  }

  return closestPoint;
};

/**
 * Проверяет, находится ли позиция в зоне влияния орбиты
 * @param position - проверяемая позиция
 * @param orbit - орбита
 * @param threshold - радиус зоны влияния (по умолчанию ORBIT_SNAP_THRESHOLD)
 * @returns true, если позиция в зоне влияния
 */
export const isPositionInOrbitInfluence = (
  position: { x: number; y: number },
  orbit: PositionOrbit,
  threshold: number = ORBIT_SNAP_THRESHOLD
): boolean => {
  const points = getOrbitPoints(orbit);

  for (const point of points) {
    const distance = Math.sqrt(
      Math.pow(point.x - position.x, 2) + Math.pow(point.y - position.y, 2)
    );

    if (distance <= threshold) {
      return true;
    }
  }

  return false;
};

/**
 * Находит ближайшую точку снаппинга на конкретной орбите
 * @param position - текущая позиция
 * @param orbit - орбита
 * @param threshold - максимальное расстояние для снаппинга
 * @returns координаты точки снаппинга и её индекс, или null
 */
export const findClosestPointOnOrbit = (
  position: { x: number; y: number },
  orbit: PositionOrbit,
  threshold: number = ORBIT_SNAP_THRESHOLD
): { point: { x: number; y: number }; index: number } | null => {
  const points = getOrbitPoints(orbit);
  let closestPoint: { x: number; y: number } | null = null;
  let closestIndex = -1;
  let minDistance = threshold;

  for (const [i, point] of points.entries()) {
    const distance = Math.sqrt(
      Math.pow(point.x - position.x, 2) + Math.pow(point.y - position.y, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = point;
      closestIndex = i;
    }
  }

  return closestPoint ? { point: closestPoint, index: closestIndex } : null;
};
