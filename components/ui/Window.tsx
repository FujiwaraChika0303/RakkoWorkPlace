import React, { useState, useEffect, useRef } from 'react';
import { X, Minus, Maximize2, Minimize2 } from 'lucide-react';
import { AppId } from '../../types';

interface WindowProps {
  id: AppId;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  zIndex: number;
  isActive?: boolean;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  onClose: (id: AppId) => void;
  onMinimize: (id: AppId) => void;
  onFocus: (id: AppId) => void;
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
  onClose,
  onMinimize,
  onFocus,
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
  const dragStartMouse = useRef({ x: 0, y: 0 });
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragStartSize = useRef({ width: 0, height: 0 });
  const resizeDir = useRef('');

  // Entrance/Exit/Minimize Animation Logic
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      // Double RAF ensures the browser paints the initial "hidden" state before transitioning
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      setIsVisible(false);
      // Wait for transition to finish before unmounting
      const timer = setTimeout(() => {
        setIsRendered(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Randomize initial position if default
  useEffect(() => {
    if (isOpen && initialPosition.x === 100 && initialPosition.y === 100) {
      const x = Math.max(0, window.innerWidth / 2 - initialSize.width / 2 + (Math.random() * 40 - 20));
      const y = Math.max(0, window.innerHeight / 2 - initialSize.height / 2 + (Math.random() * 40 - 20));
      setPosition({ x, y });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // --- Handlers ---

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMaximized) return;
    onFocus(id);
    if ((e.target as HTMLElement).closest('.window-controls')) return;
    
    setIsDragging(true);
    dragStartMouse.current = { x: e.clientX, y: e.clientY };
    dragStartPos.current = { ...position };
  };

  const toggleMaximize = () => {
    if (isMaximized) {
      setIsMaximized(false);
      // Restore previous state
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

  // --- Global Event Listeners ---
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

  // --- Styles & Animation Transforms ---

  const renderX = isMaximized ? 0 : position.x;
  const renderY = isMaximized ? 0 : position.y;
  const renderWidth = isMaximized ? window.innerWidth : size.width;
  const renderHeight = isMaximized ? window.innerHeight - 48 : size.height;

  // Animation Logic
  let transformString = `translate(${renderX}px, ${renderY}px) scale(1)`;
  let opacityValue = 1;

  if (isMinimized) {
    // Drop to bottom center (mimic taskbar) and scale down
    // We assume taskbar is roughly at Y = window.innerHeight
    // We keep X but move Y down
    transformString = `translate(${renderX}px, ${window.innerHeight}px) scale(0.3)`;
    opacityValue = 0;
  } else if (!isVisible) {
    // Initial opening / Closing state
    transformString = `translate(${renderX}px, ${renderY}px) scale(0.9)`;
    opacityValue = 0;
  }

  // Disable CSS transitions during drag/resize for instant feedback
  const isInteracting = isDragging || isResizing;
  const transitionClass = isInteracting 
    ? 'transition-none' 
    : 'transition-[width,height,transform,opacity,filter] duration-500 cubic-bezier(0.2, 0.8, 0.2, 1)';

  return (
    <div
      style={{
        position: 'absolute',
        zIndex,
        width: renderWidth,
        height: renderHeight,
        transform: transformString,
        opacity: opacityValue,
        // Add blur when minimized for extra style
        filter: isMinimized ? 'blur(10px)' : 'none',
        pointerEvents: isMinimized ? 'none' : 'auto'
      }}
      className={`
        flex flex-col bg-glass-dark backdrop-blur-xl shadow-2xl overflow-hidden
        ${isMaximized ? 'rounded-none' : 'rounded-lg'}
        ${transitionClass}
        ${isActive ? 'border border-indigo-500/50 shadow-indigo-500/10' : 'border border-white/10 shadow-black/50'}
      `}
      onMouseDown={() => onFocus(id)}
    >
      {/* Title Bar */}
      <div
        className={`
          h-10 bg-gradient-to-r flex items-center justify-between px-3 
          select-none border-b shrink-0 transition-colors duration-300
          ${isActive ? 'from-gray-900 to-indigo-950/30 border-white/10' : 'from-gray-900 to-black/80 border-white/5'}
          ${isMaximized ? 'cursor-default' : 'cursor-move'}
        `}
        onMouseDown={handleMouseDown}
        onDoubleClick={toggleMaximize}
      >
        <span className={`font-serif text-sm tracking-wider flex items-center gap-2 transition-colors ${isActive ? 'text-gray-100' : 'text-gray-400'}`}>
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-indigo-500 animate-pulse' : 'bg-gray-600'}`} />
          {title}
        </span>
        <div className="flex items-center gap-2 window-controls">
          <button
            onClick={(e) => { e.stopPropagation(); onMinimize(id); }}
            className="p-1 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); toggleMaximize(); }}
            className="p-1 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors"
          >
            {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(id); }}
            className="p-1 hover:bg-red-500/20 rounded-md text-gray-400 hover:text-red-400 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-black/40 text-gray-200 p-1 relative">
        {children}
      </div>

      {/* Resize Handles (Only when not maximized) */}
      {!isMaximized && (
        <>
          {/* Right Edge */}
          <div 
            className="absolute right-0 top-0 bottom-4 w-1.5 cursor-e-resize hover:bg-white/10 transition-colors z-50"
            onMouseDown={startResize('e')}
          />
          {/* Bottom Edge */}
          <div 
            className="absolute left-0 bottom-0 right-4 h-1.5 cursor-s-resize hover:bg-white/10 transition-colors z-50"
            onMouseDown={startResize('s')}
          />
          {/* Corner */}
          <div 
            className="absolute right-0 bottom-0 w-4 h-4 cursor-se-resize hover:bg-white/20 transition-colors z-50 rounded-tl-lg"
            onMouseDown={startResize('se')}
          />
        </>
      )}
    </div>
  );
};