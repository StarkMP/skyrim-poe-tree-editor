import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { useStore } from '@/store';
import { EditorNode, NodeType } from '@/types';

type NodeSettingsProps = {
  nodeId: string;
  node: EditorNode;
};

export const NodeSettings = ({ nodeId, node }: NodeSettingsProps) => {
  const { updateNode, gamePerks } = useStore();

  const [iconUrlInput, setIconUrlInput] = useState(node.iconUrl);
  const [iconUrlError, setIconUrlError] = useState('');

  // Update input when node changes
  useEffect(() => {
    setIconUrlInput(node.iconUrl);
    setIconUrlError('');
  }, [nodeId, node.iconUrl]);

  const handleTypeChange = (value: string) => {
    updateNode(nodeId, { type: Number.parseInt(value) as NodeType });
  };

  const handlePerkChange = (perkId: string) => {
    const perk = gamePerks.find((p) => p.id === perkId);
    if (perk) {
      updateNode(nodeId, {
        perkId: perk.id,
        title: perk.name,
        description: perk.description,
        requiredLevel: perk.requiredLevel,
      });
    }
  };

  const handleDescriptionChange = (value: string) => {
    updateNode(nodeId, { description: value });
  };

  const handleRequiredLevelChange = (value: string) => {
    const level = value === '' ? null : Number.parseInt(value);
    if (value === '' || (!Number.isNaN(level) && level !== null && level >= 0)) {
      updateNode(nodeId, { requiredLevel: level });
    }
  };

  const handleKeywordsChange = (value: string) => {
    const keywords = value
      .split('\n')
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

  const validateAndApplyIconUrl = () => {
    const url = iconUrlInput.trim();

    if (!url) {
      setIconUrlError('URL не может быть пустым');
      return;
    }

    try {
      new URL(url);
    } catch {
      setIconUrlError('Некорректный URL');
      return;
    }

    const validExtensions = ['.png', '.jpg', '.jpeg'];
    const hasValidExtension = validExtensions.some((ext) => url.toLowerCase().endsWith(ext));

    if (!hasValidExtension) {
      setIconUrlError('URL должен указывать на изображение (.png, .jpg, .jpeg)');
      return;
    }

    setIconUrlError('');
    updateNode(nodeId, { iconUrl: url });
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

          {/* Perk */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="node-perk" className="text-xs">
              Перк
            </Label>
            <Select value={node.perkId} onValueChange={handlePerkChange}>
              <SelectTrigger id="node-perk" className="h-8 text-xs">
                <SelectValue placeholder="Выберите перк" />
              </SelectTrigger>
              <SelectContent>
                {gamePerks.map((perk) => (
                  <SelectItem key={perk.id} value={perk.id} className="text-xs">
                    {perk.name} ({perk.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Label htmlFor="node-level" className="text-xs">
              Требуемый уровень
            </Label>
            <Input
              id="node-level"
              type="number"
              value={node.requiredLevel ?? ''}
              onChange={(e) => handleRequiredLevelChange(e.target.value)}
              className="h-8 text-xs"
              placeholder="Не указан"
              min="0"
            />
          </div>

          {/* Icon URL */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="node-icon" className="text-xs">
              Ссылка на иконку
            </Label>
            <div className="flex gap-2">
              <Input
                id="node-icon"
                value={iconUrlInput}
                onChange={(e) => {
                  setIconUrlInput(e.target.value);
                  setIconUrlError('');
                }}
                className="h-8 text-xs flex-1"
                placeholder="https://example.com/icon.png"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={validateAndApplyIconUrl}
                className="h-8 text-xs"
              >
                Применить
              </Button>
            </div>
            {iconUrlError ? <span className="text-xs text-destructive">{iconUrlError}</span> : null}
          </div>

          {/* Keywords */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="node-keywords" className="text-xs">
              Ключевые слова
            </Label>
            <Textarea
              id="node-keywords"
              value={node.keywords.join('\n')}
              onChange={(e) => handleKeywordsChange(e.target.value)}
              className="text-xs min-h-[60px]"
              placeholder="Одно ключевое слово на строку"
            />
          </div>
        </div>
      </PanelSection>
    </div>
  );
};
