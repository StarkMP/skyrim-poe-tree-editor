import { useRef, useState } from 'react';

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
import { decodeAndParseJsonFile } from '@/utils/decode-text-file';
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

  const [parsedData, setParsedData] = useState<GamePerksData | null>(null);
  const [encoding, setEncoding] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const parseRequestId = useRef(0);

  const resetState = () => {
    parseRequestId.current += 1;
    setParsedData(null);
    setEncoding('');
    setErrors([]);
    setIsParsing(false);
    setIsUploading(false);
    setIsSuccess(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const requestId = parseRequestId.current + 1;
    parseRequestId.current = requestId;

    setParsedData(null);
    setEncoding('');
    setErrors([]);
    setIsSuccess(false);
    setIsParsing(true);

    try {
      const { data, encoding: detectedEncoding } = await decodeAndParseJsonFile(selectedFile);
      const validationErrors = validateGamePerksData(data);

      if (requestId !== parseRequestId.current) return;

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }

      setParsedData(data as GamePerksData);
      setEncoding(detectedEncoding);
    } catch (error) {
      if (requestId !== parseRequestId.current) return;
      setErrors([error instanceof Error ? error.message : 'Не удалось прочитать файл']);
    } finally {
      if (requestId === parseRequestId.current) {
        setIsParsing(false);
      }
    }
  };

  const handleUpload = async () => {
    if (!parsedData) {
      setErrors(['Выберите корректный файл для загрузки']);
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
      await uploadGamePerksToS3(parsedData, s3SecretKey);
      setGamePerks(parsedData);
      setParsedData(null);
      setEncoding('');
      setIsSuccess(true);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Произошла ошибка при загрузке файла']);
    } finally {
      setIsUploading(false);
    }
  };

  const perkCount = parsedData ? Object.keys(parsedData).length : 0;

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

          {isParsing ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="w-4 h-4" />
              <span>Чтение файла...</span>
            </div>
          ) : null}

          {parsedData ? (
            <div className="flex flex-col gap-1 p-3 bg-muted rounded-md text-xs">
              <span>
                Определённая кодировка: <span className="font-medium">{encoding}</span>
              </span>
              <span>
                Перков в файле: <span className="font-medium">{perkCount}</span>
              </span>
            </div>
          ) : null}

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
          <Button onClick={handleUpload} disabled={!parsedData || isParsing || isUploading}>
            {isUploading ? 'Загрузка...' : 'Загрузить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
