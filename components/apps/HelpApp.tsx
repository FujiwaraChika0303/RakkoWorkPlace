import React, { useState } from 'react';
import { 
  Menu, Maximize2, Search, Layout, Folder, Upload, 
  FileText, Palette, Clock, Info, ChevronRight, HelpCircle
} from 'lucide-react';

interface HelpTopic {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export const HelpApp: React.FC = () => {
  const [activeTopicId, setActiveTopicId] = useState('start');

  const topics: HelpTopic[] = [
    {
      id: 'start',
      title: 'Start Menu & Navigation',
      icon: <Menu size={20} />,
      content: (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Start Menu & Navigation</h2>
            <p>The <strong>Start Menu</strong> is your gateway to apps and system functions.</p>
            <ul className="list-disc pl-5 space-y-2 text-gray-300">
                <li>Click the <strong>Hexagon Icon</strong> in the bottom-left corner to open the menu.</li>
                <li>Browse the list of installed applications.</li>
                <li>Access your user profile information at the top.</li>
                <li>Use the <strong>Shut Down</strong> button at the bottom to reload the system.</li>
            </ul>
        </div>
      )
    },
    {
        id: 'window',
        title: 'Window Management',
        icon: <Maximize2 size={20} />,
        content: (
            <div className="space-y-4">
                <h2 className="text-2xl font-bold mb-4">Window Management</h2>
                <p>Rakko Workplace offers a fluid window experience similar to desktop OS.</p>
                <div className="grid gap-4">
                    <div className="bg-white/5 p-4 rounded-lg">
                        <h3 className="font-bold text-indigo-400 mb-2">Moving</h3>
                        <p className="text-sm">Click and drag the <strong>Title Bar</strong> at the top of any window to move it around your workspace.</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg">
                        <h3 className="font-bold text-indigo-400 mb-2">Resizing</h3>
                        <p className="text-sm">Hover over any edge or corner of a window until the cursor changes, then drag to resize.</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg">
                        <h3 className="font-bold text-indigo-400 mb-2">Controls</h3>
                        <p className="text-sm">Use the top-right buttons to <strong>Minimize</strong>, <strong>Maximize/Restore</strong>, or <strong>Close</strong> the window.</p>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'taskbar',
        title: 'Taskbar & Search',
        icon: <Search size={20} />,
        content: (
            <div className="space-y-4">
                <h2 className="text-2xl font-bold mb-4">Taskbar & Search</h2>
                <p>The taskbar at the bottom keeps your running apps organized.</p>
                <ul className="list-disc pl-5 space-y-2 text-gray-300">
                    <li><strong>Active Apps:</strong> Currently open windows are highlighted with an accent bar.</li>
                    <li><strong>Global Search:</strong> Use the search bar (or icon on mobile) to instantly find and launch apps.</li>
                    <li><strong>Minimize/Restore:</strong> Click an app icon to minimize it or bring it to the front.</li>
                    <li><strong>Context Menu:</strong> Right-click an app icon to see more options like "Close Window".</li>
                </ul>
            </div>
        )
    },
    {
        id: 'desktops',
        title: 'Virtual Desktops',
        icon: <Layout size={20} />,
        content: (
            <div className="space-y-4">
                <h2 className="text-2xl font-bold mb-4">Virtual Desktops</h2>
                <p>Organize your workflow by using multiple desktops via <strong>Task View</strong>.</p>
                <ol className="list-decimal pl-5 space-y-3 text-gray-300">
                    <li>Click the <strong>Task View icon</strong> (next to Search) on the taskbar.</li>
                    <li>You will see previews of Desktop 1 and Desktop 2 at the top.</li>
                    <li><strong>Switch Desktops:</strong> Click on a desktop card to switch to that workspace.</li>
                    <li><strong>Move Windows:</strong> Drag a window thumbnail from the grid and drop it onto a desktop card to move it there.</li>
                </ol>
            </div>
        )
    },
    {
        id: 'files',
        title: 'File Manager',
        icon: <Folder size={20} />,
        content: (
            <div className="space-y-4">
                <h2 className="text-2xl font-bold mb-4">File Manager</h2>
                <p>Manage your documents and system files with the Explorer.</p>
                <ul className="list-disc pl-5 space-y-2 text-gray-300">
                    <li><strong>Navigation:</strong> Use the sidebar or address bar to navigate folders.</li>
                    <li><strong>Context Menu:</strong> Right-click on files or empty space to Copy, Paste, Rename, or Delete.</li>
                    <li><strong>Views:</strong> Toggle between <strong>Grid</strong> and <strong>List</strong> views using the toolbar buttons.</li>
                    <li><strong>System vs Local:</strong> Files in <code>/System</code> are read-only. Use <code>/C</code> (Local Drive) for your own files.</li>
                </ul>
            </div>
        )
    },
    {
        id: 'upload',
        title: 'Drag & Drop Upload',
        icon: <Upload size={20} />,
        content: (
            <div className="space-y-4">
                <h2 className="text-2xl font-bold mb-4">Drag & Drop Upload</h2>
                <p>Easily import files from your real computer into Rakko Workplace.</p>
                <div className="p-4 border border-dashed border-indigo-500/50 rounded-xl bg-indigo-500/10 text-center">
                    <p className="mb-2"><strong>Try it now:</strong></p>
                    <p className="text-sm">Open the <strong>File Manager</strong> to the C: drive.</p>
                    <p className="text-sm">Drag a file (image or text) from your actual desktop and drop it into the File Manager window.</p>
                </div>
                <p className="text-sm text-gray-400 mt-2">Note: This feature only works in writable directories like the C Drive.</p>
            </div>
        )
    },
    {
        id: 'editor',
        title: 'Text Editor',
        icon: <FileText size={20} />,
        content: (
            <div className="space-y-4">
                <h2 className="text-2xl font-bold mb-4">Text Editor</h2>
                <p>A simple yet capable editor for your code and notes.</p>
                <ul className="list-disc pl-5 space-y-2 text-gray-300">
                    <li><strong>Create:</strong> Right-click in File Manager and select "New File".</li>
                    <li><strong>Edit:</strong> Double-click any text file to open it in the editor.</li>
                    <li><strong>Save:</strong> Press the Save button in the toolbar. Unsaved changes are marked with an asterisk (*).</li>
                    <li><strong>Persistence:</strong> Saved files are stored in your browser's local storage.</li>
                </ul>
            </div>
        )
    },
    {
        id: 'personalization',
        title: 'Personalization',
        icon: <Palette size={20} />,
        content: (
            <div className="space-y-4">
                <h2 className="text-2xl font-bold mb-4">Personalization</h2>
                <p>Make Rakko Workplace your own.</p>
                <ul className="list-disc pl-5 space-y-2 text-gray-300">
                    <li>Open <strong>Control Panel</strong>.</li>
                    <li><strong>Display:</strong> Choose from available high-quality wallpapers.</li>
                    <li><strong>Theme:</strong> Toggle between <strong>Light Mode</strong> and <strong>Dark Mode</strong>.</li>
                    <li><strong>Accent Color:</strong> Select a color scheme that applies to windows and selection highlights.</li>
                </ul>
            </div>
        )
    },
    {
        id: 'clock',
        title: 'World Clock',
        icon: <Clock size={20} />,
        content: (
            <div className="space-y-4">
                <h2 className="text-2xl font-bold mb-4">World Clock</h2>
                <p>Stay synced with global time zones.</p>
                <p>Click the <strong>Time/Date</strong> display in the bottom-right corner of the taskbar.</p>
                <p>A popup will appear showing:</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-300">
                    <li>Exact local time with seconds.</li>
                    <li>Current times in New York, London, Tokyo, and UTC.</li>
                </ul>
            </div>
        )
    },
    {
        id: 'about',
        title: 'System Info',
        icon: <Info size={20} />,
        content: (
            <div className="space-y-4">
                <h2 className="text-2xl font-bold mb-4">System Information</h2>
                <p>Learn more about the environment.</p>
                <ul className="list-disc pl-5 space-y-2 text-gray-300">
                    <li>Open the <strong>About Rakko</strong> app to see the web page version of the project.</li>
                    <li>Check <strong>Control Panel &gt; System</strong> for version details and kernel information.</li>
                    <li>The system runs on RakkoCore (React + TypeScript).</li>
                </ul>
            </div>
        )
    },
  ];

  const activeTopic = topics.find(t => t.id === activeTopicId) || topics[0];

  return (
    <div className="h-full flex bg-glass-panel text-gray-200 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-black/20 border-r border-white/10 flex flex-col shrink-0">
         <div className="p-4 border-b border-white/10 bg-white/5 flex items-center gap-2">
            <HelpCircle className="text-indigo-400" />
            <h1 className="font-bold text-lg">Help Center</h1>
         </div>
         <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {topics.map(topic => (
                <button
                    key={topic.id}
                    onClick={() => setActiveTopicId(topic.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left ${
                        activeTopicId === topic.id 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'hover:bg-white/10 text-gray-400 hover:text-white'
                    }`}
                >
                    <span className={activeTopicId === topic.id ? 'text-white' : 'text-gray-500'}>
                        {topic.icon}
                    </span>
                    <span className="flex-1 truncate">{topic.title}</span>
                    {activeTopicId === topic.id && <ChevronRight size={14} />}
                </button>
            ))}
         </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-white/5 to-transparent">
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
               <div className="max-w-2xl mx-auto animate-fade-in">
                    {activeTopic.content}
               </div>
          </div>
          <div className="h-12 border-t border-white/10 flex items-center justify-between px-6 text-xs text-gray-500 bg-black/20 shrink-0">
             <span>Rakko Workplace Guide</span>
             <span>Topic {topics.findIndex(t => t.id === activeTopicId) + 1} of {topics.length}</span>
          </div>
      </div>
    </div>
  );
};