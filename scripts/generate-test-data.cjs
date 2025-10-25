/* eslint-disable @typescript-eslint/no-require-imports */
// Скрипт для генерации тестовых данных дерева навыков в формате "солнечного круга"

const fs = require('node:fs');

// ============= КОНФИГУРАЦИЯ =============
const NUM_RAYS = 12; // Количество лучей
const NODES_PER_RAY = 20; // Количество нод на каждом луче
const NODE_SPACING = 100; // Расстояние между нодами (px)
const CENTER_X = 5000; // Центр X
const CENTER_Y = 5000; // Центр Y
// ========================================

// Функция для генерации уникального ID
function generateId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  let id = '';
  for (let i = 0; i < 21; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

// Шаблон для обычной ноды (type: 0)
function createRegularNode(x, y) {
  return {
    type: 0,
    perkId: 'azFireDamage01',
    iconUrl: 'https://i.imgur.com/YNRJWX3.png',
    title: 'Огненный урон I',
    description: 'fire_damage_1',
    reqDescription: '',
    keywords: [],
    x: x,
    y: y,
  };
}

// Шаблон для центральной ноды (type: 2)
function createCenterNode(x, y) {
  return {
    type: 2,
    perkId: 'azFireDamage02',
    iconUrl: 'https://i.ibb.co/2Y5nFXYj/download-1.png',
    title: 'Огненный урон II',
    description: 'fire_damage_2',
    reqDescription: '',
    keywords: [],
    x: x,
    y: y,
  };
}

// Функция для создания соединения
function createConnection(fromId, toId) {
  return {
    fromId: fromId,
    toId: toId,
    curvature: 0,
  };
}

// Основная функция генерации
function generateTestData() {
  const nodes = {};
  const connections = {};

  let totalNodes = 0;
  let totalConnections = 0;

  // Создаем центральную ноду
  const centerNodeId = generateId();
  nodes[centerNodeId] = createCenterNode(CENTER_X, CENTER_Y);
  totalNodes++;

  console.log('Генерация дерева навыков...');
  console.log(`Количество лучей: ${NUM_RAYS}`);
  console.log(`Нод на луч: ${NODES_PER_RAY}`);
  console.log(`Расстояние между нодами: ${NODE_SPACING}px`);
  console.log('');

  // Генерируем лучи
  for (let rayIndex = 0; rayIndex < NUM_RAYS; rayIndex++) {
    // Вычисляем угол для текущего луча
    const angle = ((2 * Math.PI) / NUM_RAYS) * rayIndex;

    let previousNodeId = centerNodeId;

    // Генерируем ноды на луче
    for (let nodeIndex = 0; nodeIndex < NODES_PER_RAY; nodeIndex++) {
      // Вычисляем расстояние от центра
      const distance = NODE_SPACING * (nodeIndex + 1);

      // Вычисляем координаты
      const x = CENTER_X + distance * Math.cos(angle);
      const y = CENTER_Y + distance * Math.sin(angle);

      // Создаем ноду
      const nodeId = generateId();
      nodes[nodeId] = createRegularNode(x, y);
      totalNodes++;

      // Создаем соединение с предыдущей нодой
      const connectionId = generateId();
      connections[connectionId] = createConnection(previousNodeId, nodeId);
      totalConnections++;

      previousNodeId = nodeId;
    }
  }

  // Формируем финальную структуру данных
  const data = {
    nodes: nodes,
    images: {},
    orbits: {},
    connections: connections,
    viewport: {
      x: CENTER_X,
      y: CENTER_Y,
      scale: 0.1,
    },
    gridSettings: {
      enabled: true,
      size: 60,
      rotation: 0,
    },
  };

  // Сохраняем в файл
  const outputPath = 'generated-test-data.json';
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');

  // Выводим статистику
  console.log('✓ Генерация завершена!');
  console.log('');
  console.log('=== СТАТИСТИКА ===');
  console.log(`Всего нод: ${totalNodes}`);
  console.log(`  - Центральная нода: 1`);
  console.log(`  - Ноды на лучах: ${totalNodes - 1}`);
  console.log(`Всего соединений: ${totalConnections}`);
  console.log('');
  console.log(`Файл сохранен: ${outputPath}`);
}

// Запускаем генерацию
generateTestData();
