import { EditorPanel } from '@/components/editor-panel';
import { Viewport } from '@/components/viewport';

export const App = () => (
  <div className="w-screen h-screen overflow-hidden grid grid-cols-[1fr_320px]">
    <Viewport />
    <EditorPanel />
  </div>
);
