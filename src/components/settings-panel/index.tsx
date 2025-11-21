/* eslint-disable unicorn/no-nested-ternary */
import { ArrowUp, Download, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { S3CredentialsModal } from '@/components/s3-credentials-modal';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PanelSection } from '@/components/ui/panel-section';
import { useStore } from '@/store';

import { Badge } from '../ui/badge';
import { ConnectionSettings } from './connection-settings';
import { ExportDialog } from './export-dialog';
import { GlobalSettings } from './global-settings';
import { ImageSettings } from './image-settings';
import { ImportDialog } from './import-dialog';
import { NodeSettings } from './node-settings';
import { OrbitSettings } from './orbit-settings';

export const SettingsPanel = () => {
  const {
    selectedElement,
    selectedElements,
    nodes,
    images,
    orbits,
    connections,
    clearAll,
    setS3SecretKey,
  } = useStore();

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [s3KeyDialogOpen, setS3KeyDialogOpen] = useState(false);

  const selectedNode = selectedElement?.type === 'node' ? nodes[selectedElement.id] : null;
  const selectedImage = selectedElement?.type === 'image' ? images[selectedElement.id] : null;
  const selectedOrbit = selectedElement?.type === 'orbit' ? orbits[selectedElement.id] : null;
  const selectedConnection =
    selectedElement?.type === 'connection' ? connections[selectedElement.id] : null;

  const hasElements = Object.keys(nodes).length > 0 || Object.keys(images).length > 0;

  const handleClear = () => {
    clearAll();
    setClearDialogOpen(false);
  };

  const handleChangeS3Key = () => {
    setS3KeyDialogOpen(true);
  };

  const handleS3KeySuccess = (secretKey: string) => {
    setS3SecretKey(secretKey);
    setS3KeyDialogOpen(false);
  };

  const handleS3KeyDialogClose = () => {
    setS3KeyDialogOpen(false);
  };

  return (
    <>
      <div className="size-full bg-background border-l flex flex-col gap-3 py-2">
        <div className="text-xs text-center border-b pb-2">Панель управления</div>

        <PanelSection>
          <div className="flex flex-wrap justify-center gap-2">
            <Button size="sm" onClick={() => setImportDialogOpen(true)}>
              <ArrowUp /> Импорт
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={!hasElements}
              onClick={() => setExportDialogOpen(true)}
            >
              <Download /> Экспорт
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={!hasElements}
              className="p-0 size-6"
              onClick={() => setClearDialogOpen(true)}
            >
              <Trash2 />
            </Button>
          </div>
        </PanelSection>

        <div className="flex-1 relative size-full overflow-y-auto">
          <div className="absolute left-0 top-0 size-full">
            <GlobalSettings onChangeS3Key={handleChangeS3Key} />

            {selectedElements.size > 0 ? (
              <PanelSection>
                <div className="flex flex-col gap-2 items-center">
                  <span className="text-center text-sm font-medium">
                    Выбрано несколько элементов для перемещения
                  </span>
                  <Badge variant="secondary">{selectedElements.size} элементов</Badge>
                  <span className="text-center text-xs opacity-70">
                    Перетащите любой из выбранных элементов, чтобы переместить всю группу
                  </span>
                </div>
              </PanelSection>
            ) : selectedNode && selectedElement ? (
              <NodeSettings nodeId={selectedElement.id} node={selectedNode} />
            ) : selectedImage && selectedElement ? (
              <ImageSettings imageId={selectedElement.id} image={selectedImage} />
            ) : selectedOrbit && selectedElement ? (
              <OrbitSettings orbitId={selectedElement.id} orbit={selectedOrbit} />
            ) : selectedConnection && selectedElement ? (
              <ConnectionSettings
                connectionId={selectedElement.id}
                connection={selectedConnection}
              />
            ) : (
              <PanelSection>
                <span className="text-center text-xs opacity-50">
                  Выделите элемент для редактирования или нажмите ПКМ по viewport для создания
                  нового
                </span>
              </PanelSection>
            )}
          </div>
        </div>
      </div>

      <ImportDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />
      <ExportDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen} />

      {/* S3 Key change dialog */}
      <S3CredentialsModal open={s3KeyDialogOpen} onSuccess={handleS3KeySuccess} allowClose={true} />

      {/* Clear confirmation dialog */}
      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение очистки</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите очистить всю ветку? Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearDialogOpen(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleClear}>
              Очистить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
