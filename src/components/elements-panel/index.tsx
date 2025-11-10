import { Hexagon, Image, Orbit, Search, Trash2 } from 'lucide-react';
import List from 'rc-virtual-list';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useStore } from '@/store';

const iconByType = {
  node: <Hexagon size={16} />,
  image: <Image size={16} />,
  orbit: <Orbit size={16} />,
} as const;

export const ElementsPanel = () => {
  const {
    nodes,
    images,
    orbits,
    selectedElement,
    selectElement,
    deleteNode,
    deleteImage,
    deleteOrbit,
    requestCenterOnElement,
  } = useStore();
  const parentRef = useRef<HTMLDivElement | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  const elements: Array<{
    id: string;
    type: 'node' | 'image' | 'orbit';
    label: string;
    perkId?: string;
  }> = [
    ...Object.entries(nodes).map(([id, node]) => ({
      id,
      type: 'node' as const,
      label: `${node.title || 'Нет имени'} (${id.slice(0, 8)})`,
      perkId: node.perkId,
    })),
    ...Object.keys(images).map((id) => ({
      id,
      type: 'image' as const,
      label: `Изображение (${id.slice(0, 8)})`,
    })),
    ...Object.keys(orbits).map((id) => ({
      id,
      type: 'orbit' as const,
      label: `Орбита позиций (${id.slice(0, 8)})`,
    })),
  ];

  const filteredElements = elements.filter((element) => {
    const query = searchQuery.toLowerCase();
    const matchesLabel = element.label.toLowerCase().includes(query);
    const matchesPerkId = element.perkId?.toLowerCase().includes(query) ?? false;
    return matchesLabel || matchesPerkId;
  });

  const handleCenterOnElement = (id: string, type: 'node' | 'image' | 'orbit') => {
    selectElement(id, type);
    requestCenterOnElement(id, type);
  };

  const handleDelete = (id: string, type: 'node' | 'image' | 'orbit') => {
    if (type === 'node') {
      deleteNode(id);
    } else if (type === 'image') {
      deleteImage(id);
    } else {
      deleteOrbit(id);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="size-full bg-background border-r flex flex-col">
        <div className="text-xs text-center border-b py-2">Список элементов</div>

        <div className="p-2">
          <Input
            type="text"
            placeholder="Поиск по элементам..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-xs"
          />
        </div>

        <div ref={parentRef} className="size-full relative">
          {filteredElements.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-4">
              {elements.length === 0 ? 'Нет элементов' : 'Ничего не найдено'}
            </div>
          ) : (
            <List
              data={filteredElements}
              height={window.innerHeight - 81}
              itemHeight={40}
              itemKey="id"
              className="size-full flex flex-col gap-1 p-2 pt-0"
            >
              {(element) => (
                <div
                  key={element.id}
                  className={`flex w-full items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                    selectedElement?.id === element.id && selectedElement?.type === element.type
                      ? 'bg-accent'
                      : 'hover:bg-accent/50'
                  }`}
                  onClick={() => selectElement(element.id, element.type)}
                >
                  <div className="flex items-center gap-2 w-full truncate">
                    <span>{iconByType[element.type]}</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-xs truncate">{element.label}</span>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>{element.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex-1 flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCenterOnElement(element.id, element.type);
                      }}
                    >
                      <Search className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(element.id, element.type);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </List>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};
