import React, { useState, useRef, useEffect } from 'react';
import { Hexagon, LayoutTemplate, Moon, Sun, X, Minus, Maximize2, Search, Clock, Globe } from 'lucide-react';
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
  // --- State ---
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; appId: AppId } | null>(null);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(installedApps);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // World Clock State
  const [showWorldClock, setShowWorldClock] = useState(false);

  // --- Refs ---
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLButtonElement>(null);
  const clockPopupRef = useRef<HTMLDivElement>(null);

  // --- Effects ---

  // Handle Search Filtering
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
    } else {
      const query = searchQuery.toLowerCase();
      const results = installedApps.filter(app => 
        app.label.toLowerCase().includes(query)
      );
      setSearchResults(results);
    }
  }, [searchQuery, installedApps]);

  // Global Click Listener (Close menus)
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;

      // Close Context Menu
      if (contextMenuRef.current && !contextMenuRef.current.contains(target)) {
        setContextMenu(null);
      }

      // Close Search Results if clicked outside
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setIsSearchFocused(false);
      }

      // Close World Clock if clicked outside
      if (
        showWorldClock && 
        clockRef.current && 
        !clockRef.current.contains(target) && 
        clockPopupRef.current && 
        !clockPopupRef.current.contains(target)
      ) {
        setShowWorldClock(false);
      }
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [showWorldClock]);

  // --- Handlers ---

  const handleRightClick = (e: React.MouseEvent, appId: AppId) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, appId });
  };

  const handleSearchResultClick = (appId: AppId) => {
      onAppClick(appId);
      setSearchQuery('');
      setIsSearchFocused(false);
  };

  const getAccentColorStyle = () => {
    const map: Record<string, string> = {
      indigo: '#6366f1',
      rose: '#f43f5e',
      emerald: '#10b981',
      amber: '#f59e0b',
      purple: '#a855f7',
      blue: '#3b82f6',
    };
    return map[settings.accentColor] || '#6366f1';
  };

  const accentColor = getAccentColorStyle();

  // Filter apps to only show those that are open
  const runningApps = installedApps.filter(app => openWindows[app.id]?.isOpen);

  // World Clock Helper
  const getWorldTime = (offset: number) => {
      const d = new Date();
      const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
      const nd = new Date(utc + (3600000 * offset));
      return nd.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <>
      {/* Main Bar Container */}
      <div className="fixed bottom-0 left-0 right-0 h-12 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/10 flex items-center justify-between z-[100] select-none text-gray-200 shadow-2xl">
        
        {/* LEFT SECTION: Start, Search, Task View, Apps */}
        <div className="flex h-full items-center flex-1 min-w-0">
            
            {/* Start Button */}
            <button 
              onClick={onToggleStartMenu}
              className={`h-full w-12 flex items-center justify-center transition-colors hover:bg-white/10 hover:text-blue-400 ${isStartMenuOpen ? 'bg-white/10 text-blue-400' : 'text-gray-200'}`}
              title="Start"
            >
              <Hexagon size={20} className={isStartMenuOpen ? 'fill-blue-500/20' : ''} />
            </button>

            {/* Functional Search Box */}
            <div 
                ref={searchContainerRef}
                className="h-full flex items-center relative z-50"
            >
                 <div className={`
                    hidden md:flex items-center h-[70%] w-64 ml-2 px-3 rounded-md transition-all duration-200
                    ${isSearchFocused ? 'bg-white text-black ring-2 ring-blue-500' : 'bg-white/10 hover:bg-white/15 text-gray-300'}
                 `}>
                    <Search size={16} className={`mr-2 ${isSearchFocused ? 'text-gray-500' : 'opacity-70'}`} />
                    <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setIsSearchFocused(true);
                        }}
                        onFocus={() => setIsSearchFocused(true)}
                        placeholder="Search apps..."
                        className="bg-transparent border-none outline-none text-sm w-full placeholder:text-current placeholder:opacity-50"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="p-1 hover:bg-black/10 rounded-full">
                            <X size={12} />
                        </button>
                    )}
                 </div>

                 {/* Mobile Search Icon (when input hidden) */}
                 <button 
                    onClick={() => { /* Mobile search logic could go here */ }} 
                    className="md:hidden h-full w-12 flex items-center justify-center hover:bg-white/10"
                 >
                    <Search size={18} />
                 </button>

                 {/* Search Results Dropdown */}
                 {isSearchFocused && searchQuery && (
                     <div className="absolute bottom-14 left-2 w-72 bg-[#1f1f1f]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl overflow-hidden animate-slide-up flex flex-col">
                        <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">
                            Best Match
                        </div>
                        {searchResults.length > 0 ? (
                            <div className="p-1">
                                {searchResults.map(app => (
                                    <button
                                        key={app.id}
                                        onClick={() => handleSearchResultClick(app.id)}
                                        className="w-full text-left px-3 py-2 rounded hover:bg-white/10 flex items-center gap-3 transition-colors group"
                                    >
                                        <div className="p-1.5 bg-gray-800 rounded border border-white/10 group-hover:border-blue-500/50 transition-colors">
                                            {React.cloneElement(app.icon as React.ReactElement<any>, { size: 16 })}
                                        </div>
                                        <span className="text-sm font-medium text-gray-200 group-hover:text-white">{app.label}</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 text-center text-sm text-gray-500">
                                No apps found for "{searchQuery}"
                            </div>
                        )}
                     </div>
                 )}
            </div>

            {/* Task View Button */}
            <button 
              onClick={onToggleTaskView}
              className="h-full w-12 flex items-center justify-center hover:bg-white/10 transition-colors"
              title="Task View"
            >
              <LayoutTemplate size={18} />
            </button>

            {/* App Icons (Running Apps Only) */}
            <div className="flex h-full items-center ml-1">
              {runningApps.map((app) => {
                const windowState = openWindows[app.id];
                const isOpen = windowState?.isOpen;
                const isVisibleOnDesktop = isOpen && windowState.desktopId === currentDesktop;
                const isActive = activeApp === app.id && !windowState.isMinimized && isVisibleOnDesktop;
                
                return (
                  <div key={app.id} className="h-full relative group">
                    <button
                      onClick={() => onAppClick(app.id)}
                      onContextMenu={(e) => handleRightClick(e, app.id)}
                      className={`
                        h-full w-12 flex items-center justify-center relative transition-all
                        ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}
                        ${!isVisibleOnDesktop ? 'opacity-50' : ''} 
                      `}
                    >
                        <div className={`transition-transform duration-200 ${isActive ? 'scale-100' : 'scale-90 opacity-80 group-hover:opacity-100'}`}>
                           {React.cloneElement(app.icon as React.ReactElement<any>, { size: 22 })}
                        </div>
                    </button>
                    
                    {/* Active Indicator */}
                    {isOpen && (
                        <div 
                            className={`absolute bottom-0 left-0 right-0 h-[3px] transition-all duration-300 ${isActive ? 'w-full' : 'w-1/3 left-1/3 right-1/3 group-hover:w-full group-hover:left-0 group-hover:right-0'}`}
                            style={{ backgroundColor: isVisibleOnDesktop ? accentColor : '#6b7280' }}
                        />
                    )}
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-[#2b2b2b] text-white text-xs border border-white/10 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 delay-700">
                      {app.label}
                    </div>
                  </div>
                );
              })}
            </div>
        </div>

        {/* RIGHT SECTION: Simplified Tray */}
        <div className="flex h-full items-center text-xs pr-2">

            {/* Theme Toggle */}
            <button 
                onClick={onToggleTheme}
                className="h-full w-10 flex items-center justify-center hover:bg-white/10 text-gray-400 hover:text-white transition-colors rounded-md my-1 mr-1"
                title="Toggle Theme"
            >
                {settings.theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            {/* Interactive World Clock */}
            <button 
                ref={clockRef}
                onClick={() => setShowWorldClock(!showWorldClock)}
                className={`
                    h-[85%] px-3 flex flex-col justify-center items-end rounded-md transition-colors min-w-[80px] group border border-transparent
                    ${showWorldClock ? 'bg-white/10 border-white/5' : 'hover:bg-white/10'}
                `}
            >
                <span className="text-sm font-medium leading-tight text-gray-200">{currentTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                <span className="text-[10px] leading-tight text-gray-500 group-hover:text-gray-400">{currentTime.toLocaleDateString()}</span>
            </button>
        </div>

      </div>

      {/* World Clock Popover */}
      {showWorldClock && (
          <div 
            ref={clockPopupRef}
            className="fixed bottom-14 right-2 w-72 bg-[#1a1a1a]/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] z-[90] animate-slide-up text-gray-200 overflow-hidden"
          >
             <div className="p-4 border-b border-white/10 bg-white/5">
                 <div className="flex items-center gap-2 mb-1 text-indigo-400">
                     <Clock size={16} />
                     <span className="text-xs font-bold uppercase tracking-widest">Local Time</span>
                 </div>
                 <div className="text-4xl font-light font-sans tracking-tight">
                    {currentTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
                 </div>
                 <div className="text-sm text-gray-400 mt-1">
                    {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                 </div>
             </div>
             
             <div className="p-2 bg-black/20">
                 <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                     <Globe size={12}/> World Clock
                 </div>
                 <div className="space-y-1">
                     <WorldClockItem city="New York" time={getWorldTime(-5)} code="NYC" />
                     <WorldClockItem city="London" time={getWorldTime(0)} code="LDN" />
                     <WorldClockItem city="Tokyo" time={getWorldTime(9)} code="TYO" />
                     <WorldClockItem city="UTC" time={getWorldTime(0)} code="UTC" isUtc />
                 </div>
             </div>
          </div>
      )}

      {/* Context Menu (Taskbar Item) */}
      {contextMenu && (
        <div 
          ref={contextMenuRef}
          className="fixed z-[9999] w-48 bg-[#1f1f1f] border border-[#333] shadow-2xl py-1 animate-pop text-sm text-gray-200 select-none rounded-lg"
          style={{ 
             left: contextMenu.x, 
             top: contextMenu.y - 120 
          }}
        >
           <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider bg-[#1a1a1a] border-b border-[#333]">
              {installedApps.find(a => a.id === contextMenu.appId)?.label}
           </div>
           
           {openWindows[contextMenu.appId]?.isOpen ? (
             <>
                <button 
                  onClick={() => { onAppClick(contextMenu.appId); setContextMenu(null); }}
                  className="w-full text-left px-4 py-3 hover:bg-[#333] flex items-center gap-3 transition-colors"
                >
                  {openWindows[contextMenu.appId].isMinimized ? <Maximize2 size={14} /> : <Minus size={14} />}
                  {openWindows[contextMenu.appId].isMinimized ? 'Restore' : 'Minimize'}
                </button>
                <button 
                  onClick={() => { onCloseApp(contextMenu.appId); setContextMenu(null); }}
                  className="w-full text-left px-4 py-3 hover:bg-[#333] flex items-center gap-3 transition-colors text-red-400 hover:text-red-300"
                >
                  <X size={14} />
                  Close window
                </button>
             </>
           ) : (
             <button 
                onClick={() => { onAppClick(contextMenu.appId); setContextMenu(null); }}
                className="w-full text-left px-4 py-3 hover:bg-[#333] flex items-center gap-3 transition-colors"
              >
                <Maximize2 size={14} />
                Open
              </button>
           )}
        </div>
      )}
    </>
  );
};

// Helper Component for World Clock List
const WorldClockItem = ({ city, time, code, isUtc = false }: { city: string, time: string, code: string, isUtc?: boolean }) => (
    <div className="flex items-center justify-between px-3 py-2 rounded hover:bg-white/5 transition-colors group">
        <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-300 group-hover:text-white">{city}</span>
            <span className="text-[10px] text-gray-600 font-mono">{code}</span>
        </div>
        <div className={`text-sm font-mono ${isUtc ? 'text-indigo-400' : 'text-gray-400 group-hover:text-gray-300'}`}>
            {time}
        </div>
    </div>
);