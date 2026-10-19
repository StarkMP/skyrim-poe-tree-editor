import { Assets, Texture } from 'pixi.js';
import { useEffect, useState } from 'react';

export const useAssets = (assetUrl: string | undefined) => {
  const [texture, setTexture] = useState<Texture>();

  useEffect(() => {
    if (!assetUrl) return;

    Assets.load(assetUrl).then(setTexture);
  }, [assetUrl]);

  return texture;
};
