import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PanelSection } from '@/components/ui/panel-section';
import { Slider } from '@/components/ui/slider';
import { useStore } from '@/store';
import { Connection } from '@/types';

type ConnectionSettingsProps = {
  connectionId: string;
  connection: Connection;
};

export const ConnectionSettings = ({ connectionId, connection }: ConnectionSettingsProps) => {
  const { updateConnection, removeConnection, nodes } = useStore();

  const fromNode = nodes[connection.fromId];
  const toNode = nodes[connection.toId];

  const handleCurvatureChange = (value: number[]) => {
    updateConnection(connectionId, { curvature: value[0] });
  };

  const handleDelete = () => {
    removeConnection(connectionId);
  };

  return (
    <PanelSection title="Соединение" className="border-none">
      <div className="flex flex-col gap-4">
        {/* Connection info */}
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground">От:</span>
            <span className="font-medium">
              {fromNode?.title || 'Неизвестная нода'} ({connection.fromId.slice(0, 8)})
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground">К:</span>
            <span className="font-medium">
              {toNode?.title || 'Неизвестная нода'} ({connection.toId.slice(0, 8)})
            </span>
          </div>
        </div>

        {/* Curvature slider */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="connection-curvature" className="text-xs">
              Изогнутость
            </Label>
            <Badge variant="secondary">{connection.curvature}</Badge>
          </div>
          <Slider
            id="connection-curvature"
            value={[connection.curvature]}
            onValueChange={handleCurvatureChange}
            min={-300}
            max={300}
            step={5}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>← Влево</span>
            <span>Прямая (0)</span>
            <span>Вправо →</span>
          </div>
        </div>

        {/* Delete button */}
        <Button variant="destructive" size="sm" onClick={handleDelete} className="w-full">
          Удалить соединение
        </Button>
      </div>
    </PanelSection>
  );
};
