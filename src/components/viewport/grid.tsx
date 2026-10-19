import { useStore } from '@/store';

import { useViewport } from './context';
import { GridLayer } from './tree-elements/grid-layer';

export const Grid = () => {
  const viewport = useViewport();

  const gridSettings = useStore((state) => state.gridSettings);
  const viewportState = useStore((state) => state.viewport);

  if (!viewport) return null;

  return (
    <GridLayer
      gridSize={gridSettings.size}
      enabled={gridSettings.enabled}
      rotation={gridSettings.rotation}
      viewport={viewport}
      viewportState={viewportState}
    />
  );
};
