import { useEffect, useState } from 'react';

import { ElementsPanel } from '@/components/elements-panel';
import { S3CredentialsModal } from '@/components/s3-credentials-modal';
import { SettingsPanel } from '@/components/settings-panel';
import { Stage } from '@/components/viewport';
import { useStore } from '@/store';

export const App = () => {
  const undo = useStore(({ undo }) => undo);
  const canUndo = useStore(({ canUndo }) => canUndo);
  const isS3KeyValid = useStore(({ isS3KeyValid }) => isS3KeyValid);
  const setS3SecretKey = useStore(({ setS3SecretKey }) => setS3SecretKey);
  const [showS3Modal, setShowS3Modal] = useState(!isS3KeyValid);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (isInputFocused) return;

      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo()) {
          undo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, canUndo]);

  const handleS3KeySuccess = (secretKey: string) => {
    setS3SecretKey(secretKey);
    setShowS3Modal(false);
  };

  return (
    <>
      <div className="w-screen h-screen overflow-hidden grid grid-cols-[300px_1fr_300px]">
        <ElementsPanel />
        <Stage />
        <SettingsPanel />
      </div>

      <S3CredentialsModal open={showS3Modal} onSuccess={handleS3KeySuccess} />
    </>
  );
};
