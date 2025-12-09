import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Layout, Trash2, Maximize2 } from 'lucide-react';
import { AppId, WindowState, AppConfig } from '../../types';
import { useSystemProcess } from '../../hooks/useSystemProcess';

interface TaskViewProps {
  isOpen: boolean;
  windows: WindowState[];
  apps: AppConfig[]; 
  currentDesktop: number;
  onClose: () => void;
  onSelectWindow: (id: AppId) => void;
  onCloseWindow: (id: AppId) => void;
  onSwitchDesktop: (id: number) => void;
  onMoveWindowToDesktop: (windowId: AppId, desktopId: number) => void;
  renderWindowContent: (id: AppId) => React.ReactNode;
}

export const TaskView: React.FC<TaskViewProps> = ({
  isOpen,
  windows,
  apps,
  currentDesktop,
  onClose,
  onSelectWindow,
  onCloseWindow,
  onSwitchDesktop,
  onMoveWindowToDesktop,
  renderWindowContent
}) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [dragOverDesktop, setDragOverDesktop] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, windowId: AppId } | null>(null);

  const { elementRef } = useSystemProcess({
    id: 'ui:task-view',
    name: 'Task View Host',
    type: 'ui'
  }, shouldRender);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  if (!shouldRender) return null;

  const desktopWindows = windows.filter(w => w.isOpen && w.desktopId === currentDesktop);

  const handleDragStart = (e: React.DragEvent, windowId: AppId) => {
    e.dataTransfer.setData('windowId', windowId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, desktopId: number) => {
    e.preventDefault();
    if (dragOverDesktop !== desktopId) setDragOverDesktop(desktopId);
  };

  const handleDragLeave = () => {
  };

  const handleDrop = (e: React.DragEvent, desktopId: number) => {
    e.preventDefault();
    setDragOverDesktop(null);
    const windowId = e.dataTransfer.getData('windowId') as AppId;
    if (windowId && desktopId !== currentDesktop) {
        onMoveWindowToDesktop(windowId, desktopId);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, windowId: AppId) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, windowId });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
          onClose();
      }
  };

  return (
    <div 
        ref={elementRef}
        className={`
            fixed inset-0 z-[80] bg-black/60 backdrop-blur-2xl flex flex-col select-none 
            transition-all duration-300 ease-in-out
            ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
        `}
        onClick={handleBackdropClick}
    >
      <button 
        onClick={onClose}
        className="absolute top-6 right-8 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all hover:rotate-90 z-50 shadow-lg"
        title="Close Task View"
      >
        <X size={24} />
      </button>

      <div className="h-48 flex items-center justify-center gap-8 pt-12 pb-4 shrink-0" onClick={(e) => e.stopPropagation()}>
        {[0, 1].map(idx => (
          <div
            key={idx}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, idx)}
            onClick={() => onSwitchDesktop(idx)}
            className={`
              relative w-56 h-32 rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-3 group cursor-pointer overflow-hidden
              ${currentDesktop === idx 
                ? 'bg-white/10 border-indigo-500 shadow-[0_0_40px_rgba(99,102,241,0.2)] scale-105' 
                : 'bg-black/40 border-white/10 hover:bg-white/5 hover:border-white/30 hover:scale-105'
              }
              ${dragOverDesktop === idx ? 'ring-4 ring-indigo-400/50 scale-110 bg-indigo-500/20' : ''}
            `}
          >
            <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${currentDesktop === idx ? 'text-indigo-400' : 'text-gray-500'}`}>
                Desktop {idx + 1}
            </div>
            
            <div className="flex gap-1.5">
               <div className={`w-16 h-10 rounded border transition-colors ${currentDesktop === idx ? 'bg-indigo-500/20 border-indigo-500/50' : 'bg-gray-800 border-gray-700'}`}></div>
            </div>
            
            {dragOverDesktop === idx && (
                 <div className="absolute inset-0 flex items-center justify-center bg-indigo-900/80 backdrop-blur-sm animate-fade-in">
                     <span className="text-white font-bold flex items-center gap-2"><ArrowRight size={16}/> Drop Here</span>
                 </div>
            )}
          </div>
        ))}
      </div>

      <div 
        className="flex-1 overflow-y-auto px-12 py-8 custom-scrollbar"
        onClick={handleBackdropClick}
      >
        <h2 className="text-2xl font-serif text-white/50 text-center mb-12 tracking-[0.2em] mix-blend-overlay pointer-events-none">
          {desktopWindows.length === 0 ? 'NO ACTIVE TASKS' : 'ACTIVE TASKS'}
        </h2>
        
        <div 
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 max-w-[90rem] mx-auto pb-20"
            onClick={(e) => e.stopPropagation()} 
        >
          {desktopWindows.map((win, idx) => {
            const appDef = apps.find(a => a.id === win.id);
            if (!appDef) return null;

            return (
              <div 
                key={win.id}
                draggable
                onDragStart={(e) => handleDragStart(e, win.id)}
                onContextMenu={(e) => handleContextMenu(e, win.id)}
                className="group relative flex flex-col gap-4 hover:z-10"
                style={{ 
                    animation: `fadeIn 0.4s ease-out ${idx * 0.05}s backwards`
                }}
              >
                <div 
                  onClick={() => { onSelectWindow(win.id); onClose(); }}
                  className="
                    relative aspect-[16/10] bg-gray-900 rounded-xl border border-white/10 shadow-2xl overflow-hidden cursor-pointer 
                    transition-all duration-300 ease-out
                    group-hover:border-indigo-500/60 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] group-hover:-translate-y-2 group-hover:scale-[1.02]
                  "
                >
                  <div className="h-8 bg-[#151515] border-b border-white/5 flex items-center px-3 gap-2 justify-between">
                     <div className="flex items-center gap-1.5 opacity-50 group-hover:opacity-100 transition-opacity">
                         <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                         <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                         <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                     </div>
                     <div className="p-1 rounded bg-white/5">
                        {React.cloneElement(appDef.icon as React.ReactElement<any>, { size: 12, className: 'text-gray-400' })}
                     </div>
                  </div>

                  <div className="absolute top-8 left-0 right-0 bottom-0 bg-black overflow-hidden">
                     <div className="w-[400%] h-[400%] origin-top-left scale-[0.25] pointer-events-none select-none p-4 opacity-80 group-hover:opacity-100 transition-opacity grayscale-[30%] group-hover:grayscale-0">
                        {renderWindowContent(win.id)}
                     </div>
                  </div>
                  
                  <button
                    onClick={(e) => { e.stopPropagation(); onCloseWindow(win.id); }}
                    className="
                        absolute top-2 right-2 p-1.5 rounded-full 
                        bg-red-500 text-white opacity-0 scale-75
                        group-hover:opacity-100 group-hover:scale-100 
                        hover:bg-red-600 hover:rotate-90
                        transition-all duration-300 shadow-lg z-20
                    "
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="text-center">
                   <span className="text-sm text-gray-400 font-medium group-hover:text-white transition-colors shadow-black drop-shadow-md bg-black/40 px-3 py-1 rounded-full border border-transparent group-hover:border-white/10">
                    {appDef.title}
                   </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {contextMenu && (
          <div 
             className="fixed z-[100] w-60 bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.7)] py-2 animate-pop origin-top-left flex flex-col"
             style={{ top: contextMenu.y, left: contextMenu.x }}
             onClick={(e) => e.stopPropagation()}
          >
             <div className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/5 mb-1 flex items-center gap-2">
                <Layout size={12}/> Window Options
             </div>

             <button 
                onClick={() => { onSelectWindow(contextMenu.windowId); onClose(); }}
                className="text-left px-4 py-3 hover:bg-indigo-600 text-gray-200 hover:text-white flex items-center gap-3 transition-colors text-sm mx-1 rounded-md"
             >
                <Maximize2 size={14} className="opacity-70"/> Open Window
             </button>
             
             <div className="h-px bg-white/5 my-1 mx-2"></div>

             <button 
                onClick={() => { onMoveWindowToDesktop(contextMenu.windowId, 0); setContextMenu(null); }}
                disabled={currentDesktop === 0}
                className="text-left px-4 py-2.5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-gray-300 flex items-center gap-3 transition-colors text-sm mx-1 rounded-md"
             >
                <div className="w-4 h-4 border border-gray-500 rounded flex items-center justify-center text-[9px]">1</div>
                Move to Desktop 1
             </button>

             <button 
                onClick={() => { onMoveWindowToDesktop(contextMenu.windowId, 1); setContextMenu(null); }}
                disabled={currentDesktop === 1}
                className="text-left px-4 py-2.5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-gray-300 flex items-center gap-3 transition-colors text-sm mx-1 rounded-md"
             >
                <div className="w-4 h-4 border border-gray-500 rounded flex items-center justify-center text-[9px]">2</div>
                Move to Desktop 2
             </button>

             <div className="h-px bg-white/5 my-1 mx-2"></div>

             <button 
                onClick={() => { onCloseWindow(contextMenu.windowId); setContextMenu(null); }}
                className="text-left px-4 py-2.5 hover:bg-red-900/30 text-red-400 hover:text-red-300 flex items-center gap-3 transition-colors text-sm mx-1 rounded-md"
             >
                <Trash2 size={14} className="opacity-70"/> Close Window
             </button>
          </div>
      )}
      
      {contextMenu && <div className="fixed inset-0 z-[99]" onClick={() => setContextMenu(null)} />}
    </div>
  );
};