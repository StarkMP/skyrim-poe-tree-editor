import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PanelSection } from '@/components/ui/panel-section';
import { Spinner } from '@/components/ui/spinner';
import { useStore } from '@/store';
import { EditorImage } from '@/types';
import { uploadIconToS3 } from '@/utils/s3-upload';

type ImageSettingsProps = {
  imageId: string;
  image: EditorImage;
};

export const ImageSettings = ({ imageId, image }: ImageSettingsProps) => {
  const { updateImage } = useStore();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update input when image changes
  useEffect(() => {
    setSelectedFile(null);
    setUploadError('');
  }, [imageId]);

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

  const handleOpacityChange = (value: string) => {
    const opacity = Number.parseFloat(value);
    if (!Number.isNaN(opacity) && opacity >= 0 && opacity <= 1) {
      updateImage(imageId, { opacity });
    }
  };

  const handleRotationChange = (value: string) => {
    const rotation = Number.parseFloat(value);
    if (!Number.isNaN(rotation)) {
      updateImage(imageId, { rotation });
    }
  };

  const handleXChange = (value: string) => {
    const x = Number.parseFloat(value);
    if (!Number.isNaN(x)) {
      updateImage(imageId, { x });
    }
  };

  const handleYChange = (value: string) => {
    const y = Number.parseFloat(value);
    if (!Number.isNaN(y)) {
      updateImage(imageId, { y });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadError('');
    }
  };

  const handleUploadImage = async () => {
    if (!selectedFile) {
      setUploadError('Выберите файл для загрузки');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const imageUrl = await uploadIconToS3(selectedFile, {
        maxWidth: 2000,
        maxHeight: 2000,
      });
      updateImage(imageId, { imageUrl });
      setSelectedFile(null);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Ошибка при загрузке файла');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <PanelSection title="Изображение" className="border-none">
        <div className="flex flex-col gap-3">
          {/* Image Upload */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="image-file" className="text-xs">
              Изображение
            </Label>
            {/* Current image preview */}
            {image.imageUrl && image.imageUrl.length > 0 ? (
              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                <img
                  src={image.imageUrl}
                  alt="Current background"
                  className="w-12 h-12 object-contain rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <span className="text-xs text-muted-foreground truncate flex-1">
                  Текущее изображение загружено
                </span>
              </div>
            ) : null}
            {/* File input */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  ref={fileInputRef}
                  id="image-file"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                  className="h-8 text-xs cursor-pointer"
                />
                {selectedFile ? (
                  <span className="text-xs text-muted-foreground mt-1 block">
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                ) : null}
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleUploadImage}
                disabled={!selectedFile || isUploading}
                className="h-8 text-xs min-w-[100px]"
              >
                {isUploading ? (
                  <>
                    <Spinner className="w-3 h-3 mr-1" />
                    Загрузка...
                  </>
                ) : (
                  'Загрузить'
                )}
              </Button>
            </div>
            {uploadError ? <span className="text-xs text-destructive">{uploadError}</span> : null}
          </div>

          <div className="w-full grid grid-cols-2 gap-2">
            {/* Position X */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="image-x" className="text-xs">
                X
              </Label>
              <Input
                id="image-x"
                type="number"
                value={Math.round(image.x)}
                onChange={(e) => handleXChange(e.target.value)}
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
                onChange={(e) => handleYChange(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="w-full grid grid-cols-2 gap-2">
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

          {/* Opacity */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="image-opacity" className="text-xs">
              Прозрачность (0-1)
            </Label>
            <Input
              id="image-opacity"
              type="number"
              value={image.opacity ?? 1}
              onChange={(e) => handleOpacityChange(e.target.value)}
              className="h-8 text-xs"
              min="0"
              max="1"
              step="0.1"
            />
          </div>

          {/* Rotation */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="image-rotation" className="text-xs">
              Поворот (градусы)
            </Label>
            <Input
              id="image-rotation"
              type="number"
              value={image.rotation ?? 0}
              onChange={(e) => handleRotationChange(e.target.value)}
              className="h-8 text-xs"
              step="1"
            />
          </div>
        </div>
      </PanelSection>
    </div>
  );
};
