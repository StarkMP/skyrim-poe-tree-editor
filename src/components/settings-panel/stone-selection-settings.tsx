import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PanelSection } from '@/components/ui/panel-section';
import { Spinner } from '@/components/ui/spinner';
import { useStore } from '@/store';
import { EditorStoneSelection } from '@/types';
import { uploadIconToS3 } from '@/utils/s3-upload';

const MAX_IMAGE_WIDTH = 8000;
const MAX_IMAGE_HEIGHT = 8000;

type StoneSelectionSettingsProps = {
  stone: EditorStoneSelection;
};

export const StoneSelectionSettings = ({ stone }: StoneSelectionSettingsProps) => {
  const updateStoneSelection = useStore((state) => state.updateStoneSelection);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedFile(null);
    setUploadError('');
  }, [stone]);

  const handleWidthChange = (value: string) => {
    const width = Number.parseInt(value);
    const currentWidth = Math.min(width, MAX_IMAGE_WIDTH);

    updateStoneSelection({ width: currentWidth ?? 0 });
  };

  const handleHeightChange = (value: string) => {
    const height = Number.parseInt(value);
    const currentHeight = Math.min(height, MAX_IMAGE_HEIGHT);

    updateStoneSelection({ height: currentHeight ?? 0 });
  };

  const handleWidthBlur = () => {
    if (Number.isNaN(stone.width)) {
      updateStoneSelection({ width: 0 });
    }
  };

  const handleHeightBlur = () => {
    if (Number.isNaN(stone.height)) {
      updateStoneSelection({ height: 0 });
    }
  };

  const handleXChange = (value: string) => {
    const x = Number.parseFloat(value);
    if (!Number.isNaN(x)) {
      updateStoneSelection({ x });
    }
  };

  const handleYChange = (value: string) => {
    const y = Number.parseFloat(value);
    if (!Number.isNaN(y)) {
      updateStoneSelection({ y });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadError('');
    }
  };

  const s3SecretKey = useStore((state) => state.s3SecretKey);

  const handleUploadImage = async () => {
    if (!selectedFile) {
      setUploadError('Выберите файл для загрузки');
      return;
    }

    if (!s3SecretKey) {
      setUploadError('Ключ доступа S3 не настроен');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const imageUrl = await uploadIconToS3(selectedFile, s3SecretKey, {
        maxWidth: MAX_IMAGE_WIDTH,
        maxHeight: MAX_IMAGE_HEIGHT,
      });
      updateStoneSelection({ imageUrl });
      setSelectedFile(null);

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
      <PanelSection title="Выбор камня" className="border-none">
        <div className="flex flex-col gap-3">
          {/* Image Upload */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="stone-file" className="text-xs">
              Изображение
            </Label>
            {/* Current image preview */}
            {stone.imageUrl && stone.imageUrl.length > 0 ? (
              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                <img
                  src={stone.imageUrl}
                  alt="Current stone"
                  className="w-12 h-12 object-contain rounded"
                  crossOrigin="anonymous"
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
                  id="stone-file"
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
              <Label htmlFor="stone-x" className="text-xs">
                X
              </Label>
              <Input
                id="stone-x"
                type="number"
                value={Math.round(stone.x)}
                onChange={(e) => handleXChange(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            {/* Position Y */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="stone-y" className="text-xs">
                Y
              </Label>
              <Input
                id="stone-y"
                type="number"
                value={Math.round(stone.y)}
                onChange={(e) => handleYChange(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="w-full grid grid-cols-2 gap-2">
            {/* Width */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="stone-width" className="text-xs">
                Ширина
              </Label>
              <Input
                id="stone-width"
                type="number"
                value={stone.width}
                onChange={(e) => handleWidthChange(e.target.value)}
                onBlur={handleWidthBlur}
                className="h-8 text-xs"
                min="1"
              />
            </div>

            {/* Height */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="stone-height" className="text-xs">
                Высота
              </Label>
              <Input
                id="stone-height"
                type="number"
                value={stone.height}
                onChange={(e) => handleHeightChange(e.target.value)}
                onBlur={handleHeightBlur}
                className="h-8 text-xs"
                min="1"
              />
            </div>
          </div>
        </div>
      </PanelSection>
    </div>
  );
};
