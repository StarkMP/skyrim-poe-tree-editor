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
import { Spinner } from '@/components/ui/spinner';
import { useStore } from '@/store';
import { ExportData, ExportNode } from '@/types';
import { getNodeRadius } from '@/utils/node-helpers';

type ExportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ExportResult = {
  editorDataUrl: string;
  gameDataUrl: string;
  nodeIconsUrl: string;
  backgroundUrl: string;
};

export const ExportDialog = ({ open, onOpenChange }: ExportDialogProps) => {
  const nodes = useStore((state) => state.nodes);
  const images = useStore((state) => state.images);
  const gamePerks = useStore((state) => state.gamePerks);

  const [errors, setErrors] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);

  const validateData = (): string[] => {
    const validationErrors: string[] = [];
    const gamePerkIds = new Set(gamePerks.map((p) => p.id));

    // Validate nodes - group errors by node
    for (const [nodeId, node] of Object.entries(nodes)) {
      const nodeErrors: string[] = [];

      if (!node.perkId) {
        nodeErrors.push('не выбран перк');
      } else if (!gamePerkIds.has(node.perkId)) {
        nodeErrors.push(`перк "${node.perkId}" не существует`);
      }

      if (!node.iconUrl) {
        nodeErrors.push('не указана иконка');
      }

      if (!node.title) {
        nodeErrors.push('не указано название');
      }

      if (nodeErrors.length > 0) {
        validationErrors.push(`Нода ${nodeId.slice(0, 8)}: ${nodeErrors.join(', ')}`);
      }
    }

    // Validate images - group errors by image
    for (const [imageId, image] of Object.entries(images)) {
      const imageErrors: string[] = [];

      if (!image.imageUrl) {
        imageErrors.push('не указан URL изображения');
      }

      if (imageErrors.length > 0) {
        validationErrors.push(`Изображение ${imageId.slice(0, 8)}: ${imageErrors.join(', ')}`);
      }
    }

    return validationErrors;
  };

  const calculateBounds = () => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    // Consider nodes with their radii
    for (const node of Object.values(nodes)) {
      const radius = getNodeRadius(node.type);
      minX = Math.min(minX, node.x - radius);
      minY = Math.min(minY, node.y - radius);
      maxX = Math.max(maxX, node.x + radius);
      maxY = Math.max(maxY, node.y + radius);
    }

    // Consider images
    for (const image of Object.values(images)) {
      minX = Math.min(minX, image.x);
      minY = Math.min(minY, image.y);
      maxX = Math.max(maxX, image.x + image.width);
      maxY = Math.max(maxY, image.y + image.height);
    }

    const padding = 50;

    return {
      x: minX - padding,
      y: minY - padding,
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2,
    };
  };

  const loadImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });

  const generateNodeIconsImage = async (bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  }): Promise<string> => {
    const canvas = document.createElement('canvas');
    canvas.width = bounds.width;
    canvas.height = bounds.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    // Load all node icons
    for (const node of Object.values(nodes)) {
      if (!node.iconUrl) continue;

      try {
        const img = await loadImage(node.iconUrl);
        const radius = getNodeRadius(node.type);
        const x = node.x - bounds.x;
        const y = node.y - bounds.y;

        // Draw circular clipped icon
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
        ctx.restore();
      } catch (error) {
        console.error(`Failed to load icon for node: ${node.iconUrl}`, error);
      }
    }

    return canvas.toDataURL('image/png');
  };

  const generateBackgroundImage = async (bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  }): Promise<string> => {
    const canvas = document.createElement('canvas');
    canvas.width = bounds.width;
    canvas.height = bounds.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    // Load all background images
    for (const image of Object.values(images)) {
      if (!image.imageUrl) continue;

      try {
        const img = await loadImage(image.imageUrl);
        const x = image.x - bounds.x;
        const y = image.y - bounds.y;

        ctx.drawImage(img, x, y, image.width, image.height);
      } catch (error) {
        console.error(`Failed to load background image: ${image.imageUrl}`, error);
      }
    }

    return canvas.toDataURL('image/png');
  };

  const handleExport = async () => {
    setErrors([]);
    setExportResult(null);

    // Validate
    const validationErrors = validateData();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsExporting(true);

    try {
      // Calculate bounds
      const bounds = calculateBounds();

      // Generate editor-data.json
      const editorData = {
        nodes,
        images,
      };
      const editorDataBlob = new Blob([JSON.stringify(editorData, null, 2)], {
        type: 'application/json',
      });
      const editorDataUrl = URL.createObjectURL(editorDataBlob);

      // Generate game-data.json
      const exportNodes: { [uid: string]: ExportNode } = {};
      for (const [uid, node] of Object.entries(nodes)) {
        exportNodes[uid] = {
          type: node.type,
          perkId: node.perkId,
          title: node.title,
          description: node.description,
          requiredLevel: node.requiredLevel,
          keywords: node.keywords,
          x: node.x - bounds.x,
          y: node.y - bounds.y,
          connections: node.connections,
        };
      }

      const gameData: ExportData = {
        width: bounds.width,
        height: bounds.height,
        nodes: exportNodes,
      };
      const gameDataBlob = new Blob([JSON.stringify(gameData, null, 2)], {
        type: 'application/json',
      });
      const gameDataUrl = URL.createObjectURL(gameDataBlob);

      // Generate node-icons.png
      const nodeIconsDataUrl = await generateNodeIconsImage(bounds);
      const nodeIconsBlob = await (await fetch(nodeIconsDataUrl)).blob();
      const nodeIconsUrl = URL.createObjectURL(nodeIconsBlob);

      // Generate background.png
      const backgroundDataUrl = await generateBackgroundImage(bounds);
      const backgroundBlob = await (await fetch(backgroundDataUrl)).blob();
      const backgroundUrl = URL.createObjectURL(backgroundBlob);

      setExportResult({
        editorDataUrl,
        gameDataUrl,
        nodeIconsUrl,
        backgroundUrl,
      });
    } catch (error) {
      console.error('Export error:', error);
      setErrors(['Произошла ошибка при экспорте данных']);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    // Revoke URLs to free memory
    if (exportResult) {
      URL.revokeObjectURL(exportResult.editorDataUrl);
      URL.revokeObjectURL(exportResult.gameDataUrl);
      URL.revokeObjectURL(exportResult.nodeIconsUrl);
      URL.revokeObjectURL(exportResult.backgroundUrl);
    }

    setErrors([]);
    setExportResult(null);
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Revoke URLs to free memory
      if (exportResult) {
        URL.revokeObjectURL(exportResult.editorDataUrl);
        URL.revokeObjectURL(exportResult.gameDataUrl);
        URL.revokeObjectURL(exportResult.nodeIconsUrl);
        URL.revokeObjectURL(exportResult.backgroundUrl);
      }

      // Reset state when closing
      setErrors([]);
      setExportResult(null);
      setIsExporting(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Экспорт ветки умений</DialogTitle>
          <DialogDescription>
            Экспортируйте вашу ветку умений для использования в игре.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {errors.length > 0 ? (
            <div className="flex flex-col gap-1 p-3 bg-destructive/10 border border-destructive rounded-md">
              <p className="text-sm font-medium text-destructive mb-2">
                Обнаружены ошибки валидации:
              </p>
              {errors.map((error, index) => (
                <p key={index} className="text-xs text-destructive">
                  • {error}
                </p>
              ))}
            </div>
          ) : null}

          {isExporting ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Spinner />
              <p className="text-sm text-muted-foreground">Генерация файлов...</p>
            </div>
          ) : null}

          {exportResult ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium mb-2">Файлы готовы к скачиванию:</p>
              <a
                href={exportResult.editorDataUrl}
                download="editor-data.json"
                className="text-sm text-primary hover:underline"
              >
                📄 editor-data.json
              </a>
              <a
                href={exportResult.gameDataUrl}
                download="game-data.json"
                className="text-sm text-primary hover:underline"
              >
                📄 game-data.json
              </a>
              <a
                href={exportResult.nodeIconsUrl}
                download="node-icons.png"
                className="text-sm text-primary hover:underline"
              >
                🖼️ node-icons.png
              </a>
              <a
                href={exportResult.backgroundUrl}
                download="background.png"
                className="text-sm text-primary hover:underline"
              >
                🖼️ background.png
              </a>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isExporting}>
            {exportResult ? 'Закрыть' : 'Отмена'}
          </Button>
          {exportResult ? null : (
            <Button onClick={handleExport} disabled={isExporting || errors.length > 0}>
              Начать экспорт
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
