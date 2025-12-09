import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, Image as ImageIcon, Info, Hexagon, Settings, Folder, FileText, Sun, Moon, HelpCircle, Monitor, Grid, Type, Calendar, HardDrive, Plus, RefreshCw, Check, Trash2, X, Maximize2, Edit3, ExternalLink, Pin, PinOff, Activity, LayoutTemplate } from 'lucide-react';
import { Window } from './components/ui/Window';
import { StartMenu } from './components/ui/StartMenu';
import { Taskbar } from './components/ui/Taskbar';
import { TaskView } from './components/ui/TaskView';
import { ContextMenu } from './components/ui/ContextMenu';
import { AppId, WindowState, SystemSettings, UserProfile, FileSystemItem, MenuItem } from './types';
import { GalleryApp } from './components/apps/GalleryApp';
import { AboutApp } from './components/apps/AboutApp';
import { PictureViewerApp } from './components/apps/PictureViewerApp';
import { FileManagerApp } from './components/apps/FileManagerApp';
import { ControlPanelApp } from './components/apps/ControlPanelApp';
import { TextEditorApp } from './components/apps/TextEditorApp';
import { HelpApp } from './components/apps/HelpApp';
import { TaskManagerApp } from './components/apps/TaskManagerApp';
import { fsService } from './services/fileSystemService';
import { processRegistry } from './services/processRegistry';
import { useSystemProcess } from './hooks/useSystemProcess';

// --- APP REGISTRY ---
const INSTALLED_APPS = [
  { id: AppId.PICTURE_VIEWER, label: 'Picture Studio', icon: <ImageIcon size={20} className="text-pink-400" /> },
  { id: AppId.HELP, label: 'Help Center', icon: <HelpCircle size={20} className="text-orange-400" /> },
  { id: AppId.FILE_MANAGER, label: 'File Manager', icon: <Folder size={20} className="text-yellow-400" /> },
  { id: AppId.TEXT_EDITOR, label: 'Text Editor', icon: <FileText size={20} className="text-emerald-400" /> },
  { id: AppId.GALLERY, label: 'Gallery', icon: <Grid size={20} className="text-purple-400" /> },
  { id: AppId.CONTROL_PANEL, label: 'Control Panel', icon: <Settings size={20} className="text-gray-400" /> },
  { id: AppId.TASK_MANAGER, label: 'Task Manager', icon: <Activity size={20} className="text-blue-500" /> },
  { id: AppId.ABOUT, label: 'About Rakko', icon: <Info size={20} className="text-blue-400" /> },
];

const INITIAL_WINDOWS: Record<AppId, WindowState> = {
  [AppId.CHAT]: { id: AppId.CHAT, isOpen: false, isMinimized: false, zIndex: 1, position: { x: 100, y: 100 }, desktopId: 0 },
  [AppId.GALLERY]: { id: AppId.GALLERY, isOpen: false, isMinimized: false, zIndex: 1, position: { x: 150, y: 150 }, desktopId: 0 },
  [AppId.ABOUT]: { id: AppId.ABOUT, isOpen: false, isMinimized: false, zIndex: 1, position: { x: 200, y: 200 }, desktopId: 0 },
  [AppId.SETTINGS]: { id: AppId.CONTROL_PANEL, isOpen: false, isMinimized: false, zIndex: 1, position: { x: 250, y: 250 }, desktopId: 0 },
  [AppId.PICTURE_VIEWER]: { id: AppId.PICTURE_VIEWER, isOpen: false, isMinimized: false, zIndex: 1, position: { x: 300, y: 100 }, desktopId: 0 },
  [AppId.FILE_MANAGER]: { id: AppId.FILE_MANAGER, isOpen: false, isMinimized: false, zIndex: 1, position: { x: 120, y: 120 }, desktopId: 0 },
  [AppId.CONTROL_PANEL]: { id: AppId.CONTROL_PANEL, isOpen: false, isMinimized: false, zIndex: 1, position: { x: 180, y: 180 }, desktopId: 0 },
  [AppId.TEXT_EDITOR]: { id: AppId.TEXT_EDITOR, isOpen: false, isMinimized: false, zIndex: 1, position: { x: 220, y: 150 }, desktopId: 0 },
  [AppId.HELP]: { id: AppId.HELP, isOpen: false, isMinimized: false, zIndex: 1, position: { x: 80, y: 80 }, desktopId: 0 },
  [AppId.TASK_MANAGER]: { id: AppId.TASK_MANAGER, isOpen: false, isMinimized: false, zIndex: 1, position: { x: 100, y: 100 }, desktopId: 0 },
};

