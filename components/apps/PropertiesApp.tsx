import React, { useState, useEffect } from 'react';
import { 
  FileText, HardDrive, Calendar, Shield, Tag, Folder, 
  Image as ImageIcon, Box, Monitor, Info, Lock, Globe,
  Copy, ExternalLink, Download, PieChart, Palette, Hash,
  Type, Check, X, ChevronRight, Clock
} from 'lucide-react';
import { fsService } from '../../services/fileSystemService';
import { AppId, FileSystemItem } from '../../types';

interface PropertiesAppProps {
  data?: {
    item: any;
    type: 'file' | 'app' | 'desktop' | 'system';
  };
  onClose?: () => void;
  onOpenApp?: (id: AppId, data?: any) => void;
}

export const PropertiesApp: React.FC<PropertiesAppProps> = ({ data, onClose, onOpenApp }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [isDirty, setIsDirty] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // State for editable fields
  const [name, setName] = useState('');
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [date, setDate] = useState('');
  const [colorTag, setColorTag] = useState<string | undefined>(undefined);

  // State for calculated statistics
  const [folderSize, setFolderSize] = useState<string>('Calculating...');
  const [fileCount, setFileCount] = useState<number>(0);
  const [imageMeta, setImageMeta] = useState<{width: number, height: number} | null>(null);
  const [textMeta, setTextMeta] = useState<{lines: number, words: number, chars: number} | null>(null);

  if (!data) return <div className="p-8 text-center text-gray-500">No properties to display.</div>;

  const { item, type } = data;
  const isFile = type === 'file';
  const isFolder = isFile && item.type === 'folder';
  const canModify = isFile && item._parentPath?.startsWith('/C');

  useEffect(() => {
    if (item) {
        setName(item.name || item.label || 'Unknown');
        setIsReadOnly(item.readOnly || false);
        setIsHidden(item.hidden || false);
        setDate(item.date || new Date().toISOString().split('T')[0]);
        setColorTag(item.colorTag);

        // Deep Stats for Folder
        if (isFolder && item._parentPath) {
             const fullPath = item._parentPath === '/' ? `/${item.name}` : `${item._parentPath}/${item.name}`;
             calculateFolderStats(fullPath);
        }

        // Image Metadata
        if (isFile && item.fileType === 'image' && item.url) {
            const img = new Image();
            img.src = item.url;
            img.onload = () => setImageMeta({ width: img.width, height: img.height });
        }

        // Text Metadata
        if (isFile && item.fileType === 'text' && item.content) {
            const lines = item.content.split('\n').length;
            const words = item.content.trim().split(/\s+/).length;
            const chars = item.content.length;
            setTextMeta({ lines, words, chars });
        }
    }
  }, [item, refreshTrigger]);

  const calculateFolderStats = (path: string) => {
     try {
         const allFiles = getAllFilesRecursive(path);
         setFileCount(allFiles.length);
         const totalKB = allFiles.reduce((acc, f) => {
             const sizeStr = f.size || '0 KB';
             const num = parseFloat(sizeStr.split(' ')[0]);
             return acc + (isNaN(num) ? 0 : num);
         }, 0);
         setFolderSize(`${totalKB.toFixed(1)} KB`);
     } catch (e) {
         setFolderSize('Unknown');
     }
  };

  const getAllFilesRecursive = (path: string): FileSystemItem[] => {
      let results: FileSystemItem[] = [];
      const contents = fsService.getDirectory(path);
      for (const f of contents) {
          results.push(f);
          if (f.type === 'folder') {
              results = results.concat(getAllFilesRecursive(`${path}/${f.name}`));
          }
      }
      return results;
  };

  const handleRename = () => {
      if (isFile && name !== item.name && canModify) {
          fsService.renameFile(item._parentPath, item.name, name);
      }
  };

  const handleApply = () => {
      if (!canModify) return;
      
      try {
          if (name !== item.name) {
              fsService.renameFile(item._parentPath, item.name, name);
          }
          
          const targetName = name !== item.name ? name : item.name;
          
          fsService.updateFileMetadata(item._parentPath, targetName, {
              readOnly: isReadOnly,
              hidden: isHidden,
              date: date,
              colorTag: colorTag
          });

          setIsDirty(false);
          setRefreshTrigger(prev => prev + 1);
      } catch (e: any) {
          alert(e.message);
      }
  };

  const handleCopyPath = () => {
      const fullPath = item._parentPath === '/' ? `/${item.name}` : `${item._parentPath}/${item.name}`;
      navigator.clipboard.writeText(fullPath);
      // Could show a toast here
  };

  const handleOpenLocation = () => {
      if (item._parentPath && onOpenApp) {
          onClose && onClose();
          setTimeout(() => {
             onOpenApp(AppId.FILE_MANAGER); 
          }, 100);
      }
  };

  const handleDownload = () => {
      if (isFile) {
        const content = item.content || '';
        const blob = new Blob([content], { type: 'text/plain' });
        const url = item.url || URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        if (!item.url) URL.revokeObjectURL(url);
      }
  };

  const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

  const renderIcon = () => {
    if (type === 'desktop') return <Monitor size={40} className="text-indigo-400" />;
    if (type === 'app') return item.icon || <Box size={40} className="text-blue-400" />;
    if (type === 'file') {
       if (item.type === 'folder') return <Folder size={40} className="text-yellow-400" />;
       if (item.fileType === 'image') return <ImageIcon size={40} className="text-purple-400" />;
       return <FileText size={40} className="text-gray-400" />;
    }
    return <Info size={40} className="text-gray-400" />;
  };

  return (
    <div className="h-full flex flex-col bg-[#121212] text-gray-200 font-sans text-xs select-none overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex p-3 gap-2 shrink-0">
            <TabButton 
                label="General" 
                active={activeTab === 'general'} 
                onClick={() => setActiveTab('general')} 
            />
            {(isFolder || item.fileType === 'image' || item.fileType === 'text') && (
                <TabButton 
                    label="Details" 
                    active={activeTab === 'details'} 
                    onClick={() => setActiveTab('details')} 
                />
            )}
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4">
            
            {/* Hero Section (Always visible on General) */}
            {activeTab === 'general' && (
                <div className="flex flex-col items-center mb-6 animate-fade-in">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-transparent border border-white/10 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                        {renderIcon()}
                    </div>
                    <div className="w-full max-w-xs relative group">
                        <input 
                            className={`
                                w-full bg-transparent text-center text-lg font-bold text-white border-b-2 outline-none py-1 transition-colors
                                ${canModify ? 'border-white/10 focus:border-indigo-500 hover:border-white/20' : 'border-transparent cursor-default'}
                            `}
                            value={name}
                            onChange={(e) => { setName(e.target.value); setIsDirty(true); }}
                            readOnly={!canModify}
                        />
                        {canModify && <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"><Type size={12} className="text-gray-500"/></div>}
                    </div>
                    <div className="text-gray-500 mt-1 flex items-center gap-2">
                        <span>{isFile ? (isFolder ? 'File Folder' : `${item.fileType?.toUpperCase() || 'UNK'} File`) : 'System Item'}</span>
                    </div>
                </div>
            )}

            {activeTab === 'general' && (
                <div className="space-y-4 animate-slide-up">
                    {/* Info Card */}
                    <div className="bg-white/5 rounded-xl border border-white/5 p-4 space-y-3">
                        {isFile && (
                            <>
                                <InfoRow label="Location" value={item._parentPath || 'Root'} icon={<HardDrive size={14}/>}>
                                    <div className="flex items-center gap-1 ml-2">
                                        <button onClick={handleCopyPath} title="Copy Path" className="p-1.5 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors"><Copy size={12}/></button>
                                        <button onClick={handleOpenLocation} title="Open Location" className="p-1.5 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors"><ExternalLink size={12}/></button>
                                    </div>
                                </InfoRow>
                                <div className="h-px bg-white/5" />
                                <InfoRow label="Size" value={isFolder ? folderSize : (item.size || 'Unknown')} icon={<PieChart size={14}/>} />
                                {isFolder && <InfoRow label="Contains" value={`${fileCount} Files`} icon={<Box size={14}/>} />}
                            </>
                        )}
                        {(type === 'file' || type === 'desktop') && (
                            <>
                                <div className="h-px bg-white/5" />
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-gray-400">
                                        <Clock size={14} />
                                        <span>Created</span>
                                    </div>
                                    {canModify ? (
                                        <input 
                                            type="date" 
                                            value={date}
                                            onChange={(e) => { setDate(e.target.value); setIsDirty(true); }}
                                            className="bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-gray-200 outline-none focus:border-indigo-500"
                                        />
                                    ) : (
                                        <span className="text-gray-200">{date}</span>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Attributes Card */}
                    {canModify && (
                        <div className="bg-white/5 rounded-xl border border-white/5 p-4 space-y-4">
                            <div className="flex items-center gap-2 text-gray-400 mb-2">
                                <Tag size={14}/> <span>Attributes</span>
                            </div>
                            
                            {/* Color Tags */}
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Color Label</span>
                                <div className="flex gap-2">
                                    {COLORS.map(c => (
                                        <button 
                                            key={c}
                                            onClick={() => { setColorTag(colorTag === c ? undefined : c); setIsDirty(true); }}
                                            className={`
                                                w-5 h-5 rounded-full transition-all duration-200 hover:scale-110
                                                ${colorTag === c ? 'ring-2 ring-offset-2 ring-offset-[#1c1c1c] ring-white scale-110' : 'opacity-60 hover:opacity-100'}
                                            `}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                    <button 
                                        onClick={() => { setColorTag(undefined); setIsDirty(true); }}
                                        className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-gray-500 hover:text-white hover:border-white transition-colors"
                                        title="Clear"
                                    >
                                        <X size={10}/>
                                    </button>
                                </div>
                            </div>

                            <div className="h-px bg-white/5" />

                            {/* Toggles */}
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Settings</span>
                                <div className="flex gap-4">
                                    <AttributeToggle 
                                        label="Read-only" 
                                        checked={isReadOnly} 
                                        onChange={(v) => { setIsReadOnly(v); setIsDirty(true); }} 
                                        icon={<Lock size={12}/>}
                                    />
                                    <AttributeToggle 
                                        label="Hidden" 
                                        checked={isHidden} 
                                        onChange={(v) => { setIsHidden(v); setIsDirty(true); }} 
                                        icon={<Shield size={12}/>}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions Card */}
                    {isFile && !isFolder && (
                         <button 
                            onClick={handleDownload}
                            className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl flex items-center justify-center gap-2 text-gray-300 hover:text-white transition-all group"
                        >
                            <Download size={14} className="group-hover:translate-y-0.5 transition-transform"/> Download File to PC
                         </button>
                    )}
                </div>
            )}

            {/* Details Tab Content */}
            {activeTab === 'details' && (
                <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden animate-slide-up">
                    <div className="p-3 border-b border-white/5 bg-white/5 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                        Advanced Information
                    </div>
                    <div className="divide-y divide-white/5">
                        <DetailRow label="Name" value={item.name} />
                        <DetailRow label="Type" value={isFolder ? 'File Folder' : item.fileType || 'Unknown'} />
                        <DetailRow label="Path" value={item._parentPath} />
                        <DetailRow label="Last Modified" value={date} />
                        
                        {imageMeta && (
                            <>
                                <div className="p-2 bg-white/5 text-indigo-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-2">
                                    <ImageIcon size={10}/> Image Data
                                </div>
                                <DetailRow label="Dimensions" value={`${imageMeta.width} x ${imageMeta.height} px`} monospace />
                                <DetailRow label="Aspect Ratio" value={(imageMeta.width / imageMeta.height).toFixed(2)} monospace />
                                <DetailRow label="Megapixels" value={`${((imageMeta.width * imageMeta.height) / 1000000).toFixed(1)} MP`} monospace />
                            </>
                        )}

                        {textMeta && (
                            <>
                                <div className="p-2 bg-white/5 text-indigo-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-2">
                                    <Type size={10}/> Text Statistics
                                </div>
                                <DetailRow label="Lines" value={textMeta.lines} monospace />
                                <DetailRow label="Words" value={textMeta.words} monospace />
                                <DetailRow label="Characters" value={textMeta.chars} monospace />
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#1a1a1a] border-t border-white/10 flex items-center justify-between shrink-0">
             <div className="text-[10px] text-gray-600">
                 {isDirty ? 'Unsaved changes' : 'No changes'}
             </div>
             <div className="flex gap-2">
                <button 
                    onClick={onClose}
                    className="px-4 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={() => { handleApply(); onClose && onClose(); }}
                    className="px-6 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all font-medium flex items-center gap-2"
                >
                    <Check size={14}/> OK
                </button>
                {canModify && (
                     <button 
                        onClick={handleApply}
                        disabled={!isDirty}
                        className="px-3 py-1.5 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                        Apply
                    </button>
                )}
             </div>
        </div>
    </div>
  );
};

// --- Sub-components ---

const TabButton = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className={`
            flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
            ${active 
                ? 'bg-white/10 text-white shadow-inner' 
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}
        `}
    >
        {label}
    </button>
);

const InfoRow = ({ label, value, icon, children }: any) => (
    <div className="flex items-center justify-between group">
        <div className="flex items-center gap-3 text-gray-400">
            {icon}
            <span>{label}</span>
        </div>
        <div className="flex items-center">
            <span className="text-gray-200 font-medium truncate max-w-[150px]">{value}</span>
            {children}
        </div>
    </div>
);

const DetailRow = ({ label, value, monospace }: any) => (
    <div className="grid grid-cols-2 px-3 py-2 text-xs hover:bg-white/5">
        <span className="text-gray-500">{label}</span>
        <span className={`text-gray-200 truncate select-text ${monospace ? 'font-mono' : ''}`}>{value}</span>
    </div>
);

const AttributeToggle = ({ label, checked, onChange, icon }: any) => (
    <button 
        onClick={() => onChange(!checked)}
        className={`
            flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-200
            ${checked 
                ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' 
                : 'bg-transparent border-white/10 text-gray-500 hover:border-white/30'}
        `}
    >
        {icon}
        <span>{label}</span>
    </button>
);
