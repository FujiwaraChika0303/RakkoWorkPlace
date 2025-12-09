import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Hexagon, Search, LayoutTemplate, User, X } from 'lucide-react';
import { AppId, WindowState, SystemSettings } from '../../types';
import { QuickSettings } from './QuickSettings';
import { useSystemProcess } from '../../hooks/useSystemProcess';

interface TaskbarProps {
  installedApps: { id: AppId; label: string; icon: React.ReactNode }[];
  pinnedAppIds: AppId[];
  openWindows: Record<AppId, WindowState>;
  activeApp: AppId | null;
  currentDesktop: number;
  settings: SystemSettings;
  currentTime: Date;
  isStartMenuOpen: boolean;
  onToggleStartMenu: () => void;
  onAppClick: (id: AppId) => void;
  onAppContextMenu: (e: React.MouseEvent, id: AppId) => void;
  onTaskbarContextMenu: (e: React.MouseEvent) => void;
  onCloseApp: (id: AppId) => void;
  onToggleTaskView: () => void;
  onToggleTheme: () => void;
  renderWindowContent?: (id: AppId) => React.ReactNode;
}

export const Taskbar: React.FC<TaskbarProps> = ({
  installedApps,
  pinnedAppIds,
  openWindows,
  activeApp,
  currentDesktop,
  settings,
  currentTime,
  isStartMenuOpen,
  onToggleStartMenu,
  onAppClick,
  onAppContextMenu,
  onTaskbarContextMenu,
  onCloseApp,
  onToggleTaskView,
  onToggleTheme,
  renderWindowContent
}) => {
  // Self-register
  const { elementRef } = useSystemProcess({
    id: 'ui:taskbar',
    name: 'Taskbar Shell',
    type: 'ui'
  });

  const [isHovered, setIsHovered] = useState(false);
  const [showWorldClock, setShowWorldClock] = useState(false);
  const [showQuickSettings, setShowQuickSettings] = useState(false);
  
  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Preview State
  const [hoveredApp, setHoveredApp] = useState<{ id: AppId, rect: DOMRect } | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);

  // Auto-hide Logic
  const isHidden = settings.taskbar.autoHide && !isHovered && !isStartMenuOpen && !showWorldClock && !showQuickSettings && !isSearchOpen;
  const positionClass = settings.taskbar.position === 'top' ? 'top-0 border-b' : 'bottom-0 border-t';
  
  const transformStyle = isHidden 
    ? (settings.taskbar.position === 'top' ? 'translateY(-100%)' : 'translateY(100%)')
    : 'translateY(0)';

  const displayedApps = useMemo(() => {
      // 1. Get Pinned Apps
      const pinned = pinnedAppIds
          .map(id => installedApps.find(app => app.id === id))
          .filter(Boolean) as typeof installedApps;
      
      // 2. Get Running Apps (Grouped)
      const runningIds = new Set<string>();
      (Object.values(openWindows) as WindowState[]).forEach(win => {
          if (win.isOpen) {
             if (win.id.startsWith(AppId.BROWSER)) {
                 runningIds.add(AppId.BROWSER);
             } else {
                 runningIds.add(win.id);
             }
          }
      });

      // Filter out running apps that are already pinned
      const runningUnpinned = Array.from(runningIds)
          .filter(id => !pinnedAppIds.includes(id))
          .map(id => installedApps.find(app => app.id === id))
          .filter(Boolean) as typeof installedApps;

      return [...pinned, ...runningUnpinned];
  }, [pinnedAppIds, openWindows, installedApps]);

  const getAppStatus = (id: AppId) => {
    // Special grouping logic for Browser
    if (id === AppId.BROWSER) {
        const browserWindows = Object.values(openWindows).filter(w => w.id.startsWith(AppId.BROWSER) && w.isOpen);
        const isOpen = browserWindows.length > 0;
        const isActive = browserWindows.some(w => activeApp === w.id);
        const isOnCurrentDesktop = browserWindows.some(w => w.desktopId === currentDesktop);
        
        // Use first window for preview if available
        const previewUrl = browserWindows[0]?.previewUrl;
        
        return {
            isOpen,
            isActive,
            isOnCurrentDesktop,
            title: 'Rakko Browser',
            previewUrl
        };
    }

    const win = openWindows[id];
    return {
      isOpen: win?.isOpen,
      isActive: activeApp === id,
      isOnCurrentDesktop: win?.desktopId === currentDesktop,
      title: installedApps.find(a => a.id === id)?.label,
      previewUrl: win?.previewUrl
    };
  };

  const handleMouseEnterApp = (e: React.MouseEvent, appId: AppId) => {
      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      const status = getAppStatus(appId);
      
      if (status.isOpen) {
          if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = window.setTimeout(() => {
              setHoveredApp({ id: appId, rect });
          }, 300);
      }
  };

  const handleMouseLeaveApp = () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = window.setTimeout(() => {
          setHoveredApp(null);
      }, 100);
  };

  return (
    <div 
      ref={elementRef}
      className={`fixed left-0 right-0 h-12 z-50 bg-glass-panel backdrop-blur-xl border-white/10 transition-transform duration-300 ease-in-out flex items-center ${positionClass}`}
      style={{ transform: transformStyle }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onContextMenu={(e) => {
          e.preventDefault();
          onTaskbarContextMenu(e);
      }}
    >
      <div 
        className={`absolute inset-0 flex items-center px-2 pointer-events-none ${
          settings.taskbar.alignment === 'center' ? 'justify-center' : 'justify-start'
        }`}
      >
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onToggleStartMenu}
            className={`
              p-2 rounded transition-all duration-300 group relative
              ${isStartMenuOpen ? 'bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'hover:bg-white/10'}
            `}
            title="Start"
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            <Hexagon 
              size={24} 
              className={`transition-transform duration-500 ${isStartMenuOpen ? 'text-white rotate-90' : 'text-indigo-400 group-hover:rotate-180'}`} 
              fill={isStartMenuOpen ? "currentColor" : "none"}
            />
          </button>

          {settings.taskbar.showSearch && (
            <div className="relative">
                <button 
                   onClick={() => setIsSearchOpen(!isSearchOpen)}
                   className={`flex items-center gap-2 px-3 py-1.5 border border-white/5 rounded-full text-gray-400 hover:text-white transition-colors text-xs w-32 group ${isSearchOpen ? 'bg-white/10' : 'bg-black/20 hover:bg-white/10'}`}
                >
                   <Search size={14} />
                   <span className="opacity-70 group-hover:opacity-100">Search...</span>
                </button>
                {/* Search Overlay */}
                {isSearchOpen && (
                    <SearchOverlay 
                        apps={installedApps} 
                        onClose={() => setIsSearchOpen(false)} 
                        onOpenApp={(id) => { onAppClick(id); setIsSearchOpen(false); }}
                        position={settings.taskbar.position}
                    />
                )}
            </div>
          )}

          <button 
            onClick={onToggleTaskView}
            className="p-2 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Task View"
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            <LayoutTemplate size={18} />
          </button>

          <div className="w-px h-6 bg-white/10 mx-1" />

          <div className="flex items-center gap-1">
            {displayedApps.map(app => {
              const status = getAppStatus(app.id);
              let indicatorClass = "scale-0 opacity-0";
              let bgClass = "";

              if (status.isOpen) {
                  indicatorClass = "scale-100 opacity-100 bg-gray-400"; 
                  bgClass = "bg-white/5";
                  if (status.isOnCurrentDesktop) indicatorClass = "scale-100 opacity-100 bg-white";
                  if (status.isActive) {
                      indicatorClass = "scale-100 opacity-100 bg-indigo-500 w-4";
                      bgClass = "bg-white/10 shadow-inner";
                  }
              }

              return (
                <button
                  key={app.id}
                  onClick={() => onAppClick(app.id)}
                  onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation(); // Prevent bubbling to taskbar background
                      onAppContextMenu(e, app.id);
                  }}
                  onMouseEnter={(e) => handleMouseEnterApp(e, app.id)}
                  onMouseLeave={handleMouseLeaveApp}
                  className={`
                    relative group flex items-center justify-center w-10 h-10 rounded hover:bg-white/10 transition-all
                    ${bgClass}
                  `}
                >
                  <div className={`transition-transform duration-200 ${status.isActive ? 'scale-110 -translate-y-0.5' : 'group-hover:scale-105'}`}>
                    {app.icon}
                  </div>
                  <div className={`
                    absolute bottom-1 h-1 rounded-full transition-all duration-300
                    ${settings.taskbar.position === 'top' ? 'top-0' : 'bottom-1'}
                    ${indicatorClass} w-1.5
                  `} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="absolute right-0 h-full flex items-center px-3 gap-2 pointer-events-auto">
         <div 
            className={`flex items-center px-3 py-1.5 gap-2 rounded-lg transition-colors cursor-default ${showQuickSettings ? 'bg-white/10' : 'hover:bg-white/10'}`}
            onClick={() => setShowQuickSettings(!showQuickSettings)}
         >
            <User size={16} className="text-white"/>
         </div>

         <div 
            className={`flex flex-col items-end px-2 py-1 rounded-lg transition-colors cursor-pointer text-right min-w-[70px] ${showWorldClock ? 'bg-white/10' : 'hover:bg-white/10'}`}
            onClick={() => setShowWorldClock(!showWorldClock)}
         >
            <div className="text-xs font-medium text-gray-100 leading-none mb-0.5">
               {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: settings.taskbar.showSeconds ? '2-digit' : undefined })}
            </div>
            <div className="text-[10px] text-gray-400 leading-none">
               {currentTime.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
         </div>
      </div>

      {hoveredApp && renderWindowContent && (
          <div 
             className="fixed z-[60] animate-fade-in origin-bottom"
             style={{
                 left: hoveredApp.rect.left + hoveredApp.rect.width / 2,
                 bottom: settings.taskbar.position === 'bottom' ? 56 : undefined,
                 top: settings.taskbar.position === 'top' ? 56 : undefined,
                 transform: 'translateX(-50%)'
             }}
          >
              <div className="bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-2 pb-1 flex flex-col gap-2">
                  <div className="flex items-center gap-2 px-2 pt-1">
                      {installedApps.find(a => a.id === hoveredApp.id)?.icon}
                      <span className="text-xs font-medium text-gray-200 truncate max-w-[150px]">
                          {getAppStatus(hoveredApp.id).title}
                      </span>
                  </div>
                  <div className="relative min-w-[180px] max-w-[240px] min-h-[120px] max-h-[160px] bg-black rounded-lg overflow-hidden border border-white/5 flex items-center justify-center">
                        {getAppStatus(hoveredApp.id).previewUrl ? (
                            <img 
                                src={getAppStatus(hoveredApp.id).previewUrl} 
                                alt="Preview" 
                                className="w-auto h-auto max-w-full max-h-full object-contain"
                            />
                        ) : (
                            <div className="w-[400%] h-[400%] origin-top-left scale-[0.25] pointer-events-none select-none p-4 opacity-100 absolute top-0 left-0">
                                {
                                    // Special handle for grouped browser - show generic or active
                                    hoveredApp.id === AppId.BROWSER 
                                    ? <div className="text-gray-500 flex items-center justify-center h-full">Grouped Windows</div>
                                    : renderWindowContent(hoveredApp.id)
                                }
                            </div>
                        )}
                  </div>
              </div>
          </div>
      )}

      {showWorldClock && (
        <>
            <div className="fixed inset-0 z-40" onClick={() => setShowWorldClock(false)} />
            <div 
                className={`absolute right-2 z-50 w-72 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl p-4 animate-slide-up text-gray-200
                ${settings.taskbar.position === 'top' ? 'top-14 origin-top-right' : 'bottom-14 origin-bottom-right'}`}
            >
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4 border-b border-white/10 pb-2">World Clock</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-baseline">
                        <span className="text-2xl font-light">Local</span>
                        <div className="text-right">
                            <div className="text-xl font-mono text-indigo-400">
                                {currentTime.toLocaleTimeString()}
                            </div>
                            <div className="text-xs text-gray-500">{currentTime.toLocaleDateString()}</div>
                        </div>
                    </div>
                    <div className="space-y-2 mt-4">
                        {[
                            { city: 'New York', tz: 'America/New_York' },
                            { city: 'London', tz: 'Europe/London' },
                            { city: 'Tokyo', tz: 'Asia/Tokyo' }
                        ].map(loc => (
                            <div key={loc.city} className="flex justify-between items-center text-sm p-2 bg-white/5 rounded-lg">
                                <span className="text-gray-300">{loc.city}</span>
                                <span className="font-mono text-gray-400">
                                    {new Date().toLocaleTimeString('en-US', { timeZone: loc.tz, hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
      )}

      <QuickSettings 
         isOpen={showQuickSettings}
         onClose={() => setShowQuickSettings(false)}
         position={settings.taskbar.position}
         isDarkMode={settings.theme === 'dark'}
         toggleTheme={onToggleTheme}
         onOpenSettings={() => {
             onAppClick(AppId.CONTROL_PANEL);
             setShowQuickSettings(false);
         }}
      />
    </div>
  );
};

// Search Overlay Component
const SearchOverlay: React.FC<{ apps: any[], onClose: () => void, onOpenApp: (id: AppId) => void, position: 'top'|'bottom' }> = ({ apps = [], onClose, onOpenApp, position }) => {
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if(inputRef.current) inputRef.current.focus();
        
        // Click outside listener
        const handleClick = (e: MouseEvent) => {
            if (!(e.target as HTMLElement).closest('.search-overlay')) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const filteredApps = apps.filter(app => app.label.toLowerCase().includes(query.toLowerCase()));

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
        if (e.key === 'Enter' && filteredApps.length > 0) {
            onOpenApp(filteredApps[0].id);
        }
    };

    return (
        <div 
            className={`search-overlay absolute left-0 w-80 bg-[#121212]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-4 z-[80] animate-pop
            ${position === 'top' ? 'top-12' : 'bottom-12'}`}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 mb-3">
                <Search size={16} className="text-indigo-400" />
                <input 
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type to search..."
                    className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-gray-500"
                />
                {query && (
                    <button onClick={() => setQuery('')} className="text-gray-500 hover:text-white"><X size={14}/></button>
                )}
            </div>
            
            <div className="space-y-1 max-h-[240px] overflow-y-auto custom-scrollbar">
                {query.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 text-xs">
                        Type app name to search
                    </div>
                ) : filteredApps.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 text-xs">
                        No apps found
                    </div>
                ) : (
                    <>
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-1">Best Match</div>
                        {filteredApps.map((app, idx) => (
                            <button 
                                key={app.id} 
                                onClick={() => onOpenApp(app.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${idx === 0 ? 'bg-indigo-600/20 text-indigo-100 border border-indigo-500/30' : 'hover:bg-white/5 text-gray-300'}`}
                            >
                                <div className={`${idx === 0 ? 'scale-110' : ''}`}>{app.icon}</div>
                                <span>{app.label}</span>
                            </button>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
};