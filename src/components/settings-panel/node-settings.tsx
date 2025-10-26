import { useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ComboboxOption } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PanelSection } from '@/components/ui/panel-section';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { VirtualizedCombobox } from '@/components/ui/virtualized-combobox';
import { NODE_RADIUS_LARGE, NODE_RADIUS_MASTER, NODE_RADIUS_SMALL } from '@/constants';
import { useStore } from '@/store';
import { EditorNode, NodeType } from '@/types';
import { uploadIconToS3 } from '@/utils/s3-upload';

type NodeSettingsProps = {
  nodeId: string;
  node: EditorNode;
};

export const NodeSettings = ({ nodeId, node }: NodeSettingsProps) => {
  // Optimized selectors - only subscribe to what we need
  const updateNode = useStore((state) => state.updateNode);
  const gamePerks = useStore((state) => state.gamePerks);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [keywordsInput, setKeywordsInput] = useState(node.keywords.join(', '));
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Memoize perk options to avoid recreating on every render
  const perkOptions = useMemo<ComboboxOption[]>(
    () =>
      Object.entries(gamePerks).map(([id, perk]) => ({
        value: id,
        label: `${perk.name} (${id})`,
        searchText: `${perk.name} ${id}`.toLowerCase(),
      })),
    [gamePerks]
  );

  // Update input when node changes
  useEffect(() => {
    setSelectedFile(null);
    setUploadError('');
    setKeywordsInput(node.keywords.join(', '));
  }, [nodeId]);

  const handleTypeChange = (value: string) => {
    const newType = Number.parseInt(value) as NodeType;
    // Reset icon when changing node type
    updateNode(nodeId, { type: newType, iconUrl: '' });
  };

  // Get required icon size based on node type
  const getRequiredIconSize = (nodeType: NodeType): number => {
    switch (nodeType) {
      case NodeType.SmallNode: {
        return NODE_RADIUS_SMALL * 2;
      }
      case NodeType.LargeNode: {
        return NODE_RADIUS_LARGE * 2;
      }
      case NodeType.MasterNode: {
        return NODE_RADIUS_MASTER * 2;
      }
      default: {
        return NODE_RADIUS_SMALL * 2;
      }
    }
  };

  const handlePerkChange = (perkId: string) => {
    const perk = gamePerks[perkId];

    if (perk) {
      updateNode(nodeId, {
        perkId: perkId,
        title: perk.name,
        description: perk.description,
      });
    }
  };

  const handleDescriptionChange = (value: string) => {
    updateNode(nodeId, { description: value });
  };

  const handleReqDescriptionChange = (value: string) => {
    updateNode(nodeId, { reqDescription: value });
  };

  const handleKeywordsChange = (value: string) => {
    setKeywordsInput(value);

    // Разбиваем по запятым и/или новым строкам
    const keywords = value
      .split(/[,\n]+/)
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    updateNode(nodeId, { keywords });
  };

  const handleXChange = (value: string) => {
    const x = Number.parseFloat(value);
    if (!Number.isNaN(x)) {
      updateNode(nodeId, { x });
    }
  };

  const handleYChange = (value: string) => {
    const y = Number.parseFloat(value);
    if (!Number.isNaN(y)) {
      updateNode(nodeId, { y });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadError('');
    }
  };

  const handleUploadIcon = async () => {
    if (!selectedFile) {
      setUploadError('Выберите файл для загрузки');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const requiredSize = getRequiredIconSize(node.type);
      const iconUrl = await uploadIconToS3(selectedFile, {
        requiredWidth: requiredSize,
        requiredHeight: requiredSize,
      });
      updateNode(nodeId, { iconUrl });
      setSelectedFile(null);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Ошибка при загрузке файла');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <PanelSection title="Нода" className="border-none">
        <div className="flex flex-col gap-3">
          {/* Type */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="node-type" className="text-xs">
              Тип
            </Label>
            <Select value={node.type.toString()} onValueChange={handleTypeChange}>
              <SelectTrigger id="node-type" className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NodeType.SmallNode.toString()}>Малая нода</SelectItem>
                <SelectItem value={NodeType.LargeNode.toString()}>Большая нода</SelectItem>
                <SelectItem value={NodeType.MasterNode.toString()}>Мастер нода</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full grid grid-cols-2 gap-2">
            {/* Position X */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="node-x" className="text-xs">
                X
              </Label>
              <Input
                id="node-x"
                type="number"
                value={Math.round(node.x)}
                onChange={(e) => handleXChange(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            {/* Position Y */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="node-y" className="text-xs">
                Y
              </Label>
              <Input
                id="node-y"
                type="number"
                value={Math.round(node.y)}
                onChange={(e) => handleYChange(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Perk - Using Combobox with search for better performance */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="node-perk" className="text-xs">
              Перк
            </Label>
            <VirtualizedCombobox
              options={perkOptions}
              value={node.perkId}
              onValueChange={handlePerkChange}
              placeholder="Выберите перк"
              searchPlaceholder="Поиск перка..."
              emptyText="Перк не найден"
              className="h-8 text-xs"
              height="300px"
            />
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="node-title" className="text-xs">
              Название
            </Label>
            <Input
              id="node-title"
              value={node.title}
              disabled
              className="h-8 text-xs"
              placeholder="Выберите перк"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="node-description" className="text-xs">
              Описание
            </Label>
            <Textarea
              id="node-description"
              value={node.description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              className="text-xs min-h-[60px]"
              placeholder="Выберите перк или введите описание"
            />
          </div>

          {/* Required Level */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="node-requirements" className="text-xs">
              Требования
            </Label>
            <Textarea
              id="node-requirements"
              value={node.reqDescription}
              onChange={(e) => handleReqDescriptionChange(e.target.value)}
              className="text-xs min-h-[60px]"
              placeholder="Введите требования для активации ноды"
            />
          </div>

          {/* Icon Upload */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="node-icon" className="text-xs">
              Иконка (требуется {getRequiredIconSize(node.type)}x{getRequiredIconSize(node.type)}px)
            </Label>
            {/* Current icon preview */}
            {node.iconUrl && node.iconUrl.length > 0 ? (
              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                <img
                  src={node.iconUrl}
                  alt="Current icon"
                  className="w-8 h-8 object-contain rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <span className="text-xs text-muted-foreground truncate flex-1">
                  Текущая иконка загружена
                </span>
              </div>
            ) : null}
            {/* File input */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  ref={fileInputRef}
                  id="node-icon"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                  className="h-8 text-xs cursor-pointer"
                />
                {selectedFile ? (
                  <span className="text-xs text-muted-foreground mt-1 block">
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                ) : null}
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleUploadIcon}
                disabled={!selectedFile || isUploading}
                className="h-8 text-xs min-w-[100px]"
              >
                {isUploading ? (
                  <>
                    <Spinner className="w-3 h-3 mr-1" />
                    Загрузка...
                  </>
                ) : (
                  'Загрузить'
                )}
              </Button>
            </div>
            {uploadError ? <span className="text-xs text-destructive">{uploadError}</span> : null}
          </div>

          {/* Keywords */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="node-keywords" className="text-xs">
              Ключевые слова
            </Label>
            <Textarea
              id="node-keywords"
              value={keywordsInput}
              onChange={(e) => handleKeywordsChange(e.target.value)}
              className="text-xs min-h-[60px]"
              placeholder="Ключевые слова через запятую"
            />
          </div>
        </div>
      </PanelSection>
    </div>
  );
};
