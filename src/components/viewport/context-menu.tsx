import { Hexagon, Image, Link2Off, Orbit, Spline, Trash2 } from 'lucide-react';
import { useEffect, useRef } from 'react';

type ContextMenuProps = {
  x: number;
  y: number;
  targetId?: string;
  targetType?: 'node' | 'image' | 'orbit';
  onCreateNode: () => void;
  onCreateImage: () => void;
  onCreateOrbit: () => void;
  onStartConnection: (nodeId: string) => void;
  onRemoveAllConnections: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onDeleteImage: (imageId: string) => void;
  onDeleteOrbit: (orbitId: string) => void;
  onClose: () => void;
};

export const ContextMenu = ({
  x,
  y,
  targetId,
  targetType,
  onCreateNode,
  onCreateImage,
  onCreateOrbit,
  onStartConnection,
  onRemoveAllConnections,
  onDeleteNode,
  onDeleteImage,
  onDeleteOrbit,
  onClose,
}: ContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleItemClick = (action: () => void) => {
    action();
    onClose();
  };

  const renderMenu = (type: typeof targetType, target: typeof targetId) => {
    if (!target) {
      return (
        <>
          <button
            className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors"
            onClick={() => handleItemClick(onCreateNode)}
          >
            <Hexagon size={16} />
            Создать ноду
          </button>
          <button
            className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors"
            onClick={() => handleItemClick(onCreateImage)}
          >
            <Image size={16} />
            Создать изображение
          </button>
          <button
            className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors"
            onClick={() => handleItemClick(onCreateOrbit)}
          >
            <Orbit size={16} />
            Создать орбиту позиций
          </button>
        </>
      );
    }

    if (!type) return null;

    switch (type) {
      case 'node': {
        return (
          <>
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors"
              onClick={() => handleItemClick(() => onStartConnection(target))}
            >
              <Spline size={16} />
              Создать соединение
            </button>
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors"
              onClick={() => handleItemClick(() => onRemoveAllConnections(target))}
            >
              <Link2Off size={16} />
              Разорвать все связи
            </button>
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-destructive hover:bg-accent transition-colors"
              onClick={() => handleItemClick(() => onDeleteNode(target))}
            >
              <Trash2 size={16} />
              Удалить ноду
            </button>
          </>
        );
      }
      case 'image': {
        return (
          <button
            className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-destructive hover:bg-accent transition-colors"
            onClick={() => handleItemClick(() => onDeleteImage(target))}
          >
            <Trash2 size={16} />
            Удалить изображение
          </button>
        );
      }
      case 'orbit': {
        return (
          <button
            className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-destructive hover:bg-accent transition-colors"
            onClick={() => handleItemClick(() => onDeleteOrbit(target))}
          >
            <Trash2 size={16} />
            Удалить орбиту
          </button>
        );
      }
    }
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-background border rounded-md shadow-lg py-1 min-w-[180px]"
      style={{ left: x, top: y }}
    >
      {renderMenu(targetType, targetId)}
    </div>
  );
};