type IconSize = 'small' | 'medium' | 'large';
type SortOption = 'name' | 'size' | 'date';

const App: React.FC = () => {
  // Register Kernel Process
  useSystemProcess({
    id: 'kernel',
    name: 'Rakko Kernel',
    type: 'kernel'
  });

  const [windows, setWindows] = useState<Record<AppId, WindowState>>(INITIAL_WINDOWS);
  const [activeApp, setActiveApp] = useState<AppId | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  
  // New States for Task View & Desktops
  const [isTaskViewOpen, setIsTaskViewOpen] = useState(false);
  const [currentDesktop, setCurrentDesktop] = useState(0); // 0 or 1

  // Disabled processes (Components that have been killed by Task Manager)
  const [disabledProcesses, setDisabledProcesses] = useState<Set<string>>(new Set());

  // Desktop Files State
  const [desktopFiles, setDesktopFiles] = useState<FileSystemItem[]>([]);
  
  // Desktop Configuration State
  const [iconSize, setIconSize] = useState<IconSize>('medium');
  const [sortOption, setSortOption] = useState<SortOption>('name');
  const [iconPositions, setIconPositions] = useState<Record<string, {x: number, y: number}>>({});
  
  // Taskbar Pinned Apps State
  const [pinnedAppIds, setPinnedAppIds] = useState<AppId[]>(() => {
    const saved = localStorage.getItem('rakko_pinned_apps');
    if (saved) {
        try { return JSON.parse(saved); } catch { return []; }
    }
    return [AppId.FILE_MANAGER, AppId.TEXT_EDITOR, AppId.PICTURE_VIEWER];
  });

  // Context Menu State (Unified)
  const [activeContextMenu, setActiveContextMenu] = useState<{
      type: 'desktop' | 'icon' | 'taskbar' | 'start';
      x: number;
      y: number;
      data?: any;
  } | null>(null);

  const [renamingItemId, setRenamingItemId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');
  
  // Drag Over state for Desktop Background Drop
  const [isDragOverDesktop, setIsDragOverDesktop] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // --- Global System State ---
  const [settings, setSettings] = useState<SystemSettings>({
    wallpaper: 'https://static.rakko.cn/RakkoWorkplaceAssets/Pic/Wall.png',
    accentColor: 'indigo',
    theme: (localStorage.getItem('theme') as 'dark'|'light') || 'dark',
    taskbar: {
      alignment: 'left',
      position: 'bottom',
      showSearch: true,
      showSeconds: false,
      autoHide: false
    }
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>({
    name: 'Rakko Admin',
    role: 'Administrator',
    avatarColor: 'bg-indigo-500'
  });

  // --- Process Registry Command Listener ---
  useEffect(() => {
    const unsubscribe = processRegistry.onCommand((id, command) => {
      console.log(`[Kernel] Received command: ${command} for ${id}`);

      // Handle Component mounting/unmounting based on ID
      if (command === 'stop') {
         // UI Components
         if (id === 'ui:taskbar' || id === 'ui:desktop' || id === 'ui:start-menu') {
            setDisabledProcesses(prev => new Set(prev).add(id));
         }
         // Apps
         if (id.startsWith('app:')) {
            const appId = id.replace('app:', '') as AppId;
            closeApp(appId);
         }
      } 
      else if (command === 'restart') {
         // Generic Restart Logic
         
         // 1. Kill
         if (id === 'ui:taskbar' || id === 'ui:desktop' || id === 'ui:start-menu') {
            setDisabledProcesses(prev => new Set(prev).add(id));
         } else if (id.startsWith('app:')) {
            closeApp(id.replace('app:', '') as AppId);
         }

         // 2. Wait and Revive
         setTimeout(() => {
            if (id === 'ui:taskbar' || id === 'ui:desktop' || id === 'ui:start-menu') {
                setDisabledProcesses(prev => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                });
            } else if (id.startsWith('app:')) {
                openApp(id.replace('app:', '') as AppId);
            }
         }, 2000);
      }
      else if (command === 'focus') {
          if (id.startsWith('app:')) {
              const appId = id.replace('app:', '') as AppId;
              // Force move to current desktop if needed
              setWindows(prev => ({
                  ...prev,
                  [appId]: { ...prev[appId], desktopId: currentDesktop, isMinimized: false }
              }));
              bringToFront(appId);
          }
      }
      else if (command === 'minimize') {
          if (id.startsWith('app:')) {
              const appId = id.replace('app:', '') as AppId;
              setWindows(prev => ({
                  ...prev,
                  [appId]: { 
                      ...prev[appId], 
                      isMinimized: !prev[appId].isMinimized 
                  }
              }));
          }
      }
    });
    return unsubscribe;
  }, [currentDesktop]); // Dependency on currentDesktop for focus command

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

  // Save Pinned Apps
  useEffect(() => {
      localStorage.setItem('rakko_pinned_apps', JSON.stringify(pinnedAppIds));
  }, [pinnedAppIds]);

  // Load Desktop Files
  const loadDesktopFiles = () => {
    const files = fsService.getDirectory('/C/Desktop');
    setDesktopFiles([...files]);
  };

  useEffect(() => {
    loadDesktopFiles();
    const handleUpdate = () => loadDesktopFiles();
    window.addEventListener('fs-update', handleUpdate);
    return () => window.removeEventListener('fs-update', handleUpdate);
  }, []);

  // --- Icon Grid Logic ---

  // 1. Unified Desktop Items (Apps + Files)
  const allDesktopItems = useMemo(() => {
    const items = [
      ...INSTALLED_APPS.map(app => ({ 
          type: 'app' as const, 
          id: app.id as string, 
          label: app.label, 
          icon: app.icon,
          date: '0', 
          size: 0
      })),
      ...desktopFiles.map(file => ({ 
          type: 'file' as const, 
          id: `file:${file.name}`, 
          label: file.name, 
          icon: file.type === 'folder' 
              ? <Folder size={28} className="text-yellow-400" />
              : file.fileType === 'image' 
                  ? <ImageIcon size={28} className="text-purple-400" />
                  : <FileText size={28} className="text-blue-400" />,
          data: file,
          date: file.date,
          size: parseInt(file.size || '0')
      }))
    ];

    return items.sort((a, b) => {
        if (sortOption === 'name') return a.label.localeCompare(b.label);
        if (sortOption === 'size') return (b.size || 0) - (a.size || 0);
        if (sortOption === 'date') return (b.date || '').localeCompare(a.date || '');
        return 0;
    });

  }, [desktopFiles, sortOption]);

  const rearrangeIcons = () => {
      let gridSize = 104;
      let startX = 24;
      let startY = 24;
      let gap = 16;
      
      if (iconSize === 'small') { gridSize = 88; startX = 16; startY = 16; }
      if (iconSize === 'large') { gridSize = 136; startX = 32; startY = 32; }

      const maxHeight = window.innerHeight - 60;
      const itemsPerColumn = Math.floor((maxHeight - startY) / gridSize);

      const newPos: Record<string, {x: number, y: number}> = {};

      allDesktopItems.forEach((item, index) => {
          const col = Math.floor(index / itemsPerColumn);
          const row = index % itemsPerColumn;

          newPos[item.id] = {
              x: startX + col * (gridSize + gap/2),
              y: startY + row * gridSize
          };
      });

      setIconPositions(newPos);
  };

  useEffect(() => {
      rearrangeIcons();
  }, [allDesktopItems, iconSize]);


  const toggleTheme = () => {
      setSettings(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
  };

  const bringToFront = (id: AppId) => {
    setWindows(prev => {
      const windowsList = Object.values(prev) as WindowState[];
      const maxZ = Math.max(0, ...windowsList.map(w => w.zIndex));
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
          desktopId: currentDesktop,
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

  const handleUpdatePreview = (id: AppId, url: string) => {
      setWindows(prev => ({
          ...prev,
          [id]: { ...prev[id], previewUrl: url }
      }));
  };

  const moveWindowToDesktop = (id: AppId, desktopId: number) => {
    setWindows(prev => ({
        ...prev,
        [id]: { ...prev[id], desktopId }
    }));
  };
  
  const handleTaskbarAppClick = (id: AppId) => {
    const w = windows[id];
    
    if (!w.isOpen) {
        openApp(id);
    } else if (w.isMinimized) {
        setWindows(prev => ({ ...prev, [id]: { ...prev[id], isMinimized: false, desktopId: currentDesktop } }));
        bringToFront(id);
    } else if (w.desktopId !== currentDesktop) {
        setWindows(prev => ({ ...prev, [id]: { ...prev[id], desktopId: currentDesktop } }));
        bringToFront(id);
    } else if (activeApp === id) {
        minimizeApp(id);
    } else {
        bringToFront(id);
    }
  };

  const togglePinApp = (id: AppId) => {
      setPinnedAppIds(prev => {
          if (prev.includes(id)) return prev.filter(p => p !== id);
          return [...prev, id];
      });
  };

  const isAppPinned = (id: AppId) => pinnedAppIds.includes(id);

  const handleDesktopContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      if ((e.target as HTMLElement).closest('.desktop-icon')) return;
      setActiveContextMenu({ type: 'desktop', x: e.clientX, y: e.clientY });
  };
  
  const handleIconContextMenu = (e: React.MouseEvent, item: any) => {
      e.preventDefault();
      e.stopPropagation();
      setActiveContextMenu({ type: 'icon', x: e.clientX, y: e.clientY, data: item });
  };

  const handleTaskbarContextMenu = (e: React.MouseEvent, appId: AppId) => {
      e.preventDefault();
      e.stopPropagation();
      setActiveContextMenu({ type: 'taskbar', x: e.clientX, y: e.clientY, data: { id: appId }});
  };

  const handleStartMenuContextMenu = (e: React.MouseEvent, appId: AppId) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveContextMenu({ type: 'start', x: e.clientX, y: e.clientY, data: { id: appId }});
  };

  const handleCreateNew = (type: 'folder' | 'text') => {
      const basePath = '/C/Desktop';
      try {
          if (type === 'folder') {
              fsService.createFile(basePath, 'New Folder', 'folder');
          } else {
              fsService.createFile(basePath, 'New Text Document.txt', 'file', '');
          }
      } catch (e) {
          console.error(e);
      }
      setActiveContextMenu(null);
  };
  
  const handleDeleteIcon = (item: any) => {
      if (item.type === 'file') {
          if (confirm(`Are you sure you want to delete "${item.label}"?`)) {
              fsService.deleteFile('/C/Desktop', item.data.name);
          }
      }
      setActiveContextMenu(null);
  };
  
  const handleRenameIcon = (item: any) => {
      if (item.type === 'file') {
          setRenamingItemId(item.id);
          setRenameInput(item.label);
      }
      setActiveContextMenu(null);
  };
  
  const submitRename = () => {
      if (!renamingItemId || !renameInput.trim()) {
          setRenamingItemId(null);
          return;
      }
      
      const item = allDesktopItems.find(i => i.id === renamingItemId);
      if (item && item.type === 'file') {
          try {
              fsService.renameFile('/C/Desktop', item.data.name, renameInput);
          } catch (e: any) {
              alert(e.message);
          }
      }
      setRenamingItemId(null);
  }

  const handleDragOverDesktop = (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.types.includes('Files') || e.dataTransfer.types.includes('application/rakko-item') || e.dataTransfer.types.includes('application/rakko-icon-move')) {
          setIsDragOverDesktop(true);
      }
  };

  const handleDragLeaveDesktop = () => {
      setIsDragOverDesktop(false);
  };

  const handleDropOnDesktop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOverDesktop(false);

      const moveId = e.dataTransfer.getData('application/rakko-icon-move');
      if (moveId) {
          const newX = e.clientX - dragOffset.current.x;
          const newY = e.clientY - dragOffset.current.y;
          
          setIconPositions(prev => ({
              ...prev,
              [moveId]: { x: newX, y: newY }
          }));
          return;
      }

      const rakkoData = e.dataTransfer.getData('application/rakko-item');
      if (rakkoData) {
          try {
              const { name, path: sourcePath, type } = JSON.parse(rakkoData);
              if (type === 'rakko-file') {
                if (sourcePath !== '/C/Desktop') {
                   fsService.moveFile(sourcePath, '/C/Desktop', name);
                }
              }
          } catch (e) { console.error(e); }
          return;
      }

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const files = Array.from(e.dataTransfer.files) as File[];
          const uploadPath = '/C/Desktop'; 
          
          files.forEach(file => {
              const reader = new FileReader();
              if (file.type.startsWith('image/')) {
                  reader.readAsDataURL(file);
                  reader.onload = () => {
                      try {
                          fsService.createFile(uploadPath, file.name, 'file', '', reader.result as string);
                      } catch(e) { console.error(e); }
                  };
              } else {
                  reader.readAsText(file);
                  reader.onload = () => {
                      try {
                          fsService.createFile(uploadPath, file.name, 'file', reader.result as string);
                      } catch(e) { console.error(e); }
                  };
              }
          });
      }
  };

  const handleIconDragStart = (e: React.DragEvent, item: any) => {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };

      e.dataTransfer.setData('application/rakko-icon-move', item.id);
      
      if (item.type === 'file') {
          const dragData = JSON.stringify({
             name: item.data.name,
             path: '/C/Desktop',
             type: 'rakko-file'
          });
          e.dataTransfer.setData('application/rakko-item', dragData);
      }
      
      e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleOpenItem = (item: any) => {
      if (item.type === 'app') openApp(item.id as AppId);
      else if (item.type === 'file') {
         const f = item.data;
         if (f.fileType === 'image' && f.url) {
            openApp(AppId.PICTURE_VIEWER, { url: f.url, title: f.name });
         } else if (f.fileType === 'text') {
            openApp(AppId.TEXT_EDITOR, { initialPath: '/C/Desktop', initialFileName: f.name });
         } else if (f.type === 'folder') {
            openApp(AppId.FILE_MANAGER); 
         }
      }
  };

  const renderAppContent = (id: AppId, data?: any) => {
    switch (id) {
      case AppId.GALLERY: 
        return <GalleryApp onOpenImage={(url, title) => openApp(AppId.PICTURE_VIEWER, { url, title })} />;
      case AppId.ABOUT: return <AboutApp />;
      case AppId.HELP: return <HelpApp />;
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
      case AppId.TASK_MANAGER:
        // Task Manager is now completely decoupled
        return <TaskManagerApp />;
      default: return null;
    }
  };

  const getWindowTitle = (windowState: WindowState) => {
    if (windowState.id === AppId.PICTURE_VIEWER) {
      return `Picture Studio${windowState.data?.title ? ` - ${windowState.data.title}` : ''}`;
    }
    if (windowState.id === AppId.TEXT_EDITOR && windowState.data?.initialFileName) {
        return `Editor - ${windowState.data.initialFileName}`;
    }
    const appDef = INSTALLED_APPS.find(a => a.id === windowState.id);
    return appDef ? appDef.label : windowState.id;
  };

  const renderContextMenu = () => {
    if (!activeContextMenu) return null;

    let items: MenuItem[] = [];

    if (activeContextMenu.type === 'desktop') {
        return null;
    }

    if (activeContextMenu.type === 'icon') {
        const item = activeContextMenu.data;
        items = [
            { 
                label: 'Open', 
                icon: <Maximize2 size={14}/>, 
                action: () => handleOpenItem(item) 
            },
            { separator: true } as MenuItem
        ];

        if (item.type === 'app') {
            const pinned = isAppPinned(item.id);
            items.push({
                label: pinned ? 'Unpin from Taskbar' : 'Pin to Taskbar',
                icon: pinned ? <PinOff size={14}/> : <Pin size={14}/>,
                action: () => togglePinApp(item.id)
            });
            items.push({ separator: true } as MenuItem);
        }

        if (item.type === 'file') {
             items.push(
                { label: 'Rename', icon: <Edit3 size={14}/>, action: () => handleRenameIcon(item) },
                { label: 'Delete', icon: <Trash2 size={14}/>, danger: true, action: () => handleDeleteIcon(item) }
             );
        }
    }

    if (activeContextMenu.type === 'taskbar') {
        const { id } = activeContextMenu.data;
        const pinned = isAppPinned(id);
        const isOpen = windows[id].isOpen;
        
        items = [
            {
                label: pinned ? 'Unpin from Taskbar' : 'Pin to Taskbar',
                icon: pinned ? <PinOff size={14}/> : <Pin size={14}/>,
                action: () => togglePinApp(id)
            },
            { separator: true } as MenuItem,
            {
                label: 'Close Window',
                icon: <X size={14}/>,
                disabled: !isOpen,
                danger: true,
                action: () => closeApp(id)
            }
        ];
    }

    if (activeContextMenu.type === 'start') {
        const { id } = activeContextMenu.data;
        const pinned = isAppPinned(id);
        
        items = [
             {
                label: 'Open',
                icon: <Maximize2 size={14}/>,
                action: () => openApp(id)
            },
            { separator: true } as MenuItem,
            {
                label: pinned ? 'Unpin from Taskbar' : 'Pin to Taskbar',
                icon: pinned ? <PinOff size={14}/> : <Pin size={14}/>,
                action: () => togglePinApp(id)
            }
        ];
    }

    return (
        <ContextMenu
            x={activeContextMenu.x}
            y={activeContextMenu.y}
            items={items}
            onClose={() => setActiveContextMenu(null)}
        />
    );
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none font-sans bg-black">
      
      {/* Desktop Background Layer */}
      {!disabledProcesses.has('ui:desktop') && (
        <DesktopLayer 
          settings={settings}
          handleDragOverDesktop={handleDragOverDesktop}
          handleDragLeaveDesktop={handleDragLeaveDesktop}
          handleDropOnDesktop={handleDropOnDesktop}
          handleDesktopContextMenu={handleDesktopContextMenu}
          isDragOverDesktop={isDragOverDesktop}
          allDesktopItems={allDesktopItems}
          iconPositions={iconPositions}
          handleIconDragStart={handleIconDragStart}
          handleIconContextMenu={handleIconContextMenu}
          renamingItemId={renamingItemId}
          renameInput={renameInput}
          setRenameInput={setRenameInput}
          submitRename={submitRename}
          iconSize={iconSize}
          handleOpenItem={handleOpenItem}
        />
      )}

      {/* Legacy Desktop Context Menu (Portal) */}
      {activeContextMenu?.type === 'desktop' && createPortal(
          <>
            <div 
                className="fixed inset-0 z-[9998]" 
                onClick={() => setActiveContextMenu(null)}
                onContextMenu={(e) => { e.preventDefault(); setActiveContextMenu(null); }}
            />
            <div 
                className="fixed z-[9999] min-w-[200px] bg-glass-panel backdrop-blur-xl border border-glass-border rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.5)] py-1.5 animate-pop flex flex-col text-sm text-glass-text origin-top-left"
                style={{ 
                    top: Math.min(activeContextMenu.y, window.innerHeight - 320), 
                    left: Math.min(activeContextMenu.x, window.innerWidth - 220) 
                }}
                onClick={(e) => e.stopPropagation()}
                onContextMenu={(e) => e.preventDefault()}
            >
                <div className="group/item relative px-1">
                    <button className="w-full text-left px-3 py-2 hover:bg-indigo-600/80 hover:text-white rounded flex items-center justify-between">
                        <div className="flex items-center gap-2"><Monitor size={14} className="opacity-70"/> View</div>
                        <span className="text-[10px]">▶</span>
                    </button>
                    <div className="absolute left-full top-0 ml-1 w-40 bg-glass-panel backdrop-blur-xl border border-glass-border rounded-lg shadow-xl py-1 hidden group-hover/item:block animate-fade-in">
                        <button onClick={() => { setIconSize('large'); setActiveContextMenu(null); }} className="w-full text-left px-3 py-2 hover:bg-indigo-600/80 hover:text-white flex items-center gap-2">
                            <div className="w-4 flex justify-center">{iconSize === 'large' && <Check size={12}/>}</div> Large Icons
                        </button>
                        <button onClick={() => { setIconSize('medium'); setActiveContextMenu(null); }} className="w-full text-left px-3 py-2 hover:bg-indigo-600/80 hover:text-white flex items-center gap-2">
                            <div className="w-4 flex justify-center">{iconSize === 'medium' && <Check size={12}/>}</div> Medium Icons
                        </button>
                        <button onClick={() => { setIconSize('small'); setActiveContextMenu(null); }} className="w-full text-left px-3 py-2 hover:bg-indigo-600/80 hover:text-white flex items-center gap-2">
                            <div className="w-4 flex justify-center">{iconSize === 'small' && <Check size={12}/>}</div> Small Icons
                        </button>
                    </div>
                </div>

                <div className="group/item relative px-1">
                    <button className="w-full text-left px-3 py-2 hover:bg-indigo-600/80 hover:text-white rounded flex items-center justify-between">
                        <div className="flex items-center gap-2"><Grid size={14} className="opacity-70"/> Sort by</div>
                        <span className="text-[10px]">▶</span>
                    </button>
                    <div className="absolute left-full top-0 ml-1 w-40 bg-glass-panel backdrop-blur-xl border border-glass-border rounded-lg shadow-xl py-1 hidden group-hover/item:block animate-fade-in">
                        <button onClick={() => { setSortOption('name'); setActiveContextMenu(null); }} className="w-full text-left px-3 py-2 hover:bg-indigo-600/80 hover:text-white flex items-center gap-2">
                            <div className="w-4 flex justify-center">{sortOption === 'name' && <Check size={12}/>}</div> Name
                        </button>
                        <button onClick={() => { setSortOption('size'); setActiveContextMenu(null); }} className="w-full text-left px-3 py-2 hover:bg-indigo-600/80 hover:text-white flex items-center gap-2">
                            <div className="w-4 flex justify-center">{sortOption === 'size' && <Check size={12}/>}</div> Size
                        </button>
                        <button onClick={() => { setSortOption('date'); setActiveContextMenu(null); }} className="w-full text-left px-3 py-2 hover:bg-indigo-600/80 hover:text-white flex items-center gap-2">
                            <div className="w-4 flex justify-center">{sortOption === 'date' && <Check size={12}/>}</div> Date
                        </button>
                    </div>
                </div>

                <div className="h-px bg-white/10 my-1 mx-2" />

                <button onClick={() => { loadDesktopFiles(); setActiveContextMenu(null); }} className="text-left px-4 py-2 hover:bg-indigo-600/80 hover:text-white flex items-center gap-3 transition-colors mx-1 rounded">
                    <RefreshCw size={14} className="opacity-70"/> Refresh
                </button>

                <div className="h-px bg-white/10 my-1 mx-2" />
                
                <div className="group/item relative px-1">
                    <button className="w-full text-left px-3 py-2 hover:bg-indigo-600/80 hover:text-white rounded flex items-center justify-between">
                        <div className="flex items-center gap-2"><Plus size={14} className="opacity-70"/> New</div>
                        <span className="text-[10px]">▶</span>
                    </button>
                    <div className="absolute left-full top-0 ml-1 w-48 bg-glass-panel backdrop-blur-xl border border-glass-border rounded-lg shadow-xl py-1 hidden group-hover/item:block animate-fade-in">
                        <button onClick={() => handleCreateNew('folder')} className="w-full text-left px-3 py-2 hover:bg-indigo-600/80 hover:text-white flex items-center gap-2">
                            <Folder size={14} className="text-yellow-400"/> Folder
                        </button>
                        <button onClick={() => handleCreateNew('text')} className="w-full text-left px-3 py-2 hover:bg-indigo-600/80 hover:text-white flex items-center gap-2">
                            <FileText size={14} className="text-blue-400"/> Text Document
                        </button>
                    </div>
                </div>

                <div className="h-px bg-white/10 my-1 mx-2" />

                <button onClick={() => { openApp(AppId.CONTROL_PANEL); setActiveContextMenu(null); }} className="text-left px-4 py-2 hover:bg-indigo-600/80 hover:text-white flex items-center gap-3 transition-colors mx-1 rounded">
                    <Settings size={14} className="opacity-70"/> Personalize
                </button>
            </div>
          </>,
          document.body
      )}

      {renderContextMenu()}

      {/* Windows Layer */}
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
                onUpdatePreview={handleUpdatePreview}
                initialSize={
                  windowState.id === AppId.PICTURE_VIEWER ? { width: 900, height: 650 } : 
                  (windowState.id === AppId.CHAT ? { width: 400, height: 600 } : 
                  (windowState.id === AppId.TASK_MANAGER ? { width: 800, height: 600 } : undefined))
                }
                >
                {renderAppContent(windowState.id, windowState.data)}
                </Window>
            </div>
          );
      })}

      {/* Start Menu */}
      {!disabledProcesses.has('ui:start-menu') && (
        <StartMenu 
            isOpen={isStartMenuOpen}
            user={currentUser}
            apps={INSTALLED_APPS}
            onOpenApp={openApp}
            onShutdown={() => window.location.reload()}
            onClose={() => setIsStartMenuOpen(false)}
            position={settings.taskbar.position}
            onAppContextMenu={handleStartMenuContextMenu}
        />
      )}

      {/* Task View */}
      {!disabledProcesses.has('ui:taskbar') && (
        <TaskView 
            isOpen={isTaskViewOpen}
            windows={Object.values(windows)}
            apps={INSTALLED_APPS.map(app => ({...app, title: app.label, component: null}))}
            currentDesktop={currentDesktop}
            onClose={() => setIsTaskViewOpen(false)}
            onSelectWindow={(id) => handleTaskbarAppClick(id)}
            onCloseWindow={closeApp}
            onSwitchDesktop={setCurrentDesktop}
            onMoveWindowToDesktop={moveWindowToDesktop}
            renderWindowContent={(id) => {
                const previewUrl = windows[id].previewUrl;
                if (previewUrl) {
                    return <img src={previewUrl} className="w-full h-full object-contain pointer-events-none" draggable={false} alt="Preview"/>;
                }
                return (
                    <div className="w-full h-full bg-slate-900 text-slate-200 rounded-lg overflow-hidden relative pointer-events-none">
                        {renderAppContent(id, windows[id].data)}
                    </div>
                );
            }}
        />
      )}

      {/* Taskbar */}
      {!disabledProcesses.has('ui:taskbar') && (
        <Taskbar 
            installedApps={INSTALLED_APPS}
            pinnedAppIds={pinnedAppIds}
            openWindows={windows}
            activeApp={activeApp}
            currentDesktop={currentDesktop}
            settings={settings}
            currentTime={currentTime}
            isStartMenuOpen={isStartMenuOpen}
            onToggleStartMenu={() => setIsStartMenuOpen(!isStartMenuOpen)}
            onAppClick={handleTaskbarAppClick}
            onAppContextMenu={handleTaskbarContextMenu}
            onCloseApp={closeApp}
            onToggleTaskView={() => setIsTaskViewOpen(!isTaskViewOpen)}
            onToggleTheme={toggleTheme}
            renderWindowContent={(id) => (
                <div className="w-full h-full bg-slate-900 text-slate-200 rounded-lg overflow-hidden relative pointer-events-none">
                    {renderAppContent(id, windows[id].data)}
                </div>
            )}
        />
      )}
    </div>
  );
};

