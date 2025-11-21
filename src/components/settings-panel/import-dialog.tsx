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
import { useStore } from '@/store';
import { EditorData } from '@/types';

type ImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const ImportDialog = ({ open, onOpenChange }: ImportDialogProps) => {
  const gamePerkIdsSet = useStore((state) => state.gamePerkIdsSet);
  const importData = useStore((state) => state.importData);

  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setErrors([]);
    }
  };

  const validateAndImport = async () => {
    if (!file) {
      setErrors(['Выберите файл для импорта']);
      return;
    }

    setIsValidating(true);
    setErrors([]);

    try {
      const text = await file.text();
      const data = JSON.parse(text) as EditorData;

      const validationErrors: string[] = [];

      if (!data.nodes || typeof data.nodes !== 'object') {
        validationErrors.push('Некорректная структура данных: отсутствует поле nodes');
      }

      if (!data.images || typeof data.images !== 'object') {
        validationErrors.push('Некорректная структура данных: отсутствует поле images');
      }

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setIsValidating(false);
        return;
      }

      const missingPerks: string[] = [];

      for (const [nodeId, node] of Object.entries(data.nodes)) {
        if (node.perkId && !gamePerkIdsSet.has(node.perkId)) {
          missingPerks.push(`Нода ${nodeId.slice(0, 8)}: перк "${node.perkId}" не найден`);
        }
      }

      if (missingPerks.length > 0) {
        setErrors([
          'Обнаружены перки, которых нет в текущем списке:',
          ...missingPerks,
          '',
          'Пожалуйста, обновите данные или используйте другой файл.',
        ]);
        setIsValidating(false);
        return;
      }

      importData(data);
      setFile(null);
      setErrors([]);
      onOpenChange(false);
    } catch (error) {
      if (error instanceof SyntaxError) {
        setErrors(['Ошибка парсинга JSON: файл поврежден или имеет неверный формат']);
      } else {
        setErrors(['Произошла ошибка при импорте данных']);
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setErrors([]);
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setFile(null);
      setErrors([]);
      setIsValidating(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Импорт ветки умений</DialogTitle>
          <DialogDescription>
            Загрузите JSON-файл для импорта ранее экспортированной ветки.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="import-file">Файл editor-data.json</Label>
            <Input
              id="import-file"
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
          </div>

          {errors.length > 0 ? (
            <div className="flex flex-col gap-1 p-3 bg-destructive/10 border border-destructive rounded-md [&_*]:select-text">
              {errors.map((error, index) => (
                <p key={index} className="text-xs text-destructive">
                  {error}
                </p>
              ))}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isValidating}>
            Отмена
          </Button>
          <Button onClick={validateAndImport} disabled={!file || isValidating}>
            {isValidating ? 'Проверка...' : 'Импортировать'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
