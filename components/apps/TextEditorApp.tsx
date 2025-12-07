import React, { useState, useEffect } from 'react';
import { Save, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { fsService } from '../../services/fileSystemService';

interface TextEditorProps {
  initialPath?: string; // e.g., "/C/Documents"
  initialFileName?: string; // e.g., "note.txt"
}

export const TextEditorApp: React.FC<TextEditorProps> = ({ initialPath, initialFileName }) => {
  const [content, setContent] = useState('');
  const [path, setPath] = useState(initialPath || '');
  const [fileName, setFileName] = useState(initialFileName || 'Untitled.txt');
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);

  useEffect(() => {
    if (initialPath && initialFileName) {
      const fileContent = fsService.getFileContent(initialPath, initialFileName);
      if (fileContent !== null) {
        setContent(fileContent);
      }
      
      // Check Read Only
      if (!initialPath.startsWith('/C')) {
        setIsReadOnly(true);
      }
    }
  }, [initialPath, initialFileName]);

  const handleSave = () => {
    if (isReadOnly) {
        setError("Cannot save to Read-Only System Drive.");
        return;
    }
    
    let success = false;

    if (!path) {
        // Simple mock save dialog for new files - defaulting to /C/Documents for now
        const defaultPath = '/C/Documents';
        setPath(defaultPath);
        try {
            fsService.createFile(defaultPath, fileName, 'file', content);
            setIsDirty(false);
            setError(null);
            success = true;
        } catch (e: any) {
            // If file exists, try update
            if (e.message === "File already exists") {
                fsService.updateFile(defaultPath, fileName, content);
                setIsDirty(false);
                setError(null);
                success = true;
            } else {
                setError(e.message);
            }
        }
    } else {
        try {
            fsService.updateFile(path, fileName, content);
            setIsDirty(false);
            setError(null);
            success = true;
        } catch (e: any) {
            setError(e.message);
        }
    }

    if (success) {
        setShowSaveToast(true);
        setTimeout(() => setShowSaveToast(false), 2000);
    }
  };

  return (
    <div className="h-full flex flex-col bg-glass-panel text-glass-text relative overflow-hidden">
      {/* Toolbar */}
      <div className="h-12 border-b border-glass-border flex items-center justify-between px-4 bg-glass-bg/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-blue-500/20 flex items-center justify-center text-blue-400">
             <FileText size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium leading-none">{fileName} {isDirty && '*'}</span>
            <span className="text-[10px] text-glass-textMuted font-mono mt-1">
                {path ? `${path}/${fileName}` : 'New File'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
            {error && (
                <div className="text-red-400 text-xs flex items-center gap-1 mr-2 animate-pulse">
                    <AlertTriangle size={12} /> {error}
                </div>
            )}
            <button 
                onClick={handleSave}
                disabled={!isDirty && !!path} 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    isReadOnly 
                    ? 'bg-gray-500/10 text-gray-500 cursor-not-allowed' 
                    : isDirty 
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                        : 'bg-glass-border/20 text-glass-textMuted hover:bg-glass-border/30 hover:text-glass-text'
                }`}
            >
                <Save size={14} />
                Save
            </button>
        </div>
      </div>

      {/* Editor Area */}
      <textarea
        className="flex-1 w-full h-full bg-transparent p-4 resize-none outline-none font-mono text-sm leading-relaxed placeholder-glass-textMuted/50 text-glass-text"
        value={content}
        onChange={(e) => {
            setContent(e.target.value);
            setIsDirty(true);
        }}
        placeholder="Type here..."
        spellCheck={false}
      />
      
      {/* Status Bar / Read Only Warning */}
      {isReadOnly ? (
        <div className="bg-red-500/10 border-t border-red-500/20 px-4 py-1 text-[10px] text-red-400 text-center uppercase tracking-widest font-bold">
            Read Only Mode
        </div>
      ) : (
          <div className="h-6 bg-glass-bg/30 border-t border-glass-border px-3 flex items-center justify-between text-[10px] text-glass-textMuted font-mono">
              <span>UTF-8</span>
              <span>{content.length} chars</span>
          </div>
      )}

      {/* Save Notification Toast */}
      <div 
        className={`absolute bottom-10 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 transition-all duration-300 ${
            showSaveToast ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'
        }`}
      >
        <CheckCircle2 size={16} />
        <span className="text-xs font-medium">File Saved Successfully</span>
      </div>
    </div>
  );
};