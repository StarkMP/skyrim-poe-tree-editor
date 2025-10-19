import { useEffect } from 'react';

import { ElementsPanel } from '@/components/elements-panel';
import { SettingsPanel } from '@/components/settings-panel';
import { Viewport } from '@/components/viewport';
import { useStore } from '@/store';

export const App = () => {
  const { undo, canUndo } = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if focus is on an input element
      const target = e.target as HTMLElement;
      const isInputFocused =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Don't handle undo if input is focused
      if (isInputFocused) return;

      // Ctrl+Z or Cmd+Z for undo
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

  return (
    <div className="w-screen h-screen overflow-hidden grid grid-cols-[300px_1fr_300px]">
      <ElementsPanel />
      <Viewport />
      <SettingsPanel />
    </div>
  );
};
