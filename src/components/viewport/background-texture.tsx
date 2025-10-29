import { Rect } from 'react-konva';
import useImage from 'use-image';

import backgroundTextureUrl from '@/assets/background-texture.jpg';
import { VIEWPORT_WORLD_SIZE } from '@/constants';

export const BackgroundTexture = () => {
  const [textureImage] = useImage(backgroundTextureUrl, 'anonymous');

  if (!textureImage) return null;

  const worldX = -VIEWPORT_WORLD_SIZE / 2;
  const worldY = -VIEWPORT_WORLD_SIZE / 2;

  return (
    <Rect
      x={worldX}
      y={worldY}
      width={VIEWPORT_WORLD_SIZE}
      height={VIEWPORT_WORLD_SIZE}
      fillPatternImage={textureImage}
      fillPatternRepeat="repeat"
      listening={false}
    />
  );
};
