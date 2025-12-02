import JSZip from 'jszip';
import { useState } from 'react';

import largeNodeBorder from '@/assets/large-node-border.png';
import masterNodeBorder from '@/assets/master-node-border.png';
import smallNodeBorder from '@/assets/small-node-border.png';
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
import { ATLAS_SCALE_FACTOR } from '@/constants';
import { useStore } from '@/store';
import { Connection, ExportData, ExportNode, NodeType } from '@/types';
import { getNodeRadius } from '@/utils/node-helpers';
import { AtlasNode, loadImage, packTextureAtlas } from '@/utils/texture-atlas';

const nodeBorderImages: Record<NodeType, string> = {
  [NodeType.SmallNode]: smallNodeBorder,
  [NodeType.LargeNode]: largeNodeBorder,
  [NodeType.MasterNode]: masterNodeBorder,
};

type ExportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ExportResult = {
  editorDataUrl: string;
  gameFilesZipUrl: string;
};

export const ExportDialog = ({ open, onOpenChange }: ExportDialogProps) => {
  const nodes = useStore((state) => state.nodes);
  const images = useStore((state) => state.images);
  const orbits = useStore((state) => state.orbits);
  const connections = useStore((state) => state.connections);
  const viewport = useStore((state) => state.viewport);
  const gridSettings = useStore((state) => state.gridSettings);
  const webSettings = useStore((state) => state.webSettings);
  const gamePerkIdsSet = useStore((state) => state.gamePerkIdsSet);

  const [errors, setErrors] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);

  const validateData = (): string[] => {
    const validationErrors: string[] = [];

    for (const [nodeId, node] of Object.entries(nodes)) {
      const nodeErrors: string[] = [];

      if (!node.perkId) {
        nodeErrors.push('не выбран перк');
      } else if (!gamePerkIdsSet.has(node.perkId)) {
        nodeErrors.push(`перк "${node.perkId}" не существует`);
      }

      if (!node.title) {
        nodeErrors.push('не указано название');
      }

      if (nodeErrors.length > 0) {
        validationErrors.push(
          `Нода [${node.title || 'Нет имени'}] (${nodeId.slice(0, 8)}): ${nodeErrors.join(', ')}`
        );
      }
    }

    const perkIdMap = new Map<string, string[]>();

    for (const [nodeId, node] of Object.entries(nodes)) {
      if (node.perkId) {
        if (!perkIdMap.has(node.perkId)) {
          perkIdMap.set(node.perkId, []);
        }
        perkIdMap.get(node.perkId)!.push(nodeId);
      }
    }

    for (const [perkId, nodeIds] of perkIdMap.entries()) {
      if (nodeIds.length > 1) {
        const nodeNames = nodeIds
          .map((id) => {
            const node = nodes[id];
            return `[${node.title || 'Нет имени'}] (${id.slice(0, 8)})`;
          })
          .join(', ');

        validationErrors.push(`Перк "${perkId}" используется несколькими нодами: ${nodeNames}`);
      }
    }

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

    for (const node of Object.values(nodes)) {
      const radius = getNodeRadius(node.type);
      minX = Math.min(minX, node.x - radius);
      minY = Math.min(minY, node.y - radius);
      maxX = Math.max(maxX, node.x + radius);
      maxY = Math.max(maxY, node.y + radius);
    }

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

  const generateTextureAtlas = async (): Promise<{
    blob: Blob;
    rects: Map<string, { x: number; y: number; width: number; height: number }>;
  }> => {
    const atlasNodes: AtlasNode[] = [];

    for (const [uid, node] of Object.entries(nodes)) {
      try {
        const borderImage = await loadImage(nodeBorderImages[node.type]);

        const iconImage = node.iconUrl ? await loadImage(node.iconUrl) : null;

        atlasNodes.push({
          uid,
          type: node.type,
          iconUrl: node.iconUrl,
          iconImage,
          borderImage,
        });
      } catch (error) {
        console.error(`Failed to load images for node ${uid}`, error);
      }
    }

    const atlasResult = packTextureAtlas(atlasNodes, 4, 2048, ATLAS_SCALE_FACTOR);

    const blob = await new Promise<Blob>((resolve, reject) => {
      atlasResult.canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to generate blob from canvas'));
        }
      }, 'image/png');
    });

    return {
      blob,
      rects: atlasResult.rects,
    };
  };

  const generateBackgroundImages = async (bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  }): Promise<
    Array<{
      blob: Blob;
      filename: string;
      x: number;
      y: number;
      width: number;
      height: number;
      rotation?: number;
    }>
  > => {
    const backgroundImages: Array<{
      blob: Blob;
      filename: string;
      x: number;
      y: number;
      width: number;
      height: number;
      rotation?: number;
    }> = [];

    let index = 0;
    for (const image of Object.values(images)) {
      if (!image.imageUrl) continue;

      try {
        const img = await loadImage(image.imageUrl);

        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to get canvas context');

        ctx.globalAlpha = image.opacity ?? 1;

        ctx.drawImage(img, 0, 0, image.width, image.height);

        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to generate blob from canvas'));
            }
          }, 'image/png');
        });

        backgroundImages.push({
          blob,
          filename: `background-${index}.png`,
          x: image.x - bounds.x,
          y: image.y - bounds.y,
          width: image.width,
          height: image.height,
          rotation: image.rotation,
        });

        index++;
      } catch (error) {
        console.error(`Failed to load background image: ${image.imageUrl}`, error);
      }
    }

    return backgroundImages;
  };

  const createGameFilesZip = async (
    gameDataBlob: Blob,
    textureAtlasBlob: Blob,
    backgroundImages: Array<{ blob: Blob; filename: string }>
  ): Promise<Blob> => {
    const zip = new JSZip();

    zip.file('game-data.json', gameDataBlob);

    zip.file('node-icons.png', textureAtlasBlob);

    for (const bgImage of backgroundImages) {
      zip.file(bgImage.filename, bgImage.blob);
    }

    return await zip.generateAsync({ type: 'blob' });
  };

  const handleExport = async () => {
    setErrors([]);
    setExportResult(null);

    const validationErrors = validateData();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsExporting(true);

    try {
      const bounds = calculateBounds();

      const { blob: textureAtlasBlob, rects: textureRects } = await generateTextureAtlas();

      const backgroundImages = await generateBackgroundImages(bounds);

      const editorData = {
        nodes,
        images,
        orbits,
        connections,
        viewport,
        gridSettings,
        webSettings,
      };

      const editorDataBlob = new Blob([JSON.stringify(editorData, null, 2)], {
        type: 'application/json',
      });
      const editorDataUrl = URL.createObjectURL(editorDataBlob);

      const uidToPerkIdMap = new Map<string, string>();
      for (const [uid, node] of Object.entries(nodes)) {
        uidToPerkIdMap.set(uid, node.perkId);
      }

      const exportNodes: { [uid: string]: ExportNode } = {};
      for (const [uid, node] of Object.entries(nodes)) {
        const textureRect = textureRects.get(uid);
        if (!textureRect) {
          console.warn(`No texture rect found for node ${uid} - this should not happen`);
          continue;
        }

        exportNodes[node.perkId] = {
          type: node.type,
          title: node.title,
          description: node.description,
          reqDescription: node.reqDescription,
          keywords: node.keywords,
          x: node.x - bounds.x,
          y: node.y - bounds.y,
          skillTree: node.skillTree,
          texture: {
            x: textureRect.x,
            y: textureRect.y,
            width: textureRect.width,
            height: textureRect.height,
          },
        };
      }

      const exportConnections: { [uid: string]: Connection } = {};
      for (const [connectionId, connection] of Object.entries(connections)) {
        const fromPerkId = uidToPerkIdMap.get(connection.fromId);
        const toPerkId = uidToPerkIdMap.get(connection.toId);

        if (!fromPerkId || !toPerkId) {
          console.warn(`Connection ${connectionId} references invalid node IDs`);
          continue;
        }

        exportConnections[connectionId] = {
          fromId: fromPerkId,
          toId: toPerkId,
          curvature: connection.curvature,
        };
      }

      const gameData: ExportData = {
        width: bounds.width,
        height: bounds.height,
        nodes: exportNodes,
        connections: exportConnections,
        backgroundImages: backgroundImages.map((bg) => ({
          filename: bg.filename,
          x: bg.x,
          y: bg.y,
          width: bg.width,
          height: bg.height,
          rotation: bg.rotation,
        })),
      };

      const gameDataBlob = new Blob([JSON.stringify(gameData, null, 2)], {
        type: 'application/json',
      });

      const gameFilesZipBlob = await createGameFilesZip(
        gameDataBlob,
        textureAtlasBlob,
        backgroundImages
      );
      const gameFilesZipUrl = URL.createObjectURL(gameFilesZipBlob);

      setExportResult({
        editorDataUrl,
        gameFilesZipUrl,
      });
    } catch (error) {
      console.error('Export error:', error);
      setErrors(['Произошла ошибка при экспорте данных']);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    if (exportResult) {
      URL.revokeObjectURL(exportResult.editorDataUrl);
      URL.revokeObjectURL(exportResult.gameFilesZipUrl);
    }

    setErrors([]);
    setExportResult(null);
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      if (exportResult) {
        URL.revokeObjectURL(exportResult.editorDataUrl);
        URL.revokeObjectURL(exportResult.gameFilesZipUrl);
      }

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

        <div className="flex flex-col gap-4 py-4 [&_*]:select-text">
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
            <div className="flex flex-col gap-4">
              <p className="text-lg font-medium">Файлы готовы к скачиванию</p>
              <div className="flex flex-col gap-2">
                <span className="text-md font-medium">Для редактора:</span>
                <a
                  href={exportResult.editorDataUrl}
                  download="editor-data.json"
                  className="text-sm text-primary hover:underline"
                >
                  📄 editor-data.json
                </a>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-md font-medium">Для игры:</span>
                <a
                  href={exportResult.gameFilesZipUrl}
                  download="game-files.zip"
                  className="text-sm text-primary hover:underline"
                >
                  📦 game-files.zip
                </a>
              </div>
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
