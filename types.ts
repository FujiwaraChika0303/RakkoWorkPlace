import { ReactNode } from 'react';

export enum AppId {
  CHAT = 'chat',
  GALLERY = 'gallery',
  ABOUT = 'about',
  SETTINGS = 'settings',
  PICTURE_VIEWER = 'picture_viewer',
  FILE_MANAGER = 'file_manager',
  CONTROL_PANEL = 'control_panel',
  TEXT_EDITOR = 'text_editor'
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

export interface SystemSettings {
  wallpaper: string;
  accentColor: string;
  theme: 'dark' | 'light';
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