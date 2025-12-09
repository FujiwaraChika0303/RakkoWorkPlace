import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, ArrowRight, RotateCw, X, Plus, 
  Lock, Globe, Star, Search, MoreVertical, 
  ExternalLink, Settings, AlertCircle, Layout,
  Shield, Trash2, Home
} from 'lucide-react';
import { createPortal } from 'react-dom';

interface BrowserProps {
  initialUrl?: string;
  onOpenNewWindow: (url?: string) => void;
}

interface Tab {
  id: string;
  title: string;
  url: string;
  inputUrl: string;
  history: string[];
  historyIndex: number;
  isLoading: boolean;
}

interface Bookmark {
  title: string;
  url: string;
}

const DEFAULT_SEARCH_ENGINE = 'https://www.bing.com/search?q=';
const DEFAULT_HOME = 'https://www.bing.com';

export const BrowserApp: React.FC<BrowserProps> = ({ initialUrl, onOpenNewWindow }) => {
  const [tabs, setTabs] = useState<Tab[]>([
    { 
      id: 'tab-1', 
      title: 'New Tab', 
      url: initialUrl || DEFAULT_HOME, 
      inputUrl: initialUrl || DEFAULT_HOME, 
      history: [initialUrl || DEFAULT_HOME], 
      historyIndex: 0, 
      isLoading: true 
    }
  ]);
  const [activeTabId, setActiveTabId] = useState('tab-1');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([
    { title: 'Rakko', url: 'https://rakko.cn' },
    { title: 'Wikipedia', url: 'https://www.wikipedia.org' },
    { title: 'Bing', url: 'https://www.bing.com' },
    { title: 'Example', url: 'https://example.com' }
  ]);
  
  // UI State
  const [showMenu, setShowMenu] = useState(false);
  const [showBookmarksBar, setShowBookmarksBar] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, tabId: string} | null>(null);
  
  // Settings State
  const [homePage, setHomePage] = useState(DEFAULT_HOME);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // --- Actions ---

  const updateTab = (id: string, updates: Partial<Tab>) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const handleNavigate = (url: string, tabId: string = activeTabId) => {
    let finalUrl = url;
    
    // Smart URL parsing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
       if (url.includes('.') && !url.includes(' ')) {
           finalUrl = `https://${url}`;
       } else {
           finalUrl = `${DEFAULT_SEARCH_ENGINE}${encodeURIComponent(url)}`;
       }
    }

    setTabs(prev => prev.map(t => {
      if (t.id === tabId) {
        const newHistory = t.history.slice(0, t.historyIndex + 1);
        newHistory.push(finalUrl);
        return {
          ...t,
          url: finalUrl,
          inputUrl: finalUrl,
          history: newHistory,
          historyIndex: newHistory.length - 1,
          isLoading: true,
          title: finalUrl // Temporary title
        };
      }
      return t;
    }));
  };

  const handleReload = () => {
    if (iframeRef.current) {
        // Force iframe reload hack
        const currentSrc = iframeRef.current.src;
        iframeRef.current.src = ''; 
        setTimeout(() => {
            if (iframeRef.current) iframeRef.current.src = currentSrc;
        }, 10);
        updateTab(activeTabId, { isLoading: true });
    }
  };

  const handleStop = () => {
      updateTab(activeTabId, { isLoading: false });
  };

  const handleBack = () => {
    if (activeTab.historyIndex > 0) {
       const newIndex = activeTab.historyIndex - 1;
       const newUrl = activeTab.history[newIndex];
       updateTab(activeTabId, {
           historyIndex: newIndex,
           url: newUrl,
           inputUrl: newUrl,
           isLoading: true
       });
    }
  };

  const handleForward = () => {
    if (activeTab.historyIndex < activeTab.history.length - 1) {
       const newIndex = activeTab.historyIndex + 1;
       const newUrl = activeTab.history[newIndex];
       updateTab(activeTabId, {
           historyIndex: newIndex,
           url: newUrl,
           inputUrl: newUrl,
           isLoading: true
       });
    }
  };

  const addTab = () => {
    const newId = `tab-${Date.now()}`;
    const newTab: Tab = {
      id: newId,
      title: 'New Tab',
      url: homePage,
      inputUrl: homePage,
      history: [homePage],
      historyIndex: 0,
      isLoading: true
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
  };

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (tabs.length === 1) {
        updateTab(id, { url: homePage, inputUrl: homePage, title: 'New Tab', isLoading: true });
        return;
    }
    
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  };

  const handleIframeLoad = () => {
    updateTab(activeTabId, { 
        isLoading: false,
        title: 'External Page' 
    });
  };

  const tearOutTab = () => {
      if (!contextMenu) return;
      const tabToMove = tabs.find(t => t.id === contextMenu.tabId);
      if (tabToMove) {
          onOpenNewWindow(tabToMove.url);
          if (tabs.length > 1) {
              const newTabs = tabs.filter(t => t.id !== contextMenu.tabId);
              setTabs(newTabs);
              if (activeTabId === contextMenu.tabId) {
                  setActiveTabId(newTabs[newTabs.length - 1].id);
              }
          }
      }
      setContextMenu(null);
  };

  const toggleBookmark = () => {
      const exists = bookmarks.find(b => b.url === activeTab.url);
      if (exists) {
          setBookmarks(prev => prev.filter(b => b.url !== activeTab.url));
      } else {
          setBookmarks(prev => [...prev, { title: activeTab.title, url: activeTab.url }]);
      }
  };

  return (
    <div className="flex flex-col h-full bg-[#1c1c1c] text-gray-200 font-sans" onClick={() => { setShowMenu(false); setContextMenu(null); }}>
      
      {/* 1. Tab Bar (Integrated into Title Bar) */}
      <div 
        className="h-10 bg-[#151515] flex items-end px-2 pt-2 gap-1 overflow-x-auto no-scrollbar shrink-0 select-none relative"
        // This area is the "drag handle" for the window, so we don't mark it no-drag.
        // But individual tabs must be no-drag to be clickable.
      >
        <div className="flex-1 flex items-end gap-1 overflow-hidden pr-[100px]"> {/* Padding for Window Controls */}
            {tabs.map(tab => (
                <div 
                    key={tab.id}
                    onClick={() => setActiveTabId(tab.id)}
                    onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, tabId: tab.id }); }}
                    className={`
                        group relative flex items-center gap-2 px-3 py-1.5 min-w-[140px] max-w-[200px] text-xs rounded-t-lg cursor-default transition-all select-none no-drag
                        ${activeTabId === tab.id 
                            ? 'bg-[#2a2a2a] text-white shadow-[0_-2px_10px_rgba(0,0,0,0.2)] z-10' 
                            : 'bg-transparent text-gray-500 hover:bg-[#2a2a2a]/50 hover:text-gray-300'}
                    `}
                    title={tab.title}
                >
                    {tab.isLoading ? <RotateCw size={10} className="animate-spin text-blue-400"/> : <Globe size={10} />}
                    <span className="truncate flex-1">{tab.title}</span>
                    <button 
                        onClick={(e) => closeTab(e, tab.id)}
                        className={`p-0.5 rounded-full hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity no-drag`}
                    >
                        <X size={10} />
                    </button>
                    {/* Divider for inactive tabs */}
                    {activeTabId !== tab.id && (
                        <div className="absolute right-0 top-1.5 bottom-1.5 w-px bg-white/10 opacity-50 group-hover:opacity-0 transition-opacity" />
                    )}
                </div>
            ))}
            <button onClick={addTab} className="p-1.5 mb-1.5 rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-colors no-drag">
                <Plus size={16} />
            </button>
        </div>
      </div>

      {/* 2. Navigation Bar */}
      <div className="h-11 bg-[#2a2a2a] flex items-center px-2 gap-2 border-b border-black/20 shrink-0 z-20 shadow-sm no-drag">
         <div className="flex items-center">
             <button onClick={handleBack} disabled={activeTab.historyIndex === 0} className="p-2 rounded-full hover:bg-white/10 disabled:opacity-30 transition-colors"><ArrowLeft size={14}/></button>
             <button onClick={handleForward} disabled={activeTab.historyIndex === activeTab.history.length - 1} className="p-2 rounded-full hover:bg-white/10 disabled:opacity-30 transition-colors"><ArrowRight size={14}/></button>
             <button onClick={activeTab.isLoading ? handleStop : handleReload} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                {activeTab.isLoading ? <X size={14} className="text-red-400"/> : <RotateCw size={14}/>}
             </button>
             <button onClick={() => handleNavigate(homePage)} className="p-2 rounded-full hover:bg-white/10 transition-colors"><Home size={14}/></button>
         </div>

         {/* Address Bar */}
         <div className="flex-1 flex items-center bg-[#1c1c1c] rounded-full border border-transparent focus-within:border-indigo-500/50 focus-within:bg-black focus-within:shadow-md px-3 py-1.5 transition-all group my-1">
             {activeTab.url.startsWith('https') ? <Lock size={12} className="text-emerald-500 mr-2"/> : <AlertCircle size={12} className="text-gray-500 mr-2"/>}
             <input 
                className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-gray-600 font-normal no-drag"
                value={activeTab.inputUrl}
                onChange={(e) => updateTab(activeTabId, { inputUrl: e.target.value })}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNavigate(activeTab.inputUrl);
                }}
                onFocus={(e) => e.target.select()}
                placeholder="Search or enter web address"
             />
             <button onClick={toggleBookmark} className={`p-1 rounded-full hover:bg-white/10 ${bookmarks.find(b => b.url === activeTab.url) ? 'text-amber-400' : 'text-gray-600'} no-drag`}>
                 <Star size={14} fill={bookmarks.find(b => b.url === activeTab.url) ? "currentColor" : "none"} />
             </button>
         </div>

         {/* Menu */}
         <div className="relative">
            <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} className={`p-1.5 rounded-full transition-colors ${showMenu ? 'bg-indigo-600/20 text-indigo-400' : 'hover:bg-white/10 text-gray-400'} no-drag`}><MoreVertical size={16}/></button>
            {showMenu && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-[#2a2a2a] border border-white/10 rounded-xl shadow-2xl py-2 z-50 text-sm animate-fade-in origin-top-right no-drag" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => { onOpenNewWindow(); setShowMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-indigo-600 flex items-center gap-3">
                        <Layout size={16} /> New Window
                    </button>
                    <button onClick={() => { setShowBookmarksBar(!showBookmarksBar); setShowMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-indigo-600 flex items-center gap-3">
                        <Star size={16} /> {showBookmarksBar ? 'Hide' : 'Show'} Bookmarks
                    </button>
                    <div className="h-px bg-white/5 my-1" />
                    <button onClick={() => { setShowSettingsModal(true); setShowMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-indigo-600 flex items-center gap-3">
                        <Settings size={16} /> Settings
                    </button>
                </div>
            )}
         </div>
      </div>

      {/* 3. Bookmarks Bar */}
      {showBookmarksBar && (
          <div className="h-8 bg-[#2a2a2a] flex items-center px-4 gap-2 border-b border-black/20 shrink-0 no-drag">
              {bookmarks.map((bm, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => handleNavigate(bm.url)}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        const newBm = bookmarks.filter(b => b.url !== bm.url);
                        setBookmarks(newBm);
                    }}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-white/10 text-xs text-gray-400 hover:text-white transition-colors max-w-[150px]"
                    title={bm.url}
                  >
                      <Globe size={10} className="text-gray-500" />
                      <span className="truncate">{bm.title}</span>
                  </button>
              ))}
          </div>
      )}

      {/* 4. Content */}
      <div className="flex-1 relative bg-white no-drag">
          {activeTab.isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1c1c1c] z-10">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                  <span className="text-gray-400 text-sm">Loading content...</span>
                  <button onClick={handleStop} className="mt-4 px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs text-gray-400 transition-colors">
                      Cancel
                  </button>
              </div>
          )}
          <iframe 
            ref={iframeRef}
            src={activeTab.url}
            className="w-full h-full border-none"
            onLoad={handleIframeLoad}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
            title="Browser Content"
          />
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center animate-fade-in no-drag" onClick={() => setShowSettingsModal(false)}>
              <div className="bg-[#1a1a1a] border border-white/10 rounded-xl w-96 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                  <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                      <h3 className="font-bold text-white flex items-center gap-2"><Settings size={16}/> Browser Settings</h3>
                      <button onClick={() => setShowSettingsModal(false)} className="p-1 hover:bg-white/10 rounded-full"><X size={16}/></button>
                  </div>
                  <div className="p-6 space-y-6">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Home Page</label>
                          <input 
                            value={homePage}
                            onChange={(e) => setHomePage(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                          />
                      </div>
                      <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Privacy & Security</label>
                           <button 
                             onClick={() => alert("History and Cache cleared.")}
                             className="w-full flex items-center gap-3 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors text-sm"
                           >
                               <Trash2 size={16}/> Clear Browsing Data
                           </button>
                      </div>
                      <div className="pt-4 border-t border-white/10 text-center text-xs text-gray-600">
                          Rakko Browser v1.1.0
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Tab Context Menu */}
      {contextMenu && createPortal(
          <>
            <div className="fixed inset-0 z-[9998]" onClick={() => setContextMenu(null)} onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }} />
            <div 
                className="fixed z-[9999] w-52 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl py-1 text-sm text-gray-200 no-drag"
                style={{ top: contextMenu.y, left: contextMenu.x }}
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={() => { handleReload(); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-indigo-600 flex items-center gap-2">
                    <RotateCw size={14} className="opacity-70"/> Reload
                </button>
                <div className="h-px bg-white/10 my-1" />
                <button onClick={tearOutTab} className="w-full text-left px-4 py-2 hover:bg-indigo-600 flex items-center gap-2">
                    <ExternalLink size={14} className="opacity-70"/> Move to New Window
                </button>
                <button onClick={(e) => { closeTab(e as any, contextMenu.tabId); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-red-600 text-red-400 hover:text-white flex items-center gap-2">
                    <X size={14} className="opacity-70"/> Close Tab
                </button>
            </div>
          </>,
          document.body
      )}

    </div>
  );
};