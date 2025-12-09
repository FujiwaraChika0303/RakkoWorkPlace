import React, { useState, useEffect, useRef } from 'react';
import { X, Minus, Maximize2, Minimize2 } from 'lucide-react';
import { AppId } from '../../types';
import html2canvas from 'html2canvas';
import { useSystemProcess } from '../../hooks/useSystemProcess';

interface WindowProps {
  id: AppId;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  zIndex: number;
  isActive?: boolean;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  variant?: 'default' | 'frameless';
  onClose: (id: AppId) => void;
  onMinimize: (id: AppId) => void;
  onFocus: (id: AppId) => void;
  onUpdatePreview: (id: AppId, url: string) => void;
  children: React.ReactNode;
}

export const Window: React.FC<WindowProps> = ({
  id,
  title,
  isOpen,
  isMinimized,
  zIndex,
  isActive = false,
  initialPosition = { x: 100, y: 100 },
  initialSize = { width: 600, height: 400 },
  variant = 'default',
  onClose,
  onMinimize,
  onFocus,
  onUpdatePreview,
  children,
}) => {
  // --- Window State ---
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [isMaximized, setIsMaximized] = useState(false);
  const [prevBounds, setPrevBounds] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  // --- Animation State ---
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // --- Interaction State ---
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // --- Refs ---
  const windowRef = useRef<HTMLDivElement>(null);
  const dragStartMouse = useRef({ x: 0, y: 0 });
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragStartSize = useRef({ width: 0, height: 0 });
  const resizeDir = useRef('');
  const lastCaptureTime = useRef(0);

  // --- Process Registration ---
  useSystemProcess({
    id: `app:${id}`,
    name: title,
    type: 'app',
    meta: { zIndex, isMinimized }
  }, isRendered);

  // Entrance/Exit/Minimize Animation Logic
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsRendered(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Initial Random Position
  useEffect(() => {
    if (isOpen && initialPosition.x === 100 && initialPosition.y === 100) {
      const x = Math.max(0, window.innerWidth / 2 - initialSize.width / 2 + (Math.random() * 40 - 20));
      const y = Math.max(0, window.innerHeight / 2 - initialSize.height / 2 + (Math.random() * 40 - 20));
      setPosition({ x, y });
    }
  }, [isOpen]);

  const capturePreview = async () => {
    if (!windowRef.current || isMinimized || !isOpen) return;
    const now = Date.now();
    if (now - lastCaptureTime.current < 1000) return;
    lastCaptureTime.current = now;

    try {
        const element = windowRef.current;
        const canvas = await html2canvas(element, {
            useCORS: true,
            backgroundColor: null, 
            scale: 0.5, 
            logging: false,
            width: element.offsetWidth,
            height: element.offsetHeight,
            x: 0,
            y: 0,
            onclone: (clonedDoc) => {
                const clonedNode = clonedDoc.querySelector(`[data-window-id="${id}"]`) as HTMLElement;
                if (clonedNode) {
                    clonedNode.style.transform = 'none';
                    clonedNode.style.position = 'fixed';
                    clonedNode.style.top = '0px';
                    clonedNode.style.left = '0px';
                    clonedNode.style.margin = '0px';
                    clonedNode.style.transition = 'none';
                }
            },
            ignoreElements: (element) => element.classList.contains('no-capture')
        });
        onUpdatePreview(id, canvas.toDataURL('image/png'));
    } catch (e) {
        console.warn("Failed to capture window preview", e);
    }
  };

  useEffect(() => {
      if (!isActive && isOpen && !isMinimized && isVisible) {
          capturePreview();
      }
  }, [isActive]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Bring to front
    onFocus(id);

    // Prevent drag if maximized
    if (isMaximized) return;

    // Smart Drag Logic:
    // If clicking a button, input, or explicitly marked "no-drag" area, don't drag window.
    // Otherwise, drag.
    const target = e.target as HTMLElement;
    if (
        target.closest('button') || 
        target.closest('input') || 
        target.closest('.no-drag') ||
        target.closest('.window-controls') ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA'
    ) {
        return;
    }
    
    // Only allow drag from specific areas if variant is default (header)
    // If variant is frameless, we allow drag from anywhere that wasn't excluded above
    if (variant === 'default' && !target.closest('.window-header')) {
        return;
    }

    setIsDragging(true);
    dragStartMouse.current = { x: e.clientX, y: e.clientY };
    dragStartPos.current = { ...position };
  };

  const handleMinimize = async (e: React.MouseEvent) => {
      e.stopPropagation();
      await capturePreview();
      onMinimize(id);
  };

  const toggleMaximize = () => {
    if (isMaximized) {
      setIsMaximized(false);
      if (prevBounds.width > 0) {
        setPosition({ x: prevBounds.x, y: prevBounds.y });
        setSize({ width: prevBounds.width, height: prevBounds.height });
      }
    } else {
      setPrevBounds({ ...position, ...size });
      setIsMaximized(true);
    }
  };

  const startResize = (dir: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onFocus(id);
    setIsResizing(true);
    resizeDir.current = dir;
    dragStartMouse.current = { x: e.clientX, y: e.clientY };
    dragStartSize.current = { ...size };
    dragStartPos.current = { ...position };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - dragStartMouse.current.x;
        const dy = e.clientY - dragStartMouse.current.y;
        setPosition({
          x: dragStartPos.current.x + dx,
          y: dragStartPos.current.y + dy
        });
      }
      
      if (isResizing) {
        const dx = e.clientX - dragStartMouse.current.x;
        const dy = e.clientY - dragStartMouse.current.y;
        const newSize = { ...dragStartSize.current };
        
        if (resizeDir.current.includes('e')) {
          newSize.width = Math.max(300, dragStartSize.current.width + dx);
        }
        if (resizeDir.current.includes('s')) {
          newSize.height = Math.max(200, dragStartSize.current.height + dy);
        }
        
        setSize(newSize);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing]);

  if (!isRendered) return null;

  const renderX = isMaximized ? 0 : position.x;
  const renderY = isMaximized ? 0 : position.y;
  const renderWidth = isMaximized ? window.innerWidth : size.width;
  const renderHeight = isMaximized ? window.innerHeight - 48 : size.height;

  let transformString = `translate(${renderX}px, ${renderY}px) scale(1)`;
  let opacityValue = 1;

  if (isMinimized) {
    transformString = `translate(${renderX}px, ${window.innerHeight}px) scale(0.3)`;
    opacityValue = 0;
  } else if (!isVisible) {
    transformString = `translate(${renderX}px, ${renderY}px) scale(0.9)`;
    opacityValue = 0;
  }

  const isInteracting = isDragging || isResizing;
  const transitionClass = isInteracting 
    ? 'transition-none' 
    : 'transition-[width,height,transform,opacity,filter] duration-500 cubic-bezier(0.2, 0.8, 0.2, 1)';

  // Controls Component for re-use
  const WindowControls = ({ overlay = false }) => (
    <div className={`flex items-center gap-2 window-controls ${overlay ? 'absolute top-0 right-0 p-2 z-50' : ''}`}>
        <button
        onClick={handleMinimize}
        className={`p-1 rounded-md transition-colors ${overlay ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`}
        >
        <Minus size={14} />
        </button>
        <button
        onClick={(e) => { e.stopPropagation(); toggleMaximize(); }}
        className={`p-1 rounded-md transition-colors ${overlay ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`}
        >
        {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
        <button
        onClick={(e) => { e.stopPropagation(); onClose(id); }}
        className={`p-1 rounded-md transition-colors ${overlay ? 'hover:bg-red-500 text-gray-400 hover:text-white' : 'hover:bg-red-500/20 text-gray-400 hover:text-red-400'}`}
        >
        <X size={14} />
        </button>
    </div>
  );

  return (
    <div
      ref={windowRef}
      data-window-id={id}
      style={{
        position: 'absolute',
        zIndex,
        width: renderWidth,
        height: renderHeight,
        transform: transformString,
        opacity: opacityValue,
        filter: isMinimized ? 'blur(10px)' : 'none',
        pointerEvents: isMinimized ? 'none' : 'auto'
      }}
      className={`
        flex flex-col bg-glass-dark backdrop-blur-xl shadow-2xl overflow-hidden
        ${isMaximized ? 'rounded-none' : 'rounded-lg'}
        ${transitionClass}
        ${isActive ? 'border border-indigo-500/50 shadow-indigo-500/10' : 'border border-white/10 shadow-black/50'}
      `}
      onMouseDown={handleMouseDown}
    >
      {/* Default Header */}
      {variant === 'default' && (
          <div
            className={`
              window-header h-10 bg-gradient-to-r flex items-center justify-between px-3 
              select-none border-b shrink-0 transition-colors duration-300
              ${isActive ? 'from-gray-900 to-indigo-950/30 border-white/10' : 'from-gray-900 to-black/80 border-white/5'}
              ${isMaximized ? 'cursor-default' : 'cursor-move'}
            `}
            onDoubleClick={toggleMaximize}
          >
            <span className={`font-serif text-sm tracking-wider flex items-center gap-2 transition-colors ${isActive ? 'text-gray-100' : 'text-gray-400'}`}>
              <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-indigo-500 animate-pulse' : 'bg-gray-600'}`} />
              {title}
            </span>
            <WindowControls />
          </div>
      )}

      {/* Frameless Header Controls Overlay */}
      {variant === 'frameless' && (
          <WindowControls overlay />
      )}

      {/* Content */}
      <div className={`flex-1 overflow-auto bg-black/40 text-gray-200 relative ${variant === 'default' ? 'p-1' : ''}`}>
        {children}
      </div>

      {!isMaximized && (
        <div className="no-capture">
          <div 
            className="absolute right-0 top-0 bottom-4 w-1.5 cursor-e-resize hover:bg-white/10 transition-colors z-50 no-drag"
            onMouseDown={startResize('e')}
          />
          <div 
            className="absolute left-0 bottom-0 right-4 h-1.5 cursor-s-resize hover:bg-white/10 transition-colors z-50 no-drag"
            onMouseDown={startResize('s')}
          />
          <div 
            className="absolute right-0 bottom-0 w-4 h-4 cursor-se-resize hover:bg-white/20 transition-colors z-50 rounded-tl-lg no-drag"
            onMouseDown={startResize('se')}
          />
        </div>
      )}
    </div>
  );
};