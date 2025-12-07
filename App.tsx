import React, { useState, useEffect } from 'react';
import { MessageSquare, Image as ImageIcon, Info, Hexagon, Settings, Folder, FileText, Sun, Moon } from 'lucide-react';
import { Window } from './components/ui/Window';
import { StartMenu } from './components/ui/StartMenu';
import { Taskbar } from './components/ui/Taskbar';
import { TaskView } from './components/ui/TaskView';
import { AppId, WindowState, SystemSettings, UserProfile } from './types';
// import { ButlerChat } from './components/apps/ButlerChat';
import { GalleryApp } from './components/apps/GalleryApp';
import { AboutApp } from './components/apps/AboutApp';
import { PictureViewerApp } from './components/apps/PictureViewerApp';
import { FileManagerApp } from './components/apps/FileManagerApp';
import { ControlPanelApp } from './components/apps/ControlPanelApp';
import { TextEditorApp } from './components/apps/TextEditorApp';
import { fsService } from './services/fileSystemService';

// --- APP REGISTRY ---
const INSTALLED_APPS = [
  // { id: AppId.CHAT, label: 'Rakko AI Assistant', icon: <MessageSquare size={20} className="text-indigo-400" /> },
  { id: AppId.FILE_MANAGER, label: 'File Manager', icon: <Folder size={20} className="text-yellow-400" /> },
  { id: AppId.TEXT_EDITOR, label: 'Text Editor', icon: <FileText size={20} className="text-emerald-400" /> },
  { id: AppId.GALLERY, label: 'Gallery', icon: <ImageIcon size={20} className="text-purple-400" /> },
  { id: AppId.CONTROL_PANEL, label: 'Control Panel', icon: <Settings size={20} className="text-gray-400" /> },
  { id: AppId.ABOUT, label: 'About Rakko', icon: <Info size={20} className="text-blue-400" /> },
];

const INITIAL_WINDOWS: Record<AppId, WindowState> = {
  [AppId.CHAT]: { id: AppId.CHAT, isOpen: false, isMinimized: false, zIndex: 1, position: { x: 100, y: 100 }, desktopId: 0 },
  [AppId.GALLERY]: { id: AppId.GALLERY, isOpen: false, isMinimized: false, zIndex: 1, position: { x: 150, y: 150 }, desktopId: 0 },
  [AppId.ABOUT]: { id: AppId.ABOUT, isOpen: false, isMinimized: false, zIndex: 1, position: { x: 200, y: 200 }, desktopId: 0 },
  [AppId.SETTINGS]: { id: AppId.SETTINGS, isOpen: false, isMinimized: false, zIndex: 1, position: { x: 250, y: 250 }, desktopId: 0 },
  [AppId.PICTURE_VIEWER]: { id: AppId.PICTURE_VIEWER, isOpen: false, isMinimized: false, zIndex: 1, position: { x: 300, y: 100 }, desktopId: 0 },
  [AppId.FILE_MANAGER]: { id: AppId.FILE_MANAGER, isOpen: false, isMinimized: false, zIndex: 1, position: { x: 120, y: 120 }, desktopId: 0 },
  [AppId.CONTROL_PANEL]: { id: AppId.CONTROL_PANEL, isOpen: false, isMinimized: false, zIndex: 1, position: { x: 180, y: 180 }, desktopId: 0 },
  [AppId.TEXT_EDITOR]: { id: AppId.TEXT_EDITOR, isOpen: false, isMinimized: false, zIndex: 1, position: { x: 220, y: 150 }, desktopId: 0 },
};

const App: React.FC = () => {
  const [windows, setWindows] = useState<Record<AppId, WindowState>>(INITIAL_WINDOWS);
  const [activeApp, setActiveApp] = useState<AppId | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  
  // New States for Task View & Desktops
  const [isTaskViewOpen, setIsTaskViewOpen] = useState(false);
  const [currentDesktop, setCurrentDesktop] = useState(0); // 0 or 1

  // --- Global System State ---
  const [settings, setSettings] = useState<SystemSettings>({
    wallpaper: 'https://static.rakko.cn/RakkoWorkplaceAssets/Pic/Wall.png',
    accentColor: 'indigo',
    theme: (localStorage.getItem('theme') as 'dark'|'light') || 'dark'
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>({
    name: 'Rakko Admin',
    role: 'Administrator',
    avatarColor: 'bg-indigo-500'
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Theme effect
  useEffect(() => {
    const root = document.getElementById('root');
    if (root) {
        if (settings.theme === 'light') {
            root.classList.add('light-mode');
        } else {
            root.classList.remove('light-mode');
        }
    }
    localStorage.setItem('theme', settings.theme);
  }, [settings.theme]);

  const toggleTheme = () => {
      setSettings(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
  };

  const bringToFront = (id: AppId) => {
    setWindows(prev => {
      const windowsList = Object.values(prev) as WindowState[];
      const maxZ = Math.max(0, ...windowsList.map(w => w.zIndex));
      // If already on top and active, do nothing
      if (prev[id].zIndex === maxZ && activeApp === id) return prev;
      
      return {
        ...prev,
        [id]: { ...prev[id], zIndex: maxZ + 1 }
      };
    });
    setActiveApp(id);
  };

  const openApp = (id: AppId, data?: any) => {
    setWindows(prev => {
      const isOpen = prev[id].isOpen;
      
      return {
        ...prev,
        [id]: { 
          ...prev[id], 
          isOpen: true, 
          isMinimized: false,
          desktopId: currentDesktop, // Bring to current desktop
          data: data !== undefined ? data : prev[id].data 
        }
      };
    });
    bringToFront(id);
    setIsStartMenuOpen(false);
  };

  const closeApp = (id: AppId) => {
    setWindows(prev => ({
      ...prev,
      [id]: { ...prev[id], isOpen: false }
    }));
    if (activeApp === id) setActiveApp(null);
  };

  const minimizeApp = (id: AppId) => {
    setWindows(prev => ({
      ...prev,
      [id]: { ...prev[id], isMinimized: true }
    }));
    if (activeApp === id) setActiveApp(null);
  };

  const moveWindowToDesktop = (id: AppId, desktopId: number) => {
    setWindows(prev => ({
        ...prev,
        [id]: { ...prev[id], desktopId }
    }));
  };
  
  // Logic for Taskbar Clicks
  const handleTaskbarAppClick = (id: AppId) => {
    const w = windows[id];
    
    if (!w.isOpen) {
        // Case 1: Open it
        openApp(id);
    } else if (w.isMinimized) {
        // Case 2: Restore
        setWindows(prev => ({ ...prev, [id]: { ...prev[id], isMinimized: false, desktopId: currentDesktop } }));
        bringToFront(id);
    } else if (w.desktopId !== currentDesktop) {
        // Case 3: Open on another desktop -> Move here (or switch desktop? Moving is easier for now)
        setWindows(prev => ({ ...prev, [id]: { ...prev[id], desktopId: currentDesktop } }));
        bringToFront(id);
    } else if (activeApp === id) {
        // Case 4: Is Active -> Minimize
        minimizeApp(id);
    } else {
        // Case 5: Background -> Foreground
        bringToFront(id);
    }
  };

  const renderAppContent = (id: AppId, data?: any) => {
    switch (id) {
      // case AppId.CHAT: return <ButlerChat />;
      case AppId.GALLERY: 
        return <GalleryApp onOpenImage={(url, title) => openApp(AppId.PICTURE_VIEWER, { url, title })} />;
      case AppId.ABOUT: return <AboutApp />;
      case AppId.PICTURE_VIEWER: 
        return <PictureViewerApp initialImage={data?.url} initialTitle={data?.title} />;
      case AppId.FILE_MANAGER:
        return <FileManagerApp onOpenFile={(file, path) => {
          if (file.fileType === 'image' && file.url) {
            openApp(AppId.PICTURE_VIEWER, { url: file.url, title: file.name });
          } else if (file.fileType === 'text') {
            openApp(AppId.TEXT_EDITOR, { initialPath: path, initialFileName: file.name });
          }
        }} />;
      case AppId.TEXT_EDITOR:
        return <TextEditorApp initialPath={data?.initialPath} initialFileName={data?.initialFileName} />;
      case AppId.CONTROL_PANEL: 
        return <ControlPanelApp 
          settings={settings} 
          user={currentUser}
          onUpdateSettings={(newSettings) => setSettings(prev => ({...prev, ...newSettings}))} 
          onUpdateUser={setCurrentUser}
        />;
      default: return null;
    }
  };

  const getWindowTitle = (windowState: WindowState) => {
    if (windowState.id === AppId.PICTURE_VIEWER && windowState.data?.title) {
      return `Viewer - ${windowState.data.title}`;
    }
    if (windowState.id === AppId.TEXT_EDITOR && windowState.data?.initialFileName) {
        return `Editor - ${windowState.data.initialFileName}`;
    }
    const appDef = INSTALLED_APPS.find(a => a.id === windowState.id);
    return appDef ? appDef.label : windowState.id;
  };

  return (
    <div 
      className="relative w-screen h-screen overflow-hidden bg-cover bg-center select-none font-sans transition-all duration-700 ease-in-out"
      style={{ 
        backgroundImage: `url('${settings.wallpaper}')`,
      }}
    >
      <div className="absolute inset-0 bg-glass-bg/20 pointer-events-none" />

      {/* Desktop Icons */}
      <div className="absolute top-8 left-8 flex flex-col gap-6 z-0">
        {INSTALLED_APPS.map(app => (
            <DesktopIcon 
                key={app.id}
                label={app.label} 
                icon={app.icon} 
                onClick={() => openApp(app.id)} 
                accentColor={settings.accentColor}
            />
        ))}
      </div>

      {/* Windows */}
      {(Object.values(windows) as WindowState[]).map(windowState => {
          const isOnCurrentDesktop = windowState.desktopId === currentDesktop;
          
          return (
            <div key={windowState.id} style={{ display: isOnCurrentDesktop ? 'block' : 'none' }}>
                <Window
                id={windowState.id}
                title={getWindowTitle(windowState)}
                isOpen={windowState.isOpen}
                isMinimized={windowState.isMinimized}
                zIndex={windowState.zIndex}
                isActive={activeApp === windowState.id}
                onClose={closeApp}
                onMinimize={minimizeApp}
                onFocus={bringToFront}
                initialSize={windowState.id === AppId.CHAT ? { width: 400, height: 600 } : undefined}
                >
                {renderAppContent(windowState.id, windowState.data)}
                </Window>
            </div>
          );
      })}

      {/* Start Menu */}
      <StartMenu 
        isOpen={isStartMenuOpen}
        user={currentUser}
        apps={INSTALLED_APPS}
        onOpenApp={openApp}
        onShutdown={() => {
            alert("Shutting down Rakko Workplace...");
            window.location.reload();
        }}
        onClose={() => setIsStartMenuOpen(false)}
      />

      {/* Task View Overlay */}
      <TaskView 
        isOpen={isTaskViewOpen}
        windows={Object.values(windows)}
        apps={INSTALLED_APPS.map(app => ({...app, title: app.label, component: null}))}
        currentDesktop={currentDesktop}
        onClose={() => setIsTaskViewOpen(false)}
        onSelectWindow={(id) => {
            handleTaskbarAppClick(id); // Activates window
        }}
        onCloseWindow={closeApp}
        onSwitchDesktop={setCurrentDesktop}
        onMoveWindowToDesktop={moveWindowToDesktop}
        renderWindowContent={(id) => {
           return (
            <div className="w-full h-full bg-slate-900 text-slate-200 rounded-lg overflow-hidden relative pointer-events-none">
                {renderAppContent(id, windows[id].data)}
            </div>
           );
        }}
      />

      {/* Taskbar */}
      <Taskbar 
        installedApps={INSTALLED_APPS}
        openWindows={windows}
        activeApp={activeApp}
        currentDesktop={currentDesktop}
        settings={settings}
        currentTime={currentTime}
        isStartMenuOpen={isStartMenuOpen}
        onToggleStartMenu={() => setIsStartMenuOpen(!isStartMenuOpen)}
        onAppClick={handleTaskbarAppClick}
        onCloseApp={closeApp}
        onToggleTaskView={() => setIsTaskViewOpen(!isTaskViewOpen)}
        onToggleTheme={toggleTheme}
      />
      
    </div>
  );
};

// Desktop Icon Helper
const DesktopIcon: React.FC<{ label: string; icon: React.ReactNode; onClick: () => void; accentColor: string }> = ({ label, icon, onClick, accentColor }) => (
  <button 
    onClick={onClick}
    className="group flex flex-col items-center gap-2 w-24 p-2 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:bg-white/20"
  >
    <div className={`w-14 h-14 rounded-xl bg-glass-panel flex items-center justify-center shadow-lg border border-glass-border group-hover:scale-105 transition-transform duration-200 text-${accentColor}-400 group-hover:text-${accentColor}-300`}>
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 28 }) : icon}
    </div>
    <span className="text-white text-xs font-medium text-shadow-sm bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm border border-transparent group-hover:border-white/10">
      {label}
    </span>
  </button>
);

export default App;