import List from 'rc-virtual-list';
import { useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import { TooltipProvider } from '@/components/ui/tooltip';
import { STONE_SELECTION_ID } from '@/constants';
import { ElementType, useStore } from '@/store';

import { ListElement } from './list-element';

export const ElementsPanel = () => {
  const nodes = useStore((state) => state.nodes);
  const images = useStore((state) => state.images);
  const orbits = useStore((state) => state.orbits);
  const stoneSelection = useStore((state) => state.stoneSelection);
  const parentRef = useRef<HTMLDivElement | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  const elements: Array<{
    id: string;
    type: ElementType;
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
    ...(stoneSelection
      ? [
          {
            id: STONE_SELECTION_ID,
            type: 'stone' as const,
            label: 'Выбор камня',
          },
        ]
      : []),
  ];

  const filteredElements = elements.filter((element) => {
    const query = searchQuery.toLowerCase();
    const matchesLabel = element.label.toLowerCase().includes(query);
    const matchesPerkId = element.perkId?.toLowerCase().includes(query) ?? false;
    return matchesLabel || matchesPerkId;
  });

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
              {(element) => <ListElement key={element.id} element={element} />}
            </List>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};
