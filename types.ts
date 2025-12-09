import { ReactNode } from 'react';

export enum AppId {
  CHAT = 'chat',
  GALLERY = 'gallery',
  ABOUT = 'about',
  SETTINGS = 'settings',
  PICTURE_VIEWER = 'picture_viewer',
  FILE_MANAGER = 'file_manager',
  CONTROL_PANEL = 'control_panel',
  TEXT_EDITOR = 'text_editor',
  HELP = 'help',
  TASK_MANAGER = 'task_manager'
}

export interface AppConfig {
  id: AppId;
  title: string;
  icon: ReactNode;
  component: ReactNode;
  width?: number;
  height?: number;
}

export interface WindowState {
  id: AppId;
  isOpen: boolean;
  isMinimized: boolean;
  zIndex: number;
  position: { x: number; y: number };
  data?: any;
  desktopId: number; // 0 or 1
  previewUrl?: string; // Data URL of the window screenshot
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isError?: boolean;
}

export interface UserProfile {
  name: string;
  role: string;
  avatarColor: string;
}

export interface TaskbarSettings {
  alignment: 'left' | 'center';
  position: 'bottom' | 'top';
  showSearch: boolean;
  showSeconds: boolean;
  autoHide: boolean;
}

export interface SystemSettings {
  wallpaper: string;
  accentColor: string;
  theme: 'dark' | 'light';
  taskbar: TaskbarSettings;
}

export interface FileSystemItem {
  name: string;
  type: 'file' | 'folder';
  size?: string; 
  date: string;
  url?: string;
  content?: string;
  fileType?: 'image' | 'text' | 'unknown';
  readOnly?: boolean; // New: to protect System files
}

export interface FileClipboard {
  type: 'copy' | 'cut';
  items: { path: string, name: string }[];
}

// New Interface for Context Menu
export interface MenuItem {
  label: string;
  icon?: ReactNode;
  action?: () => void;
  disabled?: boolean;
  danger?: boolean;
  separator?: boolean;
  // Simple submenu support could be added here, but keeping flat for now
}