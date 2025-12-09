import { FileSystemItem } from '../types';

/**
 * File System Service
 * Manages the hybrid file system:
 * 1. Read-Only Static System Files (from static definition)
 * 2. Read-Write Local Files (from localStorage 'rakko_fs')
 */

const STORAGE_KEY = 'rakko_fs_c_drive';

// --- Initial Static System Data ---
const SYSTEM_FILES: Record<string, FileSystemItem[]> = {
  '/': [
    { name: 'System', type: 'folder', date: '2023-01-01', readOnly: true },
    { name: 'C', type: 'folder', date: '2024-01-01', readOnly: false }
  ],
  '/System': [
    { name: 'Wallpapers', type: 'folder', date: '2023-02-15', readOnly: true },
    { name: 'Docs', type: 'folder', date: '2023-03-10', readOnly: true },
    { name: 'Readme.txt', type: 'file', size: '1 KB', date: '2024-05-20', fileType: 'text', content: 'Welcome to Rakko Workplace.\nSystem files are read-only.', readOnly: true },
  ],
  '/System/Docs': [
      { name: 'Specs.txt', type: 'file', size: '12 KB', date: '2024-01-15', fileType: 'text', readOnly: true },
  ],
  '/System/Wallpapers': [
    { name: "Rakko_Default_Wall.png", type: 'file', fileType: 'image', size: '3.5 MB', date: '2024-05-01', url: "https://static.rakko.cn/RakkoWorkplaceAssets/Pic/Wall.png", readOnly: true },
    { name: "Ciel_Phantomhive.png", type: 'file', fileType: 'image', size: '2.4 MB', date: '2024-04-10', url: "https://static.rakko.cn/%E9%BB%91%E6%89%A7%E4%BA%8B%202.png", readOnly: true },
    { name: "Neon_City.png", type: 'file', fileType: 'image', size: '1.8 MB', date: '2024-03-15', url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop", readOnly: true },
  ]
};

type FileSystemState = Record<string, FileSystemItem[]>;

const INITIAL_C_DRIVE: FileSystemState = {
  '/C': [
    { name: 'Documents', type: 'folder', date: new Date().toISOString().split('T')[0] },
    { name: 'Desktop', type: 'folder', date: new Date().toISOString().split('T')[0] },
    { name: 'Users', type: 'folder', date: new Date().toISOString().split('T')[0] },
  ],
  '/C/Documents': [
    { name: 'Welcome.txt', type: 'file', fileType: 'text', size: '1 KB', date: new Date().toISOString().split('T')[0], content: 'Welcome to your local C Drive!\nYou can edit this file.' },
    { name: 'Todo.txt', type: 'file', fileType: 'text', size: '1 KB', date: new Date().toISOString().split('T')[0], content: '- Buy milk\n- Update Rakko OS' },
  ],
  '/C/Desktop': [],
  '/C/Users': []
};

class FileSystemService {
  private cDrive: FileSystemState;

  constructor() {
    this.cDrive = this.loadCDrive();
    // Ensure Desktop exists for legacy data
    if (!this.cDrive['/C/Desktop']) {
      this.cDrive['/C/Desktop'] = [];
    }
  }

  private loadCDrive(): FileSystemState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : INITIAL_C_DRIVE;
    } catch (e) {
      console.error("Failed to load FS", e);
      return INITIAL_C_DRIVE;
    }
  }

  private saveCDrive() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cDrive));
    window.dispatchEvent(new Event('fs-update'));
  }

  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    // For very small files, show as 1 KB if it's > 0 but < 1024 in logic usually, 
    // but here let's be precise or default to KB for consistency
    if (i < 1) return `${Math.max(1, Math.ceil(bytes / 1024))} KB`;
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  private detectFileType(name: string): 'image' | 'text' | 'unknown' {
      const ext = name.split('.').pop()?.toLowerCase();
      if (!ext) return 'unknown';
      
      const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'ico', 'svg', 'bmp'];
      const textExts = ['txt', 'md', 'json', 'js', 'ts', 'tsx', 'jsx', 'html', 'css', 'csv', 'xml', 'log'];
      
      if (imageExts.includes(ext)) return 'image';
      if (textExts.includes(ext)) return 'text';
      
      return 'unknown';
  }

  // --- Public API ---

  public getDirectory(path: string): FileSystemItem[] {
    if (SYSTEM_FILES[path]) return SYSTEM_FILES[path];
    if (path.startsWith('/C')) {
      return this.cDrive[path] || [];
    }
    return [];
  }

  public getFileContent(path: string, fileName: string): string | null {
    const files = this.getDirectory(path);
    const file = files.find(f => f.name === fileName);
    return file?.content || null;
  }

  public getFileUrl(path: string, fileName: string): string | undefined {
      const files = this.getDirectory(path);
      const file = files.find(f => f.name === fileName);
      return file?.url;
  }

  public createFile(path: string, name: string, type: 'file' | 'folder', content: string = '', url?: string, sizeInBytes?: number): void {
    if (!path.startsWith('/C')) throw new Error("Permission Denied: Read-only File System");
    
    if (!this.cDrive[path]) this.cDrive[path] = [];
    
    // Auto-rename if duplicate
    let finalName = name;
    let counter = 1;
    while (this.cDrive[path].some(f => f.name === finalName)) {
        const parts = name.split('.');
        if (parts.length > 1) {
            const ext = parts.pop();
            finalName = `${parts.slice(0, -1).join('.')} (${counter}).${ext}`;
        } else {
            finalName = `${name} (${counter})`;
        }
        counter++;
    }

    // Determine Size
    let sizeStr = '0 KB';
    if (type === 'file') {
        if (sizeInBytes !== undefined) {
            sizeStr = this.formatSize(sizeInBytes);
        } else if (url && url.startsWith('data:')) {
            // Estimate size from Base64 string if explicit size not provided
            const base64Length = url.split(',')[1]?.length || 0;
            const estimatedBytes = Math.ceil(base64Length * 3 / 4); 
            sizeStr = this.formatSize(estimatedBytes);
        } else if (content) {
            sizeStr = this.formatSize(content.length);
        } else {
            sizeStr = 'Unknown';
        }
    }

    const newItem: FileSystemItem = {
      name: finalName,
      type,
      fileType: type === 'file' ? this.detectFileType(finalName) : undefined,
      size: type === 'file' ? sizeStr : undefined,
      date: new Date().toISOString().split('T')[0],
      content: content,
      url: url,
      readOnly: false
    };

    this.cDrive[path].push(newItem);

    if (type === 'folder') {
      this.cDrive[`${path}/${finalName}`] = [];
    }

    this.saveCDrive();
  }

  public deleteFile(path: string, name: string): void {
    if (!path.startsWith('/C')) throw new Error("Permission Denied: Read-only File System");
    
    const dir = this.cDrive[path];
    if (!dir) return;

    const fileIndex = dir.findIndex(f => f.name === name);
    if (fileIndex === -1) return;

    const file = dir[fileIndex];

    // Remove file entry
    this.cDrive[path].splice(fileIndex, 1);

    // If folder, cleanup all children (simplistic recursive delete)
    if (file.type === 'folder') {
      const folderPath = `${path}/${name}`;
      Object.keys(this.cDrive).forEach(key => {
        if (key.startsWith(folderPath)) {
          delete this.cDrive[key];
        }
      });
    }

    this.saveCDrive();
  }

  public updateFile(path: string, name: string, newContent: string): void {
    if (!path.startsWith('/C')) throw new Error("Permission Denied: Read-only File System");
    
    const dir = this.cDrive[path];
    if (!dir) throw new Error("Path not found");

    const file = dir.find(f => f.name === name);
    if (!file) throw new Error("File not found");

    file.content = newContent;
    file.size = this.formatSize(newContent.length);
    file.date = new Date().toISOString().split('T')[0];

    this.saveCDrive();
  }

  public updateFileMetadata(path: string, name: string, updates: Partial<FileSystemItem>): void {
    if (!path.startsWith('/C')) throw new Error("Permission Denied: Read-only File System");
    
    const dir = this.cDrive[path];
    if (!dir) throw new Error("Path not found");

    const file = dir.find(f => f.name === name);
    if (!file) throw new Error("File not found");

    Object.assign(file, updates);
    this.saveCDrive();
  }

  public renameFile(path: string, oldName: string, newName: string): void {
    if (!path.startsWith('/C')) throw new Error("Permission Denied: Read-only File System");
    if (!newName.trim()) throw new Error("Name cannot be empty");

    const dir = this.cDrive[path];
    if (dir.some(f => f.name === newName)) throw new Error("Name already exists");

    const file = dir.find(f => f.name === oldName);
    if (!file) throw new Error("File not found");

    const oldPath = `${path}/${oldName}`;
    const newPath = `${path}/${newName}`;

    file.name = newName;
    
    // Update file type based on new extension
    if (file.type === 'file') {
        file.fileType = this.detectFileType(newName);
    }

    // If folder, we need to rename keys in the cDrive object
    if (file.type === 'folder') {
        const updates: Record<string, FileSystemItem[]> = {};
        const deletions: string[] = [];

        Object.keys(this.cDrive).forEach(key => {
            if (key === oldPath || key.startsWith(oldPath + '/')) {
                const newKey = key.replace(oldPath, newPath);
                updates[newKey] = this.cDrive[key];
                deletions.push(key);
            }
        });

        deletions.forEach(k => delete this.cDrive[k]);
        Object.assign(this.cDrive, updates);
    }

    this.saveCDrive();
  }

  public moveFile(sourcePath: string, destPath: string, fileName: string): void {
      if (sourcePath === destPath) return; // Same directory
      // Basic Copy + Delete
      this.copyFile(sourcePath, destPath, fileName);
      this.deleteFile(sourcePath, fileName);
  }

  public copyFile(sourcePath: string, destPath: string, fileName: string): void {
      // 1. Get Source
      let sourceDir: FileSystemItem[] = [];
      if (sourcePath.startsWith('/C')) sourceDir = this.cDrive[sourcePath] || [];
      else if (SYSTEM_FILES[sourcePath]) sourceDir = SYSTEM_FILES[sourcePath];
      else throw new Error("Source path not found");

      const file = sourceDir.find(f => f.name === fileName);
      if (!file) throw new Error("File not found");

      // 2. Create in Dest
      // We pass undefined for size to recalculate or we can pass raw size if we stored bytes, 
      // but we store formatted string. Ideally we should store bytes but for now we regenerate or copy size string?
      // createFile calculates size from content or URL. 
      // If we are copying a file, we want to preserve attributes.
      // But createFile API is slightly higher level. 
      // Let's modify logic to just insert the object clone for copy to ensure fidelity, then handle rename logic.
      
      // Since createFile handles duplicate naming, let's use it but perhaps we need to parse the size string back to bytes? 
      // Or just trust createFile's calculation again.
      this.createFile(destPath, file.name, file.type, file.content || '', file.url);
      
      // Note: If the file was "Unknown" size before, it will stay Unknown unless we have data to calculate.
  }

  public getAllWallpapers(): FileSystemItem[] {
    // Aggregate wallpapers from System + potentially C drive if user adds some
    const systemWalls = SYSTEM_FILES['/System/Wallpapers'] || [];
    return systemWalls;
  }
}

export const fsService = new FileSystemService();