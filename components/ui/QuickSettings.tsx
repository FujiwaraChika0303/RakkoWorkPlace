import React, { useState, useEffect } from 'react';
import { 
  Moon, Sun, Maximize, Minimize, 
  Eye, BookOpen, Settings, User
} from 'lucide-react';

interface QuickSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  position: 'top' | 'bottom';
  isDarkMode: boolean;
  toggleTheme: () => void;
  onOpenSettings: () => void;
}

export const QuickSettings: React.FC<QuickSettingsProps> = ({ 
  isOpen, 
  onClose, 
  position,
  isDarkMode,
  toggleTheme,
  onOpenSettings
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [nightLight, setNightLight] = useState(false);
  const [readingMode, setReadingMode] = useState(false);

  // Initial Sync
  useEffect(() => {
    if (isOpen) {
        setIsFullscreen(!!document.fullscreenElement);
        setNightLight(document.body.classList.contains('night-light'));
        setReadingMode(document.body.classList.contains('reading-mode'));
    }
  }, [isOpen]);

  // Effects for Global Toggles
  useEffect(() => {
      if (nightLight) document.body.classList.add('night-light');
      else document.body.classList.remove('night-light');
  }, [nightLight]);

  useEffect(() => {
      if (readingMode) document.body.classList.add('reading-mode');
      else document.body.classList.remove('reading-mode');
  }, [readingMode]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((e) => {
            console.error(`Error attempting to enable fullscreen: ${e.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
    setIsFullscreen(!isFullscreen);
  };

  if (!isOpen) return null;

  const positionClass = position === 'top' 
    ? 'top-14 origin-top-right right-2' 
    : 'bottom-14 origin-bottom-right right-2';

  return (
    <>
      <div className="fixed inset-0 z-[60]" onClick={onClose} />
      <div 
        className={`fixed w-[320px] bg-gray-900/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-4 z-[70] animate-pop text-gray-200 ${positionClass}`}
      >
        <div className="grid grid-cols-2 gap-3 mb-6">
            <QuickToggle 
                icon={isDarkMode ? <Moon size={18} /> : <Sun size={18} />} 
                label={isDarkMode ? "Dark Mode" : "Light Mode"} 
                active={true}
                activeColor="bg-indigo-600"
                onClick={toggleTheme} 
            />

            <QuickToggle 
                icon={isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />} 
                label="Fullscreen" 
                active={isFullscreen} 
                onClick={toggleFullscreen} 
            />
            
            <QuickToggle 
                icon={<Eye size={18} />} 
                label="Night Light" 
                active={nightLight} 
                activeColor="bg-amber-600"
                onClick={() => setNightLight(!nightLight)} 
            />
            
            <QuickToggle 
                icon={<BookOpen size={18} />} 
                label="Read Mode" 
                active={readingMode} 
                activeColor="bg-gray-600"
                onClick={() => setReadingMode(!readingMode)} 
            />
        </div>

        <div className="flex items-center justify-between px-2 pt-2 border-t border-white/10 mt-2">
            <div className="flex items-center gap-2 text-xs text-gray-400">
                <User size={14} />
                <span>Local Account</span>
            </div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={onOpenSettings}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors" 
                    title="Settings"
                >
                    <Settings size={14} />
                </button>
            </div>
        </div>
      </div>
    </>
  );
};

const QuickToggle: React.FC<{ 
    icon: React.ReactNode; 
    label: string; 
    active: boolean; 
    activeColor?: string;
    onClick: () => void 
}> = ({ icon, label, active, activeColor = "bg-blue-600", onClick }) => (
    <button 
        onClick={onClick}
        className={`
            h-14 rounded-xl flex items-center gap-3 px-4 transition-all duration-200 border
            ${active 
                ? `${activeColor} border-transparent text-white shadow-lg` 
                : 'bg-white/5 border-white/5 hover:bg-white/10 text-gray-300'
            }
        `}
    >
        <div className={`shrink-0 ${active ? 'text-white' : 'text-gray-400'}`}>
            {icon}
        </div>
        <span className="text-sm font-medium truncate">{label}</span>
    </button>
);