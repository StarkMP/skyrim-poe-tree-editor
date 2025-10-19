import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PanelSection } from '@/components/ui/panel-section';
import { useStore } from '@/store';
import { EditorImage } from '@/types';

type ImageSettingsProps = {
  imageId: string;
  image: EditorImage;
};

export const ImageSettings = ({ imageId, image }: ImageSettingsProps) => {
  const updateImage = useStore((state) => state.updateImage);

  const [imageUrlInput, setImageUrlInput] = useState(image.imageUrl);
  const [imageUrlError, setImageUrlError] = useState('');

  const handleWidthChange = (value: string) => {
    const width = Number.parseInt(value);
    if (!Number.isNaN(width) && width > 0) {
      updateImage(imageId, { width });
    }
  };

  const handleHeightChange = (value: string) => {
    const height = Number.parseInt(value);
    if (!Number.isNaN(height) && height > 0) {
      updateImage(imageId, { height });
    }
  };

  const validateAndApplyImageUrl = () => {
    const url = imageUrlInput.trim();

    if (!url) {
      setImageUrlError('URL не может быть пустым');
      return;
    }

    try {
      new URL(url);
    } catch {
      setImageUrlError('Некорректный URL');
      return;
    }

    const validExtensions = ['.png', '.jpg', '.jpeg'];
    const hasValidExtension = validExtensions.some((ext) => url.toLowerCase().endsWith(ext));

    if (!hasValidExtension) {
      setImageUrlError('URL должен указывать на изображение (.png, .jpg, .jpeg)');
      return;
    }

    setImageUrlError('');
    updateImage(imageId, { imageUrl: url });
  };

  return (
    <div className="flex flex-col gap-3">
      <PanelSection title="Настройки изображения" className="border-none">
        <div className="flex flex-col gap-3">
          {/* Image URL */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="image-url" className="text-xs">
              Изображение
            </Label>
            <div className="flex gap-2">
              <Input
                id="image-url"
                value={imageUrlInput}
                onChange={(e) => {
                  setImageUrlInput(e.target.value);
                  setImageUrlError('');
                }}
                className="h-8 text-xs flex-1"
                placeholder="https://example.com/background.png"
              />
              <Button size="sm" onClick={validateAndApplyImageUrl} className="h-8 text-xs">
                Применить
              </Button>
            </div>
            {imageUrlError ? (
              <span className="text-xs text-destructive">{imageUrlError}</span>
            ) : null}
          </div>

          {/* Position X */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="image-x" className="text-xs">
              X
            </Label>
            <Input
              id="image-x"
              type="number"
              value={Math.round(image.x)}
              disabled
              className="h-8 text-xs"
            />
          </div>

          {/* Position Y */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="image-y" className="text-xs">
              Y
            </Label>
            <Input
              id="image-y"
              type="number"
              value={Math.round(image.y)}
              disabled
              className="h-8 text-xs"
            />
          </div>

          {/* Width */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="image-width" className="text-xs">
              Ширина
            </Label>
            <Input
              id="image-width"
              type="number"
              value={image.width}
              onChange={(e) => handleWidthChange(e.target.value)}
              className="h-8 text-xs"
              min="1"
            />
          </div>

          {/* Height */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="image-height" className="text-xs">
              Высота
            </Label>
            <Input
              id="image-height"
              type="number"
              value={image.height}
              onChange={(e) => handleHeightChange(e.target.value)}
              className="h-8 text-xs"
              min="1"
            />
          </div>
        </div>
      </PanelSection>
    </div>
  );
};