// Extracted Desktop Layer to Component to use hook cleanly
const DesktopLayer: React.FC<any> = (props) => {
    // Register the desktop process
    useSystemProcess({
        id: 'ui:desktop',
        name: 'Desktop Environment',
        type: 'ui'
    });

    const { 
        settings, handleDragOverDesktop, handleDragLeaveDesktop, 
        handleDropOnDesktop, handleDesktopContextMenu, isDragOverDesktop, 
        allDesktopItems, iconPositions, handleIconDragStart, handleIconContextMenu,
        renamingItemId, renameInput, setRenameInput, submitRename, iconSize, handleOpenItem 
    } = props;

    return (
        <div 
            className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-700 ease-in-out"
            style={{ backgroundImage: `url('${settings.wallpaper}')` }}
            onDragOver={handleDragOverDesktop}
            onDragLeave={handleDragLeaveDesktop}
            onDrop={handleDropOnDesktop}
            onContextMenu={handleDesktopContextMenu}
        >
            <div className="absolute inset-0 bg-glass-bg/20 pointer-events-none" />
            
            {isDragOverDesktop && (
                <div className="absolute inset-0 border-4 border-indigo-500/50 bg-indigo-500/10 transition-all pointer-events-none" />
            )}

            {allDesktopItems.map((item: any) => (
                <div
                    key={item.id}
                    className="desktop-icon absolute z-10"
                    style={{
                        left: iconPositions[item.id]?.x || 0,
                        top: iconPositions[item.id]?.y || 0,
                        touchAction: 'none',
                    }}
                    draggable
                    onDragStart={(e) => handleIconDragStart(e, item)}
                    onContextMenu={(e) => handleIconContextMenu(e, item)}
                >
                    {renamingItemId === item.id ? (
                        <div className="w-24 flex flex-col items-center gap-1.5 p-2 bg-black/40 rounded-lg">
                            <div className="w-14 h-14 flex items-center justify-center">
                                {item.icon}
                            </div>
                            <input 
                                autoFocus
                                value={renameInput}
                                onChange={(e: any) => setRenameInput(e.target.value)}
                                onBlur={submitRename}
                                onKeyDown={(e: any) => e.key === 'Enter' && submitRename()}
                                className="w-full text-xs text-center bg-white text-black rounded px-1 outline-none border border-indigo-500"
                                onClick={(e: any) => e.stopPropagation()}
                            />
                        </div>
                    ) : (
                        <DesktopIcon 
                            label={item.label} 
                            icon={item.icon} 
                            size={iconSize}
                            onClick={() => handleOpenItem(item)} 
                            accentColor={settings.accentColor}
                        />
                    )}
                </div>
            ))}
        </div>
    );
};

