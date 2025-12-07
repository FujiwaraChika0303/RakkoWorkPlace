import React, { useState } from 'react';
import { Monitor, User, Layers, Shield, Check, Laptop, Sun, Moon } from 'lucide-react';
import { SystemSettings, UserProfile } from '../../types';
import { fsService } from '../../services/fileSystemService';

interface ControlPanelProps {
  settings: SystemSettings;
  user: UserProfile;
  onUpdateSettings: (newSettings: Partial<SystemSettings>) => void;
  onUpdateUser: (newUser: UserProfile) => void;
}

type TabId = 'display' | 'personalization' | 'accounts' | 'system';

export const ControlPanelApp: React.FC<ControlPanelProps> = ({ 
  settings, 
  user, 
  onUpdateSettings, 
  onUpdateUser 
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('display');

  // Use fsService to get wallpapers
  const allWallpapers = fsService.getAllWallpapers();

  const accentColors = [
    { name: 'indigo', hex: '#6366f1' },
    { name: 'rose', hex: '#f43f5e' },
    { name: 'emerald', hex: '#10b981' },
    { name: 'amber', hex: '#f59e0b' },
    { name: 'purple', hex: '#a855f7' },
    { name: 'blue', hex: '#3b82f6' },
  ];

  const users: UserProfile[] = [
    { name: 'Rakko Admin', role: 'Administrator', avatarColor: 'bg-indigo-500' },
    { name: 'Guest User', role: 'Visitor', avatarColor: 'bg-gray-500' },
    { name: 'Developer', role: 'System', avatarColor: 'bg-emerald-600' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'display':
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-lg font-medium text-glass-text mb-4 flex items-center gap-2"><Monitor size={20} /> Background</h3>
              <div className="grid grid-cols-2 gap-4">
                {allWallpapers.map((wp, idx) => (
                  <button
                    key={idx}
                    onClick={() => wp.url && onUpdateSettings({ wallpaper: wp.url })}
                    className={`relative group rounded-lg overflow-hidden aspect-video border-2 transition-all ${
                      settings.wallpaper === wp.url 
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg shadow-indigo-500/20' 
                      : 'border-glass-border hover:border-glass-textMuted'
                    }`}
                  >
                    <img src={wp.url} alt={wp.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-medium backdrop-blur-sm">
                      Apply Wallpaper
                    </div>
                    {settings.wallpaper === wp.url && (
                      <div className="absolute top-2 right-2 bg-indigo-500 text-white p-1 rounded-full shadow-lg">
                        <Check size={12} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 'personalization':
        return (
          <div className="space-y-8 animate-fade-in">
            {/* Theme Mode */}
            <div>
                 <h3 className="text-lg font-medium text-glass-text mb-4 flex items-center gap-2"><Sun size={20}/> Theme Mode</h3>
                 <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => onUpdateSettings({ theme: 'light' })}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${settings.theme === 'light' ? 'border-indigo-500 bg-indigo-500/10' : 'border-glass-border hover:bg-glass-border/10'}`}
                    >
                        <div className="w-full h-20 bg-gray-200 rounded-lg relative overflow-hidden shadow-sm">
                            <div className="absolute top-2 left-2 w-16 h-12 bg-white rounded shadow-sm"></div>
                        </div>
                        <div className="flex items-center gap-2 font-medium text-glass-text">
                           <Sun size={16} /> Light
                           {settings.theme === 'light' && <Check size={14} className="text-indigo-500"/>}
                        </div>
                    </button>
                    <button 
                        onClick={() => onUpdateSettings({ theme: 'dark' })}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${settings.theme === 'dark' ? 'border-indigo-500 bg-indigo-500/10' : 'border-glass-border hover:bg-glass-border/10'}`}
                    >
                        <div className="w-full h-20 bg-gray-900 rounded-lg relative overflow-hidden shadow-sm border border-gray-700">
                             <div className="absolute top-2 left-2 w-16 h-12 bg-gray-800 rounded shadow-sm border border-gray-700"></div>
                        </div>
                        <div className="flex items-center gap-2 font-medium text-glass-text">
                           <Moon size={16} /> Dark
                           {settings.theme === 'dark' && <Check size={14} className="text-indigo-500"/>}
                        </div>
                    </button>
                 </div>
            </div>

            {/* Accent Color */}
            <div>
              <h3 className="text-lg font-medium text-glass-text mb-4 flex items-center gap-2"><Layers size={20}/> Accent Color</h3>
              <div className="flex gap-4 flex-wrap">
                {accentColors.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => onUpdateSettings({ accentColor: c.name })}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-110 border-2 ${
                      settings.accentColor === c.name ? 'border-white ring-2 ring-white/20' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {settings.accentColor === c.name && <Check size={24} className="text-white drop-shadow-md" />}
                  </button>
                ))}
              </div>
              <p className="text-sm text-glass-textMuted mt-4 bg-glass-bg/5 p-4 rounded-lg border border-glass-border">
                The accent color is applied to window borders, taskbar indicators, selection highlights, and primary buttons across Rakko Workplace.
              </p>
            </div>
          </div>
        );

      case 'accounts':
        return (
          <div className="space-y-6 animate-fade-in">
             <h3 className="text-lg font-medium text-glass-text mb-4 flex items-center gap-2"><User size={20} /> User Profile</h3>
             
             <div className="bg-glass-bg/5 p-6 rounded-xl border border-glass-border shadow-lg flex items-center gap-6">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-inner ${user.avatarColor}`}>
                  {user.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-xl text-glass-text">{user.name}</div>
                  <div className="text-indigo-400 font-mono text-sm">{user.role}</div>
                  <div className="mt-2 text-xs text-glass-textMuted flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div> Active Session
                  </div>
                </div>
             </div>

             <h3 className="text-sm font-bold text-glass-textMuted uppercase tracking-widest mt-8 mb-2">Switch User</h3>
             <div className="space-y-2">
                {users.map((u) => (
                  <button
                    key={u.name}
                    onClick={() => onUpdateUser(u)}
                    className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-all ${
                      user.name === u.name 
                      ? 'bg-indigo-600/20 border border-indigo-500/50 shadow-inner' 
                      : 'bg-glass-bg/20 border border-glass-border hover:bg-glass-border/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs shadow-sm ${u.avatarColor}`}>
                        {u.name.charAt(0)}
                      </div>
                      <span className={`font-medium ${user.name === u.name ? 'text-indigo-200' : 'text-glass-text'}`}>{u.name}</span>
                    </div>
                    {user.name === u.name && <Check size={16} className="text-indigo-400" />}
                  </button>
                ))}
             </div>
          </div>
        );
      
      case 'system':
        return (
          <div className="space-y-4 animate-fade-in text-center pt-10">
            <div className="w-32 h-32 bg-gradient-to-br from-gray-800 to-black rounded-2xl mx-auto flex items-center justify-center text-white shadow-2xl border border-glass-border mb-6">
               <Laptop size={64} className="text-gray-200" />
            </div>
            <h2 className="text-3xl font-serif font-bold text-glass-text tracking-wide">Rakko Workplace</h2>
            <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-mono mb-4">
              v3.2.0 (Stable)
            </div>
            <div className="text-left max-w-sm mx-auto space-y-2 bg-glass-bg/30 p-4 rounded-lg border border-glass-border text-sm text-glass-textMuted">
               <div className="flex justify-between"><span>Kernel</span> <span className="text-glass-textMuted font-mono">RakkoCore 1.3</span></div>
               <div className="flex justify-between"><span>Storage</span> <span className="text-glass-textMuted font-mono">Local Storage Virtual</span></div>
               <div className="flex justify-between"><span>Theme</span> <span className="text-glass-textMuted font-mono capitalize">{settings.theme}</span></div>
            </div>
            <div className="mt-8 pt-4 text-[10px] text-glass-textMuted uppercase tracking-widest">
              © 2024 Rakko Industries
            </div>
          </div>
        );
        
      default: return null;
    }
  };

  const navItemClass = (id: TabId) => `
    w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all rounded-md mb-1
    ${activeTab === id 
      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
      : 'text-glass-textMuted hover:bg-glass-border/10 hover:text-glass-text'}
  `;

  return (
    <div className="h-full flex bg-glass-panel text-glass-text font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-glass-bg/20 border-r border-glass-border flex flex-col p-4 shrink-0">
        <div className="mb-8 px-2 mt-2">
           <div className="text-xl font-serif text-glass-text tracking-wide">Settings</div>
           <div className="text-[10px] text-glass-textMuted uppercase tracking-widest mt-1">Control Panel</div>
        </div>
        <nav className="space-y-1">
          <button onClick={() => setActiveTab('display')} className={navItemClass('display')}>
            <Monitor size={18} /> Display
          </button>
          <button onClick={() => setActiveTab('personalization')} className={navItemClass('personalization')}>
            <Layers size={18} /> Personalization
          </button>
          <button onClick={() => setActiveTab('accounts')} className={navItemClass('accounts')}>
            <User size={18} /> Accounts
          </button>
          <button onClick={() => setActiveTab('system')} className={navItemClass('system')}>
            <Shield size={18} /> System
          </button>
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-glass-bg/5 to-transparent">
        <div className="h-16 border-b border-glass-border flex items-center px-8 shrink-0">
           <h2 className="text-xl font-bold capitalize text-glass-text">{activeTab}</h2>
        </div>
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};