import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useStore } from '@/store';
import { GamePerksData } from '@/types';
import {
  GAME_PERKS_FILENAME,
  uploadGamePerksToS3,
  validateGamePerksData,
} from '@/utils/s3-game-perks';

type GamePerksUploadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const GamePerksUploadDialog = ({ open, onOpenChange }: GamePerksUploadDialogProps) => {
  const s3SecretKey = useStore((state) => state.s3SecretKey);
  const setGamePerks = useStore((state) => state.setGamePerks);

  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const resetState = () => {
    setFile(null);
    setErrors([]);
    setIsUploading(false);
    setIsSuccess(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setErrors([]);
      setIsSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setErrors(['Выберите файл для загрузки']);
      return;
    }

    if (!s3SecretKey) {
      setErrors(['Ключ доступа S3 не настроен']);
      return;
    }

    setIsUploading(true);
    setErrors([]);
    setIsSuccess(false);

    try {
      const text = await file.text();
      const data = JSON.parse(text) as unknown;
      const validationErrors = validateGamePerksData(data);

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }

      await uploadGamePerksToS3(data as GamePerksData, s3SecretKey);
      setGamePerks(data as GamePerksData);
      setFile(null);
      setIsSuccess(true);
    } catch (error) {
      if (error instanceof SyntaxError) {
        setErrors(['Ошибка парсинга JSON: файл поврежден или имеет неверный формат']);
      } else {
        setErrors([error instanceof Error ? error.message : 'Произошла ошибка при загрузке файла']);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetState();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Обновление списка перков</DialogTitle>
          <DialogDescription>
            Загрузите новую версию файла {GAME_PERKS_FILENAME}. Он будет сохранён на S3 и сразу
            применён в редакторе.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="game-perks-file">{GAME_PERKS_FILENAME}</Label>
            <Input
              id="game-perks-file"
              type="file"
              accept=".json"
              onChange={handleFileChange}
              disabled={isUploading}
              className="cursor-pointer"
            />
          </div>

          {isUploading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="w-4 h-4" />
              <span>Загрузка файла...</span>
            </div>
          ) : null}

          {errors.length > 0 ? (
            <div className="flex flex-col gap-1 p-3 bg-destructive/10 border border-destructive rounded-md [&_*]:select-text">
              {errors.map((error, index) => (
                <p key={index} className="text-xs text-destructive">
                  {error}
                </p>
              ))}
            </div>
          ) : null}

          {isSuccess ? (
            <p className="text-xs text-green-500">Файл успешно загружен на S3 и применён.</p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isUploading}>
            Закрыть
          </Button>
          <Button onClick={handleUpload} disabled={!file || isUploading}>
            {isUploading ? 'Загрузка...' : 'Загрузить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
