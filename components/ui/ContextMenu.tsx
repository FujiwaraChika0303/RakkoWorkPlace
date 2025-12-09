import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MenuItem } from '../../types';
import { ChevronRight } from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Adjust position to keep within viewport
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      let newX = x;
      let newY = y;

      if (x + rect.width > window.innerWidth) {
        newX = window.innerWidth - rect.width - 10;
      }
      if (y + rect.height > window.innerHeight) {
        newY = y - rect.height;
      }

      setPosition({ x: newX, y: newY });
      setIsVisible(true);
    }
  }, [x, y]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Use mousedown for immediate response, prevents dragging interactions elsewhere
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', onClose);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', onClose);
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[9998]" onContextMenu={(e) => { e.preventDefault(); onClose(); }}>
      <div
        ref={menuRef}
        className={`fixed z-[9999] min-w-[200px] bg-glass-panel backdrop-blur-xl border border-glass-border rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.5)] py-1.5 flex flex-col text-sm text-glass-text origin-top-left transition-opacity duration-150 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        style={{
          top: position.y,
          left: position.x,
        }}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
      >
        {items.map((item, index) => {
          if (item.separator) {
            return <div key={index} className="h-px bg-white/10 my-1 mx-2" />;
          }

          return (
            <button
              key={index}
              disabled={item.disabled}
              onClick={() => {
                if (item.action && !item.disabled) {
                  item.action();
                  onClose();
                }
              }}
              className={`
                group relative w-full text-left px-3 py-2 flex items-center gap-3 transition-colors mx-1 rounded-md max-w-[calc(100%-8px)]
                ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${!item.disabled && item.danger 
                    ? 'hover:bg-red-600/80 hover:text-white text-red-300' 
                    : !item.disabled 
                        ? 'hover:bg-indigo-600/80 hover:text-white' 
                        : ''
                }
              `}
            >
              {item.icon && (
                <span className={`opacity-70 group-hover:opacity-100 ${item.danger ? 'text-red-400 group-hover:text-white' : ''}`}>
                  {item.icon}
                </span>
              )}
              <span className="flex-1 truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>,
    document.body
  );
};