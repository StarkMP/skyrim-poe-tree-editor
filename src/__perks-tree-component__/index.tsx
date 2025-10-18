import { useEffect, useMemo, useRef, useState } from 'react';

import { ZoomPanWrapper } from '@/components/ui/zoom-pan-wrapper';

import { usePerksTreeStore } from './store';

export const PerksTree = () => {
  const { data, precomputed, initializePrecomputed, hoveredNodeId, setHoveredNodeId } =
    usePerksTreeStore();
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const mouseDownPosRef = useRef({ x: 0, y: 0 });
  const throttleTimeoutRef = useRef<number | null>(null);

  // Инициализируем предвычисленные данные один раз при монтировании
  useEffect(() => {
    initializePrecomputed();
  }, [initializePrecomputed]);

  // Создаем Map для O(1) доступа к ноде по ID
  const nodesMap = useMemo(() => {
    if (!precomputed) return null;
    return new Map(precomputed.nodesWithRadius.map((node) => [node.id, node]));
  }, [precomputed]);

  const handleSvgMouseDown = (event: React.MouseEvent<SVGSVGElement>) => {
    mouseDownPosRef.current = { x: event.clientX, y: event.clientY };
  };

  const handleSvgMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !precomputed) return;

    // Троттлинг: обрабатываем событие не чаще чем раз в 50мс
    if (throttleTimeoutRef.current !== null) {
      return;
    }

    throttleTimeoutRef.current = window.setTimeout(() => {
      throttleTimeoutRef.current = null;
    }, 50);

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();

    // Получаем координаты курсора относительно SVG элемента
    const clientX = event.clientX - rect.left;
    const clientY = event.clientY - rect.top;

    // Преобразуем в координаты SVG viewBox
    const svgX = (clientX / rect.width) * data.width;
    const svgY = (clientY / rect.height) * data.height;

    // Используем пространственный индекс для быстрого поиска
    const foundNode = precomputed.spatialIndex.findNodeAt(svgX, svgY);

    // Обновляем состояние только если нода изменилась
    const newNodeId = foundNode ? foundNode.id : null;
    if (newNodeId !== hoveredNodeId) {
      setHoveredNodeId(newNodeId);
    }
  };

  const handleSvgMouseLeave = () => {
    // Сбрасываем наведение при выходе курсора за пределы SVG
    setHoveredNodeId(null);
  };

  const handleSvgClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !precomputed) return;

    // Проверяем, был ли это драг (мышь сдвинулась больше чем на 3 пикселя)
    const dx = Math.abs(event.clientX - mouseDownPosRef.current.x);
    const dy = Math.abs(event.clientY - mouseDownPosRef.current.y);
    if (dx > 3 || dy > 3) {
      return; // Это был драг, не обрабатываем как клик
    }

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();

    // Получаем координаты клика относительно SVG элемента (уже трансформированного)
    const clientX = event.clientX - rect.left;
    const clientY = event.clientY - rect.top;

    // Преобразуем обратно в координаты SVG viewBox
    const svgX = (clientX / rect.width) * data.width;
    const svgY = (clientY / rect.height) * data.height;

    // Используем пространственный индекс для быстрого поиска O(log n) вместо O(n)
    const foundNode = precomputed.spatialIndex.findNodeAt(svgX, svgY);

    if (foundNode) {
      setSelectedNodeId(foundNode.id);
      console.log('Clicked node:', foundNode.id, data.nodes[foundNode.id]);
    }
  };

  // Показываем загрузку пока данные не готовы
  if (!precomputed) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-[#080B10]">
        <div className="text-white text-3xl">Загрузка древа умений...</div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen">
      <div className="flex flex-col size-full overflow-hidden bg-[#080B10]">
        <ZoomPanWrapper maxScale={2}>
          <svg
            ref={svgRef}
            width={data.width}
            height={data.height}
            viewBox={`0 0 ${data.width} ${data.height}`}
            xmlns="http://www.w3.org/2000/svg"
            onMouseDown={handleSvgMouseDown}
            onMouseMove={handleSvgMouseMove}
            onMouseLeave={handleSvgMouseLeave}
            onClick={handleSvgClick}
          >
            {/* Node Inactive Lines */}
            <path d={precomputed.linesPath} stroke="#404040" strokeWidth="6" fill="none" />

            {/* Node Inactive Borders */}
            <path d={precomputed.circlesPath} stroke="#404040" strokeWidth="8" fill="none" />

            {/* Monolith Image of all Icons */}
            <image
              href={precomputed.nodesImage}
              width={data.width}
              height={data.height}
              style={{ pointerEvents: 'none' }}
            />

            {/* Node Inactive Overlay Circles */}
            <path d={precomputed.circlesPath} fill="#080B10" opacity={0.7} />

            {/* Hovered Node Highlight */}
            {hoveredNodeId && nodesMap
              ? (() => {
                  const hoveredNode = nodesMap.get(hoveredNodeId);
                  if (!hoveredNode) return null;

                  return (
                    <circle
                      cx={hoveredNode.x}
                      cy={hoveredNode.y}
                      r={hoveredNode.radius}
                      fill="none"
                      stroke="#4A9EFF"
                      strokeWidth="3"
                      style={{ pointerEvents: 'none' }}
                    />
                  );
                })()
              : null}

            {/* Selected Node Highlight */}
            {selectedNodeId && nodesMap
              ? (() => {
                  const selectedNode = nodesMap.get(selectedNodeId);
                  if (!selectedNode) return null;

                  return (
                    <circle
                      cx={selectedNode.x}
                      cy={selectedNode.y}
                      r={selectedNode.radius}
                      fill="none"
                      stroke="#FFD700"
                      strokeWidth="4"
                      style={{ pointerEvents: 'none' }}
                    />
                  );
                })()
              : null}
          </svg>
        </ZoomPanWrapper>
      </div>
    </div>
  );
};
