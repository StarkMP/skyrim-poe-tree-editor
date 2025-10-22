import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PanelSection } from '@/components/ui/panel-section';
import { Slider } from '@/components/ui/slider';
import {
  ORBIT_MAX_POINTS,
  ORBIT_MAX_RADIUS,
  ORBIT_MIN_POINTS,
  ORBIT_MIN_RADIUS,
} from '@/constants';
import { useStore } from '@/store';
import { PositionOrbit } from '@/types';

type OrbitSettingsProps = {
  orbitId: string;
  orbit: PositionOrbit;
};

export const OrbitSettings = ({ orbitId, orbit }: OrbitSettingsProps) => {
  const { updateOrbit } = useStore();

  const handleRadiusChange = (value: number[]) => {
    updateOrbit(orbitId, { radius: value[0] });
  };

  const handlePointCountChange = (value: number[]) => {
    updateOrbit(orbitId, { pointCount: value[0] });
  };

  const handleRotationChange = (value: number[]) => {
    updateOrbit(orbitId, { rotation: value[0] });
  };

  const handleXChange = (value: string) => {
    const x = Number.parseFloat(value);
    if (!Number.isNaN(x)) {
      updateOrbit(orbitId, { x });
    }
  };

  const handleYChange = (value: string) => {
    const y = Number.parseFloat(value);
    if (!Number.isNaN(y)) {
      updateOrbit(orbitId, { y });
    }
  };

  return (
    <PanelSection title="Орбита позиций" className="border-none">
      <div className="flex flex-col gap-4">
        <div className="w-full grid grid-cols-2 gap-2">
          {/* Position X */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="orbit-x" className="text-xs">
              X
            </Label>
            <Input
              id="orbit-x"
              type="number"
              value={Math.round(orbit.x)}
              onChange={(e) => handleXChange(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* Position Y */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="orbit-y" className="text-xs">
              Y
            </Label>
            <Input
              id="orbit-y"
              type="number"
              value={Math.round(orbit.y)}
              onChange={(e) => handleYChange(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="orbit-radius" className="text-xs">
              Радиус орбиты
            </Label>
            <Badge variant="secondary">{orbit.radius}px</Badge>
          </div>
          <Slider
            id="orbit-radius"
            value={[orbit.radius]}
            onValueChange={handleRadiusChange}
            min={ORBIT_MIN_RADIUS}
            max={ORBIT_MAX_RADIUS}
            step={10}
          />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="orbit-points" className="text-xs">
              Количество точек
            </Label>
            <Badge variant="secondary">{orbit.pointCount}</Badge>
          </div>
          <Slider
            id="orbit-points"
            value={[orbit.pointCount]}
            onValueChange={handlePointCountChange}
            min={ORBIT_MIN_POINTS}
            max={ORBIT_MAX_POINTS}
            step={1}
          />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="orbit-rotation" className="text-xs">
              Поворот
            </Label>
            <Badge variant="secondary">{orbit.rotation || 0}°</Badge>
          </div>
          <Slider
            id="orbit-rotation"
            value={[orbit.rotation || 0]}
            onValueChange={handleRotationChange}
            min={0}
            max={360}
            step={1}
          />
        </div>
      </div>
    </PanelSection>
  );
};
