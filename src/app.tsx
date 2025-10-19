import { ElementsPanel } from '@/components/elements-panel';
import { SettingsPanel } from '@/components/settings-panel';
import { Viewport } from '@/components/viewport';

export const App = () => (
  <div className="w-screen h-screen overflow-hidden grid grid-cols-[300px_1fr_300px]">
    <ElementsPanel />
    <Viewport />
    <SettingsPanel />
  </div>
);
