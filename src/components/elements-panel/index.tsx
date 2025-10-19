import { Hexagon, Image, Search, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useStore } from '@/store';

const iconByType = {
  node: <Hexagon size={16} />,
  image: <Image size={16} />,
} as const;

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
    ...Object.entries(nodes).map(([id, node]) => ({
      id,
      type: 'node' as const,
      label: `${node.title || 'Нет имени'} (${id.slice(0, 8)})`,
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
    <div className="size-full bg-background border-r flex flex-col">
      <div className="text-xs text-center border-b py-2">Список элементов</div>

      <div className="size-full relative overflow-y-auto">
        <div className="size-full absolute left-0 top-0 flex flex-col gap-1 p-2">
          {elements.length === 0
            ? null
            : elements.map((element) => (
                <div
                  key={element.id}
                  className={`flex w-full items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                    selectedElement?.id === element.id && selectedElement?.type === element.type
                      ? 'bg-accent border-primary'
                      : 'hover:bg-accent/50'
                  }`}
                  onClick={() => selectElement(element.id, element.type)}
                >
                  <div className="flex-1 flex items-center gap-1">
                    {iconByType[element.type]}
                    <span className="text-xs truncate">{element.label}</span>
                  </div>
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
              ))}
        </div>
      </div>
    </div>
  );
};
