import React, { useState, useEffect } from 'react';
import { Hexagon, Search, LayoutTemplate, Wifi, Volume2, Battery, ChevronUp } from 'lucide-react';
import { AppId, WindowState, SystemSettings } from '../../types';

interface TaskbarProps {
  installedApps: { id: AppId; label: string; icon: React.ReactNode }[];
  openWindows: Record<AppId, WindowState>;
  activeApp: AppId | null;
  currentDesktop: number;
  settings: SystemSettings;
  currentTime: Date;
  isStartMenuOpen: boolean;
  onToggleStartMenu: () => void;
  onAppClick: (id: AppId) => void;
  onCloseApp: (id: AppId) => void;
  onToggleTaskView: () => void;
  onToggleTheme: () => void;
}

export const Taskbar: React.FC<TaskbarProps> = ({
  installedApps,
  openWindows,
  activeApp,
  currentDesktop,
  settings,
  currentTime,
  isStartMenuOpen,
  onToggleStartMenu,
  onAppClick,
  onCloseApp,
  onToggleTaskView,
  onToggleTheme
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showWorldClock, setShowWorldClock] = useState(false);

  // Auto-hide Logic
  const isHidden = settings.taskbar.autoHide && !isHovered && !isStartMenuOpen && !showWorldClock;
  const positionClass = settings.taskbar.position === 'top' ? 'top-0 border-b' : 'bottom-0 border-t';
  
  // Transform logic for hiding
  const transformStyle = isHidden 
    ? (settings.taskbar.position === 'top' ? 'translateY(-100%)' : 'translateY(100%)')
    : 'translateY(0)';

  // Group windows by AppId for indicators
  const getAppStatus = (id: AppId) => {
    const win = openWindows[id];
    return {
      isOpen: win.isOpen,
      isActive: activeApp === id,
      isOnCurrentDesktop: win.desktopId === currentDesktop
    };
  };

  // Apps to show on taskbar (Installed + Open but not installed?)
  // For simplicity, we stick to INSTALLED_APPS as the pinned list
  const pinnedApps = installedApps;

  return (
    <div 
      className={`fixed left-0 right-0 h-12 z-50 bg-glass-panel backdrop-blur-xl border-white/10 transition-transform duration-300 ease-in-out flex items-center ${positionClass}`}
      style={{ transform: transformStyle }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onContextMenu={(e) => e.preventDefault()} // Prevent default browser context menu
    >
      
      {/* --- Main Content Area (Start + Apps) --- */}
      {/* We use absolute positioning for the center/start group to ensure true centering if requested, while keeping Tray on the right */}
      <div 
        className={`absolute inset-0 flex items-center px-2 pointer-events-none ${
          settings.taskbar.alignment === 'center' ? 'justify-center' : 'justify-start'
        }`}
      >
        <div className="flex items-center gap-2 pointer-events-auto">
          
          {/* Start Button */}
          <button
            onClick={onToggleStartMenu}
            className={`
              p-2 rounded transition-all duration-300 group relative
              ${isStartMenuOpen ? 'bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'hover:bg-white/10'}
            `}
            title="Start"
          >
            <Hexagon 
              size={24} 
              className={`transition-transform duration-500 ${isStartMenuOpen ? 'text-white rotate-90' : 'text-indigo-400 group-hover:rotate-180'}`} 
              fill={isStartMenuOpen ? "currentColor" : "none"}
            />
          </button>

          {/* Search Button (Optional) */}
          {settings.taskbar.showSearch && (
            <button className="flex items-center gap-2 px-3 py-1.5 bg-black/20 hover:bg-white/10 border border-white/5 rounded-full text-gray-400 hover:text-white transition-colors text-xs w-32 group">
               <Search size={14} />
               <span className="opacity-70 group-hover:opacity-100">Search...</span>
            </button>
          )}

          {/* Task View */}
          <button 
            onClick={onToggleTaskView}
            className="p-2 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Task View"
          >
            <LayoutTemplate size={18} />
          </button>

          {/* Separator */}
          <div className="w-px h-6 bg-white/10 mx-1" />

          {/* App Icons */}
          <div className="flex items-center gap-1">
            {pinnedApps.map(app => {
              const status = getAppStatus(app.id);
              
              // Visual Indicator Logic
              let indicatorClass = "scale-0 opacity-0";
              if (status.isOpen) {
                  indicatorClass = "scale-100 opacity-100 bg-gray-400"; // Open
                  if (status.isOnCurrentDesktop) indicatorClass = "scale-100 opacity-100 bg-white"; // On Desktop
                  if (status.isActive) indicatorClass = "scale-100 opacity-100 bg-indigo-500 w-4"; // Active (Wide)
              }

              return (
                <button
                  key={app.id}
                  onClick={() => onAppClick(app.id)}
                  className={`
                    relative group flex items-center justify-center w-10 h-10 rounded hover:bg-white/10 transition-all
                    ${status.isActive ? 'bg-white/5' : ''}
                  `}
                  title={app.label}
                >
                  <div className={`transition-transform duration-200 ${status.isActive ? 'scale-110 -translate-y-0.5' : 'group-hover:scale-105'}`}>
                    {app.icon}
                  </div>
                  
                  {/* Status Dot/Bar */}
                  <div className={`
                    absolute bottom-1 h-1 rounded-full transition-all duration-300
                    ${settings.taskbar.position === 'top' ? 'top-0' : 'bottom-1'}
                    ${indicatorClass} w-1.5
                  `} />
                  
                  {/* Tooltip-ish indicator if needed, but we stick to native title for now */}
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* --- System Tray (Always Right) --- */}
      <div className="absolute right-0 h-full flex items-center px-3 gap-2 pointer-events-auto">
         
         {/* Hidden Icons Expand */}
         <button className="p-1 hover:bg-white/10 rounded text-gray-400">
            <ChevronUp size={14} />
         </button>

         {/* System Status Icons */}
         <div className="flex items-center px-2 py-1 gap-2 hover:bg-white/10 rounded transition-colors cursor-default">
            <Wifi size={14} className="text-white"/>
            <Volume2 size={14} className="text-white"/>
            <Battery size={14} className="text-white"/>
         </div>

         {/* Clock */}
         <div 
            className="flex flex-col items-end px-2 py-1 hover:bg-white/10 rounded transition-colors cursor-pointer text-right min-w-[70px]"
            onClick={() => setShowWorldClock(!showWorldClock)}
         >
            <div className="text-xs font-medium text-gray-100 leading-none mb-0.5">
               {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: settings.taskbar.showSeconds ? '2-digit' : undefined })}
            </div>
            <div className="text-[10px] text-gray-400 leading-none">
               {currentTime.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
         </div>

         {/* Show Desktop Sliver */}
         <div className="w-1 h-full border-l border-white/10 ml-2 hover:bg-white/20 cursor-pointer" title="Show Desktop"></div>
      </div>

      {/* World Clock Popup */}
      {showWorldClock && (
        <>
            <div className="fixed inset-0 z-40" onClick={() => setShowWorldClock(false)} />
            <div 
                className={`absolute right-2 z-50 w-72 bg-glass-dark backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl p-4 animate-slide-up text-gray-200
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

    </div>
  );
};