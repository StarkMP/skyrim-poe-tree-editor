import { Search, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStore } from '@/store';

export const ElementsPanel = () => {
  const {
    nodes,
    images,
    selectedElement,
    selectElement,
    deleteNode,
    deleteImage,
    requestCenterOnElement,
  } = useStore();

  const elements: Array<{ id: string; type: 'node' | 'image'; label: string }> = [
    ...Object.keys(nodes).map((id) => ({
      id,
      type: 'node' as const,
      label: `Нода (${id.slice(0, 8)})`,
    })),
    ...Object.keys(images).map((id) => ({
      id,
      type: 'image' as const,
      label: `Изображение (${id.slice(0, 8)})`,
    })),
  ];

  const handleCenterOnElement = (id: string, type: 'node' | 'image') => {
    selectElement(id, type);
    requestCenterOnElement(id, type);
  };

  const handleDelete = (id: string, type: 'node' | 'image') => {
    if (type === 'node') {
      deleteNode(id);
    } else {
      deleteImage(id);
    }
  };

  return (
    <div className="size-full bg-background border-r flex flex-col py-2">
      <div className="text-xs text-center border-b pb-2 mb-3">Список элементов</div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="flex flex-col gap-1 px-2">
          {elements.length === 0 ? (
            <div className="text-xs text-center text-muted-foreground py-4">
              Нет элементов. Создайте ноду или изображение через ПКМ во viewport.
            </div>
          ) : (
            elements.map((element) => (
              <div
                key={element.id}
                className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                  selectedElement?.id === element.id && selectedElement?.type === element.type
                    ? 'bg-accent border-primary'
                    : 'hover:bg-accent/50'
                }`}
                onClick={() => selectElement(element.id, element.type)}
              >
                <span className="flex-1 text-xs truncate">{element.label}</span>
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
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
