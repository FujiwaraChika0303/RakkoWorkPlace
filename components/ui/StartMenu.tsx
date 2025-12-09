import React from 'react';
import { Power, Hexagon } from 'lucide-react';
import { AppId, UserProfile } from '../../types';
import { useSystemProcess } from '../../hooks/useSystemProcess';

interface AppDefinition {
    id: AppId;
    label: string;
    icon: React.ReactNode;
}

interface StartMenuProps {
  isOpen: boolean;
  user: UserProfile;
  apps: AppDefinition[];
  onOpenApp: (id: AppId) => void;
  onShutdown: () => void;
  onClose: () => void;
  position?: 'top' | 'bottom';
  onAppContextMenu?: (e: React.MouseEvent, id: AppId) => void;
}

export const StartMenu: React.FC<StartMenuProps> = ({ isOpen, user, apps, onOpenApp, onShutdown, onClose, position = 'bottom', onAppContextMenu }) => {
  const { elementRef } = useSystemProcess({
      id: 'ui:start-menu',
      name: 'Start Menu',
      type: 'ui'
  }, isOpen);

  if (!isOpen) return null;

  const positionClass = position === 'top' 
    ? 'top-14 origin-top-left' 
    : 'bottom-14 origin-bottom-left';

  return (
    <>
      <div className="fixed inset-0 z-[60]" onClick={onClose} />
      
      <div 
        ref={elementRef}
        className={`fixed left-4 width-80 w-80 bg-glass-dark backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl z-[70] overflow-hidden flex flex-col animate-fade-in ${positionClass}`}
      >
        <div className="p-6 bg-gradient-to-r from-gray-900 to-black border-b border-white/10 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white border-2 border-white/20 font-bold shadow-lg ${user.avatarColor}`}>
            {user.name.charAt(0)}
          </div>
          <div>
            <div className="text-white font-bold text-base">{user.name}</div>
            <div className="text-xs text-indigo-400 font-mono mt-0.5">{user.role}</div>
          </div>
        </div>

        <div className="px-6 py-2">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-4 mb-2">Applications</div>
        </div>

        <div className="px-3 pb-4 space-y-1 max-h-[300px] overflow-y-auto">
          {apps.map((app) => (
            <button
              key={app.id}
              onClick={() => {
                onOpenApp(app.id);
                onClose();
              }}
              onContextMenu={(e) => {
                  if (onAppContextMenu) {
                      onAppContextMenu(e, app.id);
                  }
              }}
              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/10 flex items-center gap-4 transition-all duration-200 text-gray-200 group border border-transparent hover:border-white/5"
            >
              <div className="p-2 rounded-md bg-gradient-to-br from-gray-800 to-black border border-white/10 group-hover:scale-105 transition-transform shadow-md">
                {app.icon}
              </div>
              <span className="text-sm font-medium">{app.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-auto p-4 border-t border-white/10 bg-black/60 flex justify-between items-center">
          <div className="flex items-center gap-2 text-gray-500">
             <Hexagon size={14} className="fill-gray-700" />
             <span className="text-[10px] font-mono tracking-wider">RAKKO WORKPLACE</span>
          </div>
          <button 
            onClick={onShutdown}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-red-500/20 text-gray-400 hover:text-red-300 transition-colors text-xs font-medium border border-transparent hover:border-red-500/20"
          >
            <Power size={14} />
            <span>Shut Down</span>
          </button>
        </div>
      </div>
    </>
  );
};