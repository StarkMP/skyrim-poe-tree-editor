import { ArrowUp, Download, Trash2 } from 'lucide-react';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { PanelSection } from '../ui/panel-section';

export const SettingsPanel = () => (
  <div className="size-full bg-background border-l flex flex-col gap-3 py-2">
    <div className="text-xs text-center border-b pb-2">Панель управления</div>

    <PanelSection>
      <div className="flex flex-wrap justify-center gap-2">
        <Button size="sm">
          <ArrowUp /> Импорт
        </Button>
        <Button size="sm" variant="secondary" disabled>
          <Download /> Экспорт
        </Button>
        <Button size="sm" variant="destructive" disabled className="p-0 size-6">
          <Trash2 />
        </Button>
      </div>
    </PanelSection>
    <PanelSection>
      <div className="flex flex-col gap-2 w-full">
        <div className="grid grid-cols-[1fr_1fr] items-center gap-4">
          <Label htmlFor="width" className="text-xs">
            Ширина
          </Label>
          <Input disabled id="width" defaultValue={300} />
        </div>
        <div className="grid grid-cols-[1fr_1fr] items-center gap-4">
          <Label htmlFor="height" className="text-xs">
            Высота
          </Label>
          <Input disabled id="height" defaultValue={200} />
        </div>
      </div>
    </PanelSection>
    <PanelSection>
      <span className="text-center text-xs opacity-50">
        Выделите элемент для редактирования или нажмите ПКМ по viewport для создания нового
      </span>
    </PanelSection>
  </div>
);