const DesktopIcon: React.FC<{ label: string; icon: React.ReactNode; onClick: () => void; accentColor: string; size: IconSize }> = ({ label, icon, onClick, accentColor, size }) => {
    const sizeConfig = {
        small: { width: 'w-[72px]', iconBox: 'w-10 h-10', iconSize: 20, text: 'text-[10px] line-clamp-2' },
        medium: { width: 'w-24', iconBox: 'w-14 h-14', iconSize: 28, text: 'text-xs' },
        large: { width: 'w-32', iconBox: 'w-20 h-20', iconSize: 40, text: 'text-sm' },
    };
    const cfg = sizeConfig[size];

    return (
        <button 
            onClick={onClick}
            className={`group flex flex-col items-center gap-1.5 ${cfg.width} p-2 rounded-lg hover:bg-white/10 transition-all focus:outline-none focus:bg-white/20 cursor-default`}
        >
            <div className={`${cfg.iconBox} rounded-xl bg-glass-panel flex items-center justify-center shadow-lg border border-glass-border group-hover:scale-105 transition-transform duration-200 text-${accentColor}-400 group-hover:text-${accentColor}-300 cursor-pointer pointer-events-none`}>
            {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: cfg.iconSize }) : icon}
            </div>
            <span className={`text-white font-medium text-shadow-sm bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm border border-transparent group-hover:border-white/10 cursor-pointer break-all text-center leading-tight ${cfg.text}`}>
            {label}
            </span>
        </button>
    );
};

export default App;