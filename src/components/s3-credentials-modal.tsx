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
import { saveSecretKey, validateSecretKey } from '@/utils/s3-credentials';

type S3CredentialsModalProps = {
  open: boolean;
  onSuccess: (secretKey: string) => void;
  allowClose?: boolean;
};

export const S3CredentialsModal = ({
  open,
  onSuccess,
  allowClose = false,
}: S3CredentialsModalProps) => {
  const [secretKey, setSecretKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  const handleValidateAndSave = async () => {
    if (!secretKey.trim()) {
      setError('Введите Secret Access Key');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      const isValid = await validateSecretKey(secretKey.trim());

      if (isValid) {
        saveSecretKey(secretKey.trim());

        onSuccess(secretKey.trim());

        setSecretKey('');
      } else {
        setError('Неверный ключ доступа. Проверьте правильность ввода.');
      }
    } catch (error_) {
      setError('Ошибка при проверке ключа. Попробуйте еще раз.');
      console.error('Validation error:', error_);
    } finally {
      setIsValidating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isValidating) {
      handleValidateAndSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={allowClose ? () => onSuccess('') : () => {}}>
      <DialogContent
        className="sm:max-w-[500px]"
        onPointerDownOutside={(e) => {
          if (!allowClose) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (!allowClose) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Требуется ключ доступа к S3</DialogTitle>
          <DialogDescription>
            Для загрузки изображений необходимо ввести Secret Access Key от Cloudflare R2
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="secret-key">Secret Access Key</Label>
            <Input
              id="secret-key"
              type="password"
              value={secretKey}
              onChange={(e) => {
                setSecretKey(e.target.value);
                setError('');
              }}
              onKeyDown={handleKeyDown}
              placeholder="Введите ваш Secret Access Key"
              disabled={isValidating}
            />
            {error ? <span className="text-xs text-destructive">{error}</span> : null}
          </div>

          {isValidating ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="w-4 h-4" />
              <span>Проверка ключа...</span>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button onClick={handleValidateAndSave} disabled={isValidating || !secretKey.trim()}>
            {isValidating ? 'Проверка...' : 'Проверить и сохранить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
