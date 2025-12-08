import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Folder, FileText, ArrowLeft, ArrowRight, ArrowUp, Home, 
  Image as ImageIcon, Search, Grid, List as ListIcon, 
  HardDrive, ChevronRight, Plus, Trash2, RefreshCw,
  MoreVertical, Copy, Scissors, Clipboard, Edit3, Eye, Download, Info, X, SlidersHorizontal,
  Code, Music, Video, Box, Monitor
} from 'lucide-react';
import { fsService } from '../../services/fileSystemService';
import { FileSystemItem, FileClipboard } from '../../types';

interface FileManagerProps {
  onOpenFile: (file: FileSystemItem, path: string) => void;
}

type SortOption = 'name' | 'date' | 'size' | 'type';
type ViewMode = 'grid' | 'list';

// --- Polished Icon Components ---

const FileIcon = ({ item, size }: { item: FileSystemItem, size: number }) => {
  if (item.type === 'folder') {
    return (
      <div className="relative group transition-transform duration-300" style={{ width: size, height: size * 0.85 }}>
        {/* Back Plate */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-lg shadow-lg transform transition-transform group-hover:-translate-y-1"></div>
        {/* Front Plate (Flap) */}
        <div className="absolute top-2 left-0 w-full h-[90%] bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg shadow-inner flex items-center justify-center border-t border-white/20 transform transition-transform group-hover:-translate-y-1.5 group-hover:scale-[1.02]">
            {/* Subtle icon inside */}
             <div className="opacity-50 text-indigo-900 mix-blend-overlay"><Folder size={size * 0.4} fill="currentColor" /></div>
        </div>
        {/* Content Preview Hint */}
        <div className="absolute top-0 right-2 w-[40%] h-[30%] bg-white/20 rounded-t-sm backdrop-blur-sm -z-10"></div>
      </div>
    );
  }

  // File Icons (Mac-like Sheets)
  const isImage = item.fileType === 'image';
  return (
    <div 
        className="relative shadow-md transition-transform duration-300 group-hover:-translate-y-2 group-hover:rotate-1" 
        style={{ width: size * 0.8, height: size }}
    >
      {/* Paper Sheet */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-200 rounded-md border border-white/40 flex flex-col items-center overflow-hidden">
         {/* Corner Fold */}
         <div className="absolute top-0 right-0 w-0 h-0 border-l-[12px] border-l-transparent border-b-[12px] border-b-gray-300/50 border-r-[12px] border-r-white/50 drop-shadow-sm"></div>
         
         {/* Preview / Icon Area */}
         <div className="flex-1 w-full flex items-center justify-center bg-gray-100 relative overflow-hidden">
             {isImage && item.url ? (
                 <img src={item.url} className="w-full h-full object-cover" alt="" />
             ) : (
                 <div className={`p-3 rounded-full ${isImage ? 'bg-purple-100 text-purple-500' : 'bg-blue-50 text-blue-400'}`}>
                    {isImage ? <ImageIcon size={size * 0.4} /> : <FileText size={size * 0.4} />}
                 </div>
             )}
         </div>

         {/* Footer Area (Type Label) */}
         <div className="h-[25%] w-full bg-white flex items-center justify-center border-t border-gray-200 px-1">
             <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full w-2/3 ${isImage ? 'bg-purple-400' : 'bg-blue-400'}`}></div>
             </div>
         </div>
      </div>
    </div>
  );
};

export const FileManagerApp: React.FC<FileManagerProps> = ({ onOpenFile }) => {
  // Navigation
  const [history, setHistory] = useState<string[]>(['/']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [currentPath, setCurrentPath] = useState('/');
  // New Feature: Breadcrumb mode instead of plain text
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressInput, setAddressInput] = useState('/');

  // Data & View
  const [files, setFiles] = useState<FileSystemItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDesc, setSortDesc] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showPreview, setShowPreview] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Selection & Clipboard
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [clipboard, setClipboard] = useState<FileClipboard | null>(null);
  
  // Actions
  const [isCreating, setIsCreating] = useState<'file' | 'folder' | null>(null);
  const [renamingItem, setRenamingItem] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Drag & Drop
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // UI State
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, item?: string} | null>(null);
  const [showProperties, setShowProperties] = useState<FileSystemItem | null>(null);

  // Helper to load files with new reference to trigger render
  const loadFiles = (path: string) => {
      setFiles([...fsService.getDirectory(path)]);
  };

  // Sync navigation
  useEffect(() => {
    const path = history[historyIndex];
    setCurrentPath(path);
    setAddressInput(path);
    loadFiles(path);
    setSelectedItems(new Set());
    setSearchQuery('');
  }, [historyIndex, history, refreshTrigger]);

  // Global listeners
  useEffect(() => {
    const handleUpdate = () => {
        // Auto refresh
        setRefreshTrigger(prev => prev + 1);
    };
    window.addEventListener('fs-update', handleUpdate);
    return () => {
        window.removeEventListener('fs-update', handleUpdate);
    };
  }, []);

  const handleManualRefresh = () => {
      setIsRefreshing(true);
      // Force reload by fetching again and setting state
      const path = history[historyIndex];
      setFiles([...fsService.getDirectory(path)]); // Ensure new array reference
      setTimeout(() => {
          setIsRefreshing(false);
      }, 500); 
  };

  // --- Navigation Methods ---
  const navigateTo = (path: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(path);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setIsEditingAddress(false);
  };

  const handleBack = () => historyIndex > 0 && setHistoryIndex(historyIndex - 1);
  const handleForward = () => historyIndex < history.length - 1 && setHistoryIndex(historyIndex + 1);
  const handleUp = () => {
    if (currentPath === '/') return;
    const parts = currentPath.split('/');
    parts.pop();
    const newPath = parts.join('/') || '/';
    navigateTo(newPath);
  };

  // --- CRUD Operations ---
  const handleCreate = () => {
    if (!isCreating || !newItemName.trim()) { setIsCreating(null); return; }
    try {
        fsService.createFile(currentPath, newItemName, isCreating, '');
        setNewItemName('');
        setIsCreating(null);
    } catch (e: any) { alert(e.message); }
  };

  const handleRename = (oldName: string) => {
     if (!newItemName.trim() || newItemName === oldName) {
         setRenamingItem(null);
         return;
     }
     try {
         fsService.renameFile(currentPath, oldName, newItemName);
         setRenamingItem(null);
         setNewItemName('');
     } catch (e: any) { alert(e.message); }
  };

  const deleteItems = (names: string[]) => {
      if (confirm(`Delete ${names.length} item(s)?`)) {
          names.forEach(name => {
              try { fsService.deleteFile(currentPath, name); } catch(e) {}
          });
      }
  };

  // --- Clipboard Operations ---
  const handleCopy = () => {
      const items = Array.from(selectedItems).map(name => ({ path: currentPath, name }));
      setClipboard({ type: 'copy', items });
  };
  
  const handleCut = () => {
      const items = Array.from(selectedItems).map(name => ({ path: currentPath, name }));
      setClipboard({ type: 'cut', items });
  };

  const handlePaste = () => {
      if (!clipboard) return;
      if (!currentPath.startsWith('/C')) { alert("Read-only destination"); return; }
      
      clipboard.items.forEach(item => {
          try {
              if (clipboard.type === 'copy') {
                  fsService.copyFile(item.path, currentPath, item.name);
              } else {
                  fsService.moveFile(item.path, currentPath, item.name);
              }
          } catch (e: any) { console.error(e); }
      });
      
      if (clipboard.type === 'cut') setClipboard(null);
      setRefreshTrigger(prev => prev + 1);
  };

  // --- Download ---
  const handleDownload = (item: FileSystemItem) => {
    const content = item.content || '';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = item.url || URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (!item.url) URL.revokeObjectURL(url);
  };

  // --- Drag & Drop (Unified Logic) ---

  const handleInternalDragStart = (e: React.DragEvent, fileName: string) => {
    // Serialize drag data to support cross-directory/window moves
    const dragData = JSON.stringify({
        name: fileName,
        path: currentPath,
        type: 'rakko-file'
    });
    e.dataTransfer.setData('application/rakko-item', dragData);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleGlobalDrop = async (e: React.DragEvent, targetPath?: string) => {
      e.preventDefault();
      e.stopPropagation(); // Prevent Desktop from handling this
      setIsDragOver(false);
      setDropTarget(null);

      const destPath = targetPath || currentPath;

      // 1. Handle Internal Move (from FM or Desktop)
      const rakkoData = e.dataTransfer.getData('application/rakko-item');
      if (rakkoData) {
          try {
              const { name, path: sourcePath } = JSON.parse(rakkoData);
              if (sourcePath === destPath) return; // Same folder drop

              if (!destPath.startsWith('/C')) {
                  alert("Destination is Read-Only.");
                  return;
              }
              
              // Prevent moving folder into itself
              if (destPath.startsWith(`${sourcePath}/${name}`)) {
                  alert("Cannot move folder into itself.");
                  return;
              }

              fsService.moveFile(sourcePath, destPath, name);
          } catch (err) {
              console.error("Invalid Drag Data", err);
          }
          return;
      }

      // 2. Handle External Upload (Files from OS)
      if (e.dataTransfer.files.length > 0) {
          if (!destPath.startsWith('/C')) {
              alert("Cannot upload to Read-Only folder.");
              return;
          }

          const uploadedFiles = Array.from(e.dataTransfer.files) as File[];
          for (const file of uploadedFiles) {
              const reader = new FileReader();
              
              if (file.type.startsWith('image/')) {
                  reader.readAsDataURL(file);
                  reader.onload = () => {
                      try {
                          fsService.createFile(destPath, file.name, 'file', '', reader.result as string);
                      } catch (e: any) { console.error(e); }
                  };
              } else {
                  reader.readAsText(file);
                  reader.onload = () => {
                      try {
                          fsService.createFile(destPath, file.name, 'file', reader.result as string);
                      } catch (e: any) { console.error(e); }
                  };
              }
          }
      }
  };

  const handleDragOverItem = (e: React.DragEvent, targetName: string, isFolder: boolean) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isFolder) return;
      // Visual Feedback
      if (dropTarget !== targetName) setDropTarget(targetName);
  };

  // --- Selection Logic ---
  const toggleSelection = (name: string, multi: boolean) => {
      if (multi) {
          const newSet = new Set(selectedItems);
          if (newSet.has(name)) newSet.delete(name);
          else newSet.add(name);
          setSelectedItems(newSet);
      } else {
          setSelectedItems(new Set([name]));
      }
  };

  // --- Sorting & Filtering ---
  const processedFiles = useMemo(() => {
    let result = [...files];
    if (searchQuery) {
      result = result.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    result.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      let valA: any = a[sortBy] || '';
      let valB: any = b[sortBy] || '';
      
      if (sortBy === 'size') {
           valA = parseFloat(valA) || 0;
           valB = parseFloat(valB) || 0;
      }
      
      if (valA < valB) return sortDesc ? 1 : -1;
      if (valA > valB) return sortDesc ? -1 : 1;
      return 0;
    });
    return result;
  }, [files, searchQuery, sortBy, sortDesc]);

  // --- Context Menu Handler ---
  const handleContextMenu = (e: React.MouseEvent, itemName?: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (itemName && !selectedItems.has(itemName)) {
          setSelectedItems(new Set([itemName]));
      }
      setContextMenu({ x: e.clientX, y: e.clientY, item: itemName });
  };

  // --- Render Helpers ---
  const canWrite = currentPath.startsWith('/C');
  const activeItem = contextMenu?.item ? files.find(f => f.name === contextMenu.item) : null;
  const lastSelectedItem = Array.from(selectedItems).pop();
  const previewItem = showPreview ? files.find(f => f.name === lastSelectedItem) : null;

  return (
    <div 
        className="h-full flex flex-col bg-glass-panel text-glass-text font-sans select-none relative"
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); }}
        onDragLeave={() => { setIsDragOver(false); setDropTarget(null); }}
        onDrop={(e) => handleGlobalDrop(e)}
        onContextMenu={(e) => handleContextMenu(e)}
    >
      {/* 1. Header & Navigation */}
      <div className="h-14 border-b border-glass-border flex items-center px-3 gap-3 bg-glass-bg/30 shrink-0">
        <div className="flex items-center gap-1">
          <button onClick={handleBack} disabled={historyIndex === 0} className="p-2 rounded-full hover:bg-white/10 disabled:opacity-30 transition-all hover:scale-105 active:scale-95"><ArrowLeft size={16} /></button>
          <button onClick={handleForward} disabled={historyIndex === history.length - 1} className="p-2 rounded-full hover:bg-white/10 disabled:opacity-30 transition-all hover:scale-105 active:scale-95"><ArrowRight size={16} /></button>
          <button onClick={handleUp} disabled={currentPath === '/'} className="p-2 rounded-full hover:bg-white/10 disabled:opacity-30 transition-all hover:scale-105 active:scale-95"><ArrowUp size={16} /></button>
          <div className="w-px h-5 bg-glass-border mx-2" />
          <button 
            onClick={handleManualRefresh} 
            className={`p-2 rounded-full hover:bg-white/10 transition-all hover:rotate-180 duration-500 active:scale-95 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`}
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Improved Breadcrumb Address Bar */}
        <div className="flex-1 flex items-center bg-black/20 border border-glass-border rounded-lg px-2 py-1.5 focus-within:border-indigo-500/50 focus-within:bg-black/40 transition-all shadow-inner h-9 overflow-hidden">
          <HardDrive size={14} className="text-indigo-400 mr-2 shrink-0" />
          
          {isEditingAddress ? (
            <form onSubmit={(e) => { e.preventDefault(); navigateTo(addressInput); }} className="w-full">
                <input 
                    autoFocus
                    className="w-full bg-transparent border-none outline-none text-sm text-glass-text placeholder-glass-textMuted font-mono"
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                    onBlur={() => setIsEditingAddress(false)}
                />
            </form>
          ) : (
            <div 
                className="flex items-center flex-1 h-full cursor-text" 
                onClick={() => setIsEditingAddress(true)}
            >
                {currentPath === '/' ? (
                    <button className="px-1 hover:bg-white/10 rounded text-sm font-medium">Root</button>
                ) : (
                    currentPath.split('/').filter(Boolean).map((part, idx, arr) => {
                        const pathSoFar = '/' + arr.slice(0, idx + 1).join('/');
                        return (
                            <React.Fragment key={pathSoFar}>
                                <span className="text-gray-500 mx-0.5">/</span>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); navigateTo(pathSoFar); }}
                                    className="px-1.5 hover:bg-white/10 rounded text-sm transition-colors text-gray-200 hover:text-white truncate max-w-[120px]"
                                >
                                    {part}
                                </button>
                            </React.Fragment>
                        );
                    })
                )}
            </div>
          )}
        </div>

        <div className="flex items-center bg-black/20 border border-glass-border rounded-full px-3 py-1.5 w-48 focus-within:w-64 transition-all shadow-inner h-9">
          <Search size={14} className="text-glass-textMuted mr-2" />
          <input 
            type="text" 
            placeholder="Search" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-xs w-full text-glass-text placeholder-glass-textMuted"
          />
        </div>
      </div>

      {/* 2. Toolbar */}
      <div className="h-10 border-b border-glass-border bg-glass-bg/10 flex items-center justify-between px-3 shrink-0 backdrop-blur-md">
         <div className="flex items-center gap-1">
             <button disabled={!canWrite} onClick={() => setIsCreating('file')} className="flex items-center gap-1 px-3 py-1 rounded hover:bg-white/10 disabled:opacity-30 text-xs font-medium transition-colors hover:text-white">
                 <Plus size={14} /> New File
             </button>
             <button disabled={!canWrite} onClick={() => setIsCreating('folder')} className="flex items-center gap-1 px-3 py-1 rounded hover:bg-white/10 disabled:opacity-30 text-xs font-medium transition-colors hover:text-white">
                 <Folder size={14} /> New Folder
             </button>
             <div className="w-px h-4 bg-glass-border mx-2" />
             <button onClick={() => setSortDesc(!sortDesc)} className="flex items-center gap-1 px-3 py-1 rounded hover:bg-white/10 text-xs font-medium transition-colors">
                 <SlidersHorizontal size={14} /> Sort {sortDesc ? 'Desc' : 'Asc'}
             </button>
             <button onClick={() => setShowPreview(!showPreview)} className={`flex items-center gap-1 px-3 py-1 rounded hover:bg-white/10 text-xs font-medium transition-colors ${showPreview ? 'bg-white/10 text-white' : ''}`}>
                 <Eye size={14} /> Preview
             </button>
         </div>
         <div className="flex items-center gap-1 bg-black/20 p-0.5 rounded-lg border border-white/5">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white shadow-sm' : 'hover:text-gray-200 text-gray-400'}`}><Grid size={14} /></button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-white/10 text-white shadow-sm' : 'hover:text-gray-200 text-gray-400'}`}><ListIcon size={14} /></button>
         </div>
      </div>

      {/* 3. Main Content Split */}
      <div className="flex-1 flex overflow-hidden relative">
          
          {/* Drag Overlay for External Upload */}
          {isDragOver && !dropTarget && (
              <div className="absolute inset-0 z-50 bg-indigo-500/20 backdrop-blur-sm flex items-center justify-center border-2 border-indigo-500 border-dashed m-4 rounded-xl pointer-events-none animate-pulse">
                  <div className="bg-glass-panel p-6 rounded-2xl shadow-2xl flex flex-col items-center">
                      <Download size={48} className="text-indigo-400 mb-4" />
                      <span className="text-xl font-bold">Drop files to move/upload</span>
                  </div>
              </div>
          )}

          {/* Sidebar */}
          <div className="w-52 bg-glass-bg/20 border-r border-glass-border flex flex-col py-4 shrink-0 hidden md:flex backdrop-blur-sm">
             <div className="text-[10px] font-bold text-glass-textMuted uppercase tracking-widest px-4 mb-2">Locations</div>
             <SidebarItem 
                icon={<Home size={16} />} label="Home" active={currentPath === '/'} 
                path="/" onClick={() => navigateTo('/')} onDropFile={handleGlobalDrop}
             />
             <SidebarItem 
                icon={<Monitor size={16} />} label="Desktop" active={currentPath.startsWith('/C/Desktop')} 
                path="/C/Desktop" onClick={() => navigateTo('/C/Desktop')} onDropFile={handleGlobalDrop}
             />
             <SidebarItem 
                icon={<HardDrive size={16} />} label="Local Drive (C:)" active={currentPath.startsWith('/C') && !currentPath.startsWith('/C/')} 
                path="/C" onClick={() => navigateTo('/C')} onDropFile={handleGlobalDrop}
             />
             <SidebarItem 
                icon={<Grid size={16} />} label="System" active={currentPath.startsWith('/System')} 
                path="/System" onClick={() => navigateTo('/System')} onDropFile={handleGlobalDrop}
             />
             
             <div className="text-[10px] font-bold text-glass-textMuted uppercase tracking-widest px-4 mb-2 mt-6">Favorites</div>
             <SidebarItem 
                icon={<ImageIcon size={16} />} label="Pictures" active={currentPath.includes('Picture')} 
                path="/MyDocument/Picture" onClick={() => navigateTo('/MyDocument/Picture')} onDropFile={handleGlobalDrop}
             />
             <SidebarItem 
                icon={<FileText size={16} />} label="Documents" active={currentPath.includes('Documents')} 
                path="/C/Documents" onClick={() => navigateTo('/C/Documents')} onDropFile={handleGlobalDrop}
             />

             <div className="mt-auto px-4 py-2 text-[10px] text-glass-textMuted text-center opacity-50">
                 Rakko Explorer v3.1
             </div>
          </div>

          {/* File Area */}
          <div 
            className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-glass-bg/5 to-transparent custom-scrollbar" 
            onClick={() => setSelectedItems(new Set())}
            key={currentPath} // Triggers animation on path change
          >
              {/* Inline Create Input */}
              {isCreating && (
                <div className="mb-6 p-4 bg-glass-panel border border-indigo-500/50 rounded-xl shadow-lg flex items-center gap-3 animate-pop w-full max-w-md mx-auto">
                    <span className="text-sm font-bold text-indigo-300">New {isCreating}:</span>
                    <input 
                        autoFocus
                        className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:bg-black/60 transition-all"
                        placeholder="Name..."
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    />
                    <button onClick={handleCreate} className="p-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"><Plus size={16}/></button>
                    <button onClick={() => setIsCreating(null)} className="p-1.5 rounded-full hover:bg-white/10 transition-colors"><X size={16}/></button>
                </div>
              )}

              {/* Files Grid/List */}
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-6 content-start" 
                : "flex flex-col gap-1"
              }>
                {processedFiles.map((item, idx) => {
                    const isSelected = selectedItems.has(item.name);
                    const isRenaming = renamingItem === item.name;
                    const isTarget = dropTarget === item.name;

                    return (
                        <div 
                        key={`${item.name}-${idx}`}
                        draggable={canWrite}
                        onDragStart={(e) => handleInternalDragStart(e, item.name)}
                        onDragOver={(e) => handleDragOverItem(e, item.name, item.type === 'folder')}
                        onDrop={(e) => {
                            if (item.type === 'folder') {
                                handleGlobalDrop(e, `${currentPath === '/' ? '' : currentPath}/${item.name}`);
                            }
                        }}
                        style={{ 
                            animationDelay: `${idx * 0.03}s` // Staggered delay
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleSelection(item.name, e.ctrlKey || e.metaKey);
                        }}
                        onDoubleClick={() => item.type === 'folder' ? navigateTo(`${currentPath === '/' ? '' : currentPath}/${item.name}`) : onOpenFile(item, currentPath)}
                        onContextMenu={(e) => handleContextMenu(e, item.name)}
                        className={`
                            group relative flex cursor-pointer select-none animate-slide-up
                            ${viewMode === 'grid' 
                            ? `flex-col items-center p-3 rounded-2xl border transition-all duration-200 
                               ${isSelected ? 'bg-indigo-500/20 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'border-transparent hover:bg-white/5 hover:border-white/10'}
                               ${isTarget ? 'bg-indigo-500/40 scale-105 border-indigo-400 border-2 border-dashed' : ''}
                              ` 
                            : `flex-row items-center px-4 py-3 rounded-lg border-b border-transparent hover:bg-white/5 
                               ${isSelected ? 'bg-indigo-500/20 border-indigo-500/30' : ''}
                               ${isTarget ? 'bg-indigo-500/40 border-indigo-400 border-dashed' : ''}
                              `
                            }
                        `}
                        >
                            {/* Icon */}
                            <div className={`${viewMode === 'grid' ? 'mb-4' : 'mr-4'} transition-transform duration-300 ${isSelected && viewMode === 'grid' ? 'scale-110' : ''}`}>
                                <FileIcon item={item} size={viewMode === 'grid' ? 64 : 24} />
                            </div>

                            {/* Name / Rename Input */}
                            <div className={`flex-1 min-w-0 ${viewMode === 'grid' ? 'text-center w-full' : 'flex items-center justify-between'}`}>
                                {isRenaming ? (
                                    <input 
                                        autoFocus
                                        className="w-full bg-black/60 border border-indigo-500 rounded px-1.5 py-0.5 text-xs text-center text-white focus:outline-none shadow-xl"
                                        value={newItemName}
                                        onChange={(e) => setNewItemName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleRename(item.name)}
                                        onBlur={() => setRenamingItem(null)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                ) : (
                                    <div className={`truncate text-sm font-medium transition-colors ${isSelected ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>{item.name}</div>
                                )}
                                
                                {viewMode === 'list' && !isRenaming && (
                                    <div className="flex items-center gap-8 text-xs text-glass-textMuted font-mono opacity-70">
                                    <span className="w-24 text-right">{item.date}</span>
                                    <span className="w-16 text-right">{item.size || '--'}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
              </div>
          </div>

          {/* Preview Pane */}
          {showPreview && previewItem && (
              <div className="w-72 bg-glass-bg/30 border-l border-glass-border p-6 flex flex-col shrink-0 overflow-y-auto backdrop-blur-md animate-fade-in">
                  <div className="aspect-square rounded-2xl bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center mb-6 overflow-hidden shadow-2xl relative">
                       {previewItem.url ? (
                           <img src={previewItem.url} className="w-full h-full object-contain" />
                       ) : (
                           <div className="transform scale-150">
                               <FileIcon item={previewItem} size={80} />
                           </div>
                       )}
                  </div>
                  <h3 className="font-bold text-xl break-all mb-1 text-white leading-tight">{previewItem.name}</h3>
                  <div className="text-xs text-indigo-400 mb-6 font-mono uppercase tracking-wider">{previewItem.type === 'folder' ? 'Directory' : previewItem.fileType || 'Unknown'}</div>
                  
                  <div className="space-y-4 text-sm text-gray-300">
                      <div className="flex justify-between border-b border-white/5 pb-2"><span>Size</span> <span className="font-mono text-gray-400">{previewItem.size || '--'}</span></div>
                      <div className="flex justify-between border-b border-white/5 pb-2"><span>Modified</span> <span className="font-mono text-gray-400">{previewItem.date}</span></div>
                      
                      {previewItem.content && (
                          <div className="pt-2">
                             <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-bold">Preview</div>
                             <div className="text-xs text-gray-400 font-mono bg-black/40 p-3 rounded-lg border border-white/5 leading-relaxed max-h-40 overflow-hidden relative">
                                {previewItem.content}
                                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/80 to-transparent"></div>
                             </div>
                          </div>
                      )}
                  </div>
              </div>
          )}
      </div>

      {/* 4. Status Bar */}
      <div className="h-7 bg-glass-bg/40 border-t border-glass-border flex items-center justify-between px-4 text-[10px] text-gray-400 font-mono shrink-0">
         <div className="flex items-center gap-4">
            <span>{processedFiles.length} item(s)</span>
            <span>{selectedItems.size} selected</span>
         </div>
         <div className="flex items-center gap-4">
             {clipboard && <span className="text-indigo-300 flex items-center gap-1"><Clipboard size={10}/> {clipboard.type === 'copy' ? 'Copy' : 'Cut'} {clipboard.items.length} item(s)</span>}
             <span className={canWrite ? "text-emerald-500/80" : "text-amber-500/80"}>{canWrite ? 'Read/Write' : 'Read Only'}</span>
         </div>
      </div>

      {/* --- Modals & Popups --- */}

      {/* Context Menu - Portaled to Body to avoid Z-index/Transform issues */}
      {contextMenu && createPortal(
          <>
            {/* Transparent backdrop for click-outside closing */}
            <div 
                className="fixed inset-0 z-[9998] cursor-default" 
                onClick={() => setContextMenu(null)}
                onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
            />
            <div 
                className="fixed w-56 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] py-1.5 z-[9999] animate-pop flex flex-col text-sm text-gray-200"
                style={{ 
                    top: Math.min(contextMenu.y, window.innerHeight - 300), 
                    left: Math.min(contextMenu.x, window.innerWidth - 200) 
                }}
                onClick={(e) => e.stopPropagation()}
            >
              {!contextMenu.item ? (
                  // Empty space menu
                  <>
                    <button disabled={!canWrite} onClick={() => { setIsCreating('file'); setContextMenu(null); }} className="text-left px-4 py-2 hover:bg-indigo-600 hover:text-white disabled:opacity-50 flex items-center gap-3 transition-colors group"><Plus size={14} className="text-gray-400 group-hover:text-white"/> New File</button>
                    <button disabled={!canWrite} onClick={() => { setIsCreating('folder'); setContextMenu(null); }} className="text-left px-4 py-2 hover:bg-indigo-600 hover:text-white disabled:opacity-50 flex items-center gap-3 transition-colors group"><Folder size={14} className="text-gray-400 group-hover:text-white"/> New Folder</button>
                    <div className="h-px bg-white/10 my-1 mx-2"/>
                    <button onClick={() => { handleManualRefresh(); setContextMenu(null); }} className="text-left px-4 py-2 hover:bg-indigo-600 hover:text-white flex items-center gap-3 transition-colors group"><RefreshCw size={14} className="text-gray-400 group-hover:text-white"/> Refresh</button>
                    <div className="h-px bg-white/10 my-1 mx-2"/>
                    <button disabled={!clipboard} onClick={() => { handlePaste(); setContextMenu(null); }} className="text-left px-4 py-2 hover:bg-indigo-600 hover:text-white disabled:opacity-50 flex items-center gap-3 transition-colors group"><Clipboard size={14} className="text-gray-400 group-hover:text-white"/> Paste</button>
                    <button onClick={() => { setShowProperties({ name: 'Current Folder', type: 'folder', date: '', size: '', readOnly: !canWrite } as any); setContextMenu(null); }} className="text-left px-4 py-2 hover:bg-indigo-600 hover:text-white flex items-center gap-3 transition-colors group"><Info size={14} className="text-gray-400 group-hover:text-white"/> Properties</button>
                  </>
              ) : (
                  // Item Menu
                  <>
                    <button onClick={() => { if(activeItem) activeItem.type === 'folder' ? navigateTo(`${currentPath === '/' ? '' : currentPath}/${activeItem.name}`) : onOpenFile(activeItem, currentPath); setContextMenu(null); }} className="text-left px-4 py-2 hover:bg-indigo-600 hover:text-white font-bold transition-colors">Open</button>
                    <div className="h-px bg-white/10 my-1 mx-2"/>
                    <button onClick={() => { handleCopy(); setContextMenu(null); }} className="text-left px-4 py-2 hover:bg-indigo-600 hover:text-white flex items-center gap-3 transition-colors group"><Copy size={14} className="text-gray-400 group-hover:text-white"/> Copy</button>
                    <button disabled={!canWrite || activeItem?.readOnly} onClick={() => { handleCut(); setContextMenu(null); }} className="text-left px-4 py-2 hover:bg-indigo-600 hover:text-white disabled:opacity-50 flex items-center gap-3 transition-colors group"><Scissors size={14} className="text-gray-400 group-hover:text-white"/> Cut</button>
                    <div className="h-px bg-white/10 my-1 mx-2"/>
                    <button disabled={!canWrite || activeItem?.readOnly} onClick={() => { setRenamingItem(contextMenu.item!); setNewItemName(contextMenu.item!); setContextMenu(null); }} className="text-left px-4 py-2 hover:bg-indigo-600 hover:text-white disabled:opacity-50 flex items-center gap-3 transition-colors group"><Edit3 size={14} className="text-gray-400 group-hover:text-white"/> Rename</button>
                    <button disabled={!canWrite || activeItem?.readOnly} onClick={() => { deleteItems(Array.from(selectedItems)); setContextMenu(null); }} className="text-left px-4 py-2 hover:bg-red-600 hover:text-white disabled:opacity-50 flex items-center gap-3 text-red-400 transition-colors group"><Trash2 size={14} className="text-red-400 group-hover:text-white"/> Delete</button>
                    <div className="h-px bg-white/10 my-1 mx-2"/>
                    <button onClick={() => { if(activeItem) handleDownload(activeItem); setContextMenu(null); }} className="text-left px-4 py-2 hover:bg-indigo-600 hover:text-white flex items-center gap-3 transition-colors group"><Download size={14} className="text-gray-400 group-hover:text-white"/> Download</button>
                    <button onClick={() => { if(activeItem) setShowProperties(activeItem); setContextMenu(null); }} className="text-left px-4 py-2 hover:bg-indigo-600 hover:text-white flex items-center gap-3 transition-colors group"><Info size={14} className="text-gray-400 group-hover:text-white"/> Properties</button>
                  </>
              )}
            </div>
          </>,
          document.body
      )}

      {/* Properties Modal */}
      {showProperties && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowProperties(null)}>
              <div className="w-80 bg-glass-panel border border-glass-border rounded-2xl shadow-2xl p-6 text-glass-text transform transition-all scale-100" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 flex items-center justify-center">
                          <FileIcon item={showProperties} size={64} />
                      </div>
                      <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg truncate text-white">{showProperties.name}</h3>
                          <div className="text-xs text-indigo-400 uppercase tracking-wider font-bold">{showProperties.type}</div>
                      </div>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                      <div className="flex justify-between py-2 border-b border-white/5">
                          <span className="text-gray-500">Location</span>
                          <span className="font-mono truncate max-w-[150px] text-gray-300">{currentPath}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-white/5">
                          <span className="text-gray-500">Size</span>
                          <span className="text-gray-300">{showProperties.size || 'Calculated...'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-white/5">
                          <span className="text-gray-500">Modified</span>
                          <span className="text-gray-300">{showProperties.date}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-white/5">
                          <span className="text-gray-500">Access</span>
                          <span className={showProperties.readOnly ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>
                              {showProperties.readOnly ? 'Read Only' : 'Read / Write'}
                          </span>
                      </div>
                  </div>

                  <button onClick={() => setShowProperties(null)} className="w-full mt-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium">
                      Close
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

const SidebarItem = ({ icon, label, active, path, onClick, onDropFile }: any) => {
    const [isDragOver, setIsDragOver] = useState(false);

    return (
        <button 
            onClick={onClick}
            onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (path && onDropFile) onDropFile(e, path);
                setIsDragOver(false);
            }}
            className={`flex items-center gap-3 px-4 py-2 mx-2 rounded-lg text-sm transition-all duration-200 group relative overflow-hidden 
                ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}
                ${isDragOver ? 'bg-indigo-500/40 ring-2 ring-indigo-400 scale-105 z-10' : ''}
            `}
        >
            <div className={`relative z-10 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</div>
            <span className="relative z-10 font-medium">{label}</span>
            {active && <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-indigo-600 z-0"></div>}
        </button>
    );
};