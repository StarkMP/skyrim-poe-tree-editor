import { Hexagon, Image, Spline, Trash2 } from 'lucide-react';
import { useEffect, useRef } from 'react';

type ContextMenuProps = {
  x: number;
  y: number;
  targetId?: string;
  targetType?: 'node' | 'image';
  onCreateNode: () => void;
  onCreateImage: () => void;
  onStartConnection: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onDeleteImage: (imageId: string) => void;
  onClose: () => void;
};

export const ContextMenu = ({
  x,
  y,
  targetId,
  targetType,
  onCreateNode,
  onCreateImage,
  onStartConnection,
  onDeleteNode,
  onDeleteImage,
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

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-background border rounded-md shadow-lg py-1 min-w-[180px]"
      style={{ left: x, top: y }}
    >
      {targetId ? (
        targetType === 'node' ? (
          // Node menu
          <>
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors"
              onClick={() => handleItemClick(() => onStartConnection(targetId))}
            >
              <Spline size={16} />
              Создать соединение
            </button>
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-destructive hover:bg-accent transition-colors"
              onClick={() => handleItemClick(() => onDeleteNode(targetId))}
            >
              <Trash2 size={16} />
              Удалить ноду
            </button>
          </>
        ) : (
          // Image menu
          <button
            className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-destructive hover:bg-accent transition-colors"
            onClick={() => handleItemClick(() => onDeleteImage(targetId))}
          >
            <Trash2 size={16} />
            Удалить изображение
          </button>
        )
      ) : (
        // Empty space menu
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
        </>
      )}
    </div>
  );
};
