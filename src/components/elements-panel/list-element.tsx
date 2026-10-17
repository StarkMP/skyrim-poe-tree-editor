import { Tooltip, TooltipContent, TooltipTrigger } from '@radix-ui/react-tooltip';
import { Gem, Hexagon, Image, Orbit, Search, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ElementType, useStore } from '@/store';

const iconByType = {
  node: <Hexagon size={16} />,
  image: <Image size={16} />,
  orbit: <Orbit size={16} />,
  stone: <Gem size={16} />,
} as const;

export const ListElement = ({
  element,
}: {
  element: {
    id: string;
    type: ElementType;
    label: string;
    perkId?: string;
  };
}) => {
  const isSelected = useStore(
    (state) =>
      state.selectedElement?.id === element.id && state.selectedElement?.type === element.type
  );

  const selectElement = useStore((state) => state.selectElement);
  const deleteNode = useStore((state) => state.deleteNode);
  const deleteImage = useStore((state) => state.deleteImage);
  const deleteOrbit = useStore((state) => state.deleteOrbit);
  const deleteStoneSelection = useStore((state) => state.deleteStoneSelection);
  const requestCenterOnElement = useStore((state) => state.requestCenterOnElement);

  const handleCenterOnElement = (id: string, type: ElementType) => {
    selectElement(id, type);
    requestCenterOnElement(id, type);
  };

  const handleDelete = (id: string, type: ElementType) => {
    switch (type) {
      case 'node': {
        deleteNode(id);

        break;
      }
      case 'image': {
        deleteImage(id);

        break;
      }
      case 'orbit': {
        deleteOrbit(id);

        break;
      }
      case 'stone': {
        deleteStoneSelection();

        break;
      }
    }
  };

  return (
    <div
      className={cn(
        'flex w-full items-center gap-2 p-2 rounded-md cursor-pointer transition-colors',
        isSelected ? 'bg-accent' : 'hover:bg-accent/50'
      )}
      onClick={() => selectElement(element.id, element.type)}
    >
      <div className="flex items-center gap-2 w-full truncate">
        <span>{iconByType[element.type]}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-xs truncate">{element.label}</span>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="p-1 border bg-black">{element.label}</p>
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
  );
};
