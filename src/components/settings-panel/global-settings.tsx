import { Key } from 'lucide-react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PanelSection } from '@/components/ui/panel-section';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  WEB_MAX_CONCENTRIC_CIRCLES,
  WEB_MAX_INNER_RADIUS,
  WEB_MAX_SIZE,
  WEB_MAX_SPOKES,
  WEB_MIN_CONCENTRIC_CIRCLES,
  WEB_MIN_INNER_RADIUS,
  WEB_MIN_SIZE,
  WEB_MIN_SPOKES,
} from '@/constants';
import { useStore } from '@/store';

type GlobalSettingsProps = {
  onChangeS3Key: () => void;
};

export const GlobalSettings = ({ onChangeS3Key }: GlobalSettingsProps) => {
  const {
    gridSettings,
    updateGridSettings,
    webSettings,
    updateWebSettings,
    globalSettingsExpanded,
    setGlobalSettingsExpanded,
  } = useStore();

  const handleValueChange = (value: string) => {
    setGlobalSettingsExpanded(value === 'global-settings');
  };

  return (
    <PanelSection className="mb-3">
      <Accordion
        type="single"
        collapsible
        value={globalSettingsExpanded ? 'global-settings' : ''}
        onValueChange={handleValueChange}
      >
        <AccordionItem value="global-settings" className="border-none">
          <AccordionTrigger className="py-0 font-medium [&[data-state=open]]:pb-3">
            Глобальные настройки
          </AccordionTrigger>
          <AccordionContent className="pb-0">
            <div className="flex flex-col gap-4 w-full">
              <Button
                size="sm"
                variant="outline"
                onClick={onChangeS3Key}
                className="w-full text-xs"
              >
                <Key className="w-3 h-3" /> Изменить ключ S3
              </Button>

              <div className="flex w-full items-center justify-between">
                <Label htmlFor="positioning-grid" className="text-xs">
                  Сетка позиционирования
                </Label>
                <Switch
                  id="positioning-grid"
                  checked={gridSettings.enabled}
                  onCheckedChange={(checked) => updateGridSettings({ enabled: checked })}
                />
              </div>
              <div
                className="flex flex-col gap-3"
                style={{
                  pointerEvents: gridSettings.enabled ? 'auto' : 'none',
                  opacity: gridSettings.enabled ? 1 : 0.5,
                }}
              >
                <div className="flex items-center gap-4 justify-between">
                  <Label htmlFor="grid-size" className="text-xs">
                    Размер ячейки
                  </Label>
                  <Badge variant="secondary">{gridSettings.size}px</Badge>
                </div>
                <Slider
                  id="grid-size"
                  value={[gridSettings.size]}
                  onValueChange={(value) => updateGridSettings({ size: value[0] })}
                  max={200}
                  min={60}
                  step={20}
                />
                <div className="flex items-center gap-4 justify-between">
                  <Label htmlFor="grid-rotation" className="text-xs">
                    Поворот сетки
                  </Label>
                  <Badge variant="secondary">{gridSettings.rotation}°</Badge>
                </div>
                <Slider
                  className="mb-2"
                  id="grid-rotation"
                  value={[gridSettings.rotation]}
                  onValueChange={(value) => updateGridSettings({ rotation: value[0] })}
                  max={360}
                  min={0}
                  step={5}
                />
              </div>

              <div className="flex w-full items-center justify-between mt-2">
                <Label htmlFor="web-layer" className="text-xs">
                  Сетка эскиза (паутина)
                </Label>
                <Switch
                  id="web-layer"
                  checked={webSettings.enabled}
                  onCheckedChange={(checked) => updateWebSettings({ enabled: checked })}
                />
              </div>
              <div
                className="flex flex-col gap-3"
                style={{
                  pointerEvents: webSettings.enabled ? 'auto' : 'none',
                  opacity: webSettings.enabled ? 1 : 0.5,
                }}
              >
                <div className="flex items-center gap-4 justify-between">
                  <Label htmlFor="web-size" className="text-xs">
                    Размер эскиза
                  </Label>
                  <Badge variant="secondary">{webSettings.size}px</Badge>
                </div>
                <Slider
                  id="web-size"
                  value={[webSettings.size]}
                  onValueChange={(value) => updateWebSettings({ size: value[0] })}
                  max={WEB_MAX_SIZE}
                  min={WEB_MIN_SIZE}
                  step={500}
                />
                <div className="flex items-center gap-4 justify-between">
                  <Label htmlFor="web-spokes" className="text-xs">
                    Количество лучей
                  </Label>
                  <Badge variant="secondary">{webSettings.spokes}</Badge>
                </div>
                <Slider
                  id="web-spokes"
                  value={[webSettings.spokes]}
                  onValueChange={(value) => updateWebSettings({ spokes: value[0] })}
                  max={WEB_MAX_SPOKES}
                  min={WEB_MIN_SPOKES}
                  step={1}
                />
                <div className="flex items-center gap-4 justify-between">
                  <Label htmlFor="web-rotation" className="text-xs">
                    Поворот эскиза
                  </Label>
                  <Badge variant="secondary">{webSettings.rotation}°</Badge>
                </div>
                <Slider
                  id="web-rotation"
                  value={[webSettings.rotation]}
                  onValueChange={(value) => updateWebSettings({ rotation: value[0] })}
                  max={360}
                  min={0}
                  step={1}
                />
                <div className="flex items-center gap-4 justify-between">
                  <Label htmlFor="web-concentric-circles" className="text-xs">
                    Количество окружностей
                  </Label>
                  <Badge variant="secondary">{webSettings.concentricCircles}</Badge>
                </div>
                <Slider
                  id="web-concentric-circles"
                  value={[webSettings.concentricCircles]}
                  onValueChange={(value) => updateWebSettings({ concentricCircles: value[0] })}
                  max={WEB_MAX_CONCENTRIC_CIRCLES}
                  min={WEB_MIN_CONCENTRIC_CIRCLES}
                  step={1}
                />
                <div className="flex items-center gap-4 justify-between">
                  <Label htmlFor="web-inner-radius" className="text-xs">
                    Внутренний круг
                  </Label>
                  <Badge variant="secondary">{webSettings.innerRadius}px</Badge>
                </div>
                <Slider
                  className="mb-2"
                  id="web-inner-radius"
                  value={[webSettings.innerRadius]}
                  onValueChange={(value) => updateWebSettings({ innerRadius: value[0] })}
                  max={WEB_MAX_INNER_RADIUS}
                  min={WEB_MIN_INNER_RADIUS}
                  step={100}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </PanelSection>
  );
};
