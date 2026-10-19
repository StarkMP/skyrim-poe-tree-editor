import { useStore } from '@/store';

import { WebLayer } from './tree-elements/web-layer';

export const Web = () => {
  const webSettings = useStore((state) => state.webSettings);

  return (
    <WebLayer
      enabled={webSettings.enabled}
      size={webSettings.size}
      spokes={webSettings.spokes}
      rotation={webSettings.rotation}
      innerRadius={webSettings.innerRadius}
      concentricCircles={webSettings.concentricCircles}
    />
  );
};
