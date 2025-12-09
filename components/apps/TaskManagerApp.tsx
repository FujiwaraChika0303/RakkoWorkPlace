import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, Cpu, MemoryStick as Memory, Power, 
  RefreshCw, Terminal, LayoutTemplate, AppWindow,
  Zap, ChevronDown, CheckCircle2, PauseCircle,
  MoreVertical, Eye, EyeOff, Maximize2, Layers, AlertCircle
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { processRegistry, ProcessInfo } from '../../services/processRegistry';

export const TaskManagerApp: React.FC = () => {
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cpuHistory, setCpuHistory] = useState<number[]>(new Array(40).fill(0));
  const [memHistory, setMemHistory] = useState<number[]>(new Array(40).fill(0));
  const [viewMode, setViewMode] = useState<'detailed' | 'compact'>('detailed');
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, id: string} | null>(null);

  const fetchProcesses = () => {
      const procs = processRegistry.getProcesses();
      setProcesses(procs);
      
      // Update history graphs
      const totalCpu = procs.reduce((acc, p) => acc + p.metrics.cpu, 0);
      const totalMem = procs.reduce((acc, p) => acc + p.metrics.memory, 0);

      setCpuHistory(prev => [...prev.slice(1), Math.min(100, totalCpu)]);
      setMemHistory(prev => [...prev.slice(1), Math.min(100, (totalMem / 2048) * 100)]);
  };

  // Subscribe to registry updates
  useEffect(() => {
    fetchProcesses();
    const interval = setInterval(fetchProcesses, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleEndTask = (id?: string) => {
    const targetId = id || selectedId;
    if (targetId) {
      processRegistry.sendCommand(targetId, 'stop');
    }
  };

  const handleRestartTask = () => {
    if (selectedId) {
      processRegistry.sendCommand(selectedId, 'restart');
    }
  };

  const handleEndAllApps = () => {
      if (confirm("WARNING: This will close all running applications. Unsaved work will be lost. Continue?")) {
          const appProcs = processes.filter(p => p.type === 'app');
          appProcs.forEach(p => processRegistry.sendCommand(p.id, 'stop'));
      }
  };

  const handleFocus = (id: string) => {
      processRegistry.sendCommand(id, 'focus');
  };

  const handleMinimize = (id: string) => {
      processRegistry.sendCommand(id, 'minimize');
  };

  // Groups
  const appProcesses = processes.filter(p => p.type === 'app');
  const bgProcesses = processes.filter(p => p.type === 'service' || p.type === 'kernel');
  const winProcesses = processes.filter(p => p.type === 'ui');

  const selectedProcess = processes.find(p => p.id === selectedId);

  return (
    <div className="flex flex-col h-full bg-[#1c1c1c] text-gray-200 font-sans select-none" onClick={() => setContextMenu(null)}>
      {/* Header Stats with Live Graphs */}
      <div className="h-32 bg-[#151515] border-b border-white/5 flex items-stretch p-4 gap-4 shrink-0 overflow-x-auto">
        <GraphCard 
            label="CPU Usage" 
            value={`${Math.min(100, cpuHistory[cpuHistory.length-1]).toFixed(0)}%`} 
            data={cpuHistory}
            color="text-blue-400" 
            barColor="bg-blue-500"
            icon={<Cpu size={20}/>} 
        />
        <GraphCard 
            label="Memory Usage" 
            value={`${Math.round(processes.reduce((acc,p) => acc + p.metrics.memory, 0))} MB`} 
            data={memHistory}
            color="text-purple-400" 
            barColor="bg-purple-500"
            icon={<Memory size={20}/>} 
        />
        <div className="flex-1 bg-black/20 rounded-lg border border-white/5 p-4 flex flex-col justify-between">
            <div className="flex justify-between">
                <div>
                    <div className="text-xs text-gray-500 uppercase font-bold mb-1">Processes</div>
                    <div className="text-2xl font-mono font-medium text-emerald-400">{processes.length}</div>
                </div>
                <Activity size={20} className="text-emerald-400 opacity-80" />
            </div>
            <div className="text-xs text-gray-500 space-y-1 mt-2">
                <div className="flex justify-between"><span>Apps</span> <span>{appProcesses.length}</span></div>
                <div className="flex justify-between"><span>Background</span> <span>{bgProcesses.length}</span></div>
            </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="h-10 border-b border-white/5 bg-[#1a1a1a] flex items-center px-3 gap-2 shrink-0">
        <button 
          onClick={() => handleEndTask()}
          disabled={!selectedProcess || selectedProcess.type === 'kernel'}
          className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 disabled:opacity-30 disabled:hover:bg-transparent transition-colors border border-transparent hover:border-red-500/30"
        >
          <Power size={14} /> End Task
        </button>
        
        <div className="w-px h-4 bg-white/10 mx-1" />
        
        <button 
          onClick={fetchProcesses}
          className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium hover:bg-white/10 transition-colors"
          title="Force Refresh"
        >
          <RefreshCw size={14} className="text-blue-400" /> Refresh
        </button>

        <button 
          onClick={handleEndAllApps}
          className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium hover:bg-white/10 transition-colors ml-auto"
          title="Kill All Apps"
        >
          <AlertCircle size={14} className="text-orange-400" /> End All Apps
        </button>
      </div>

      {/* Process List */}
      <div className="flex-1 overflow-auto custom-scrollbar bg-[#1c1c1c]">
        <div className="min-w-[600px]">
             {/* Header */}
             <div className="grid grid-cols-[3fr_1fr_1fr_1fr_1fr] px-4 py-2 bg-[#151515] sticky top-0 z-20 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">
                <div>Name</div>
                <div>Status</div>
                <div className="text-right">CPU</div>
                <div className="text-right">Memory</div>
                <div className="text-right">Uptime</div>
             </div>

             {/* Groups */}
             <ProcessGroup 
                title="Apps" 
                processes={appProcesses} 
                selectedId={selectedId} 
                onSelect={setSelectedId} 
                onContextMenu={(e, id) => setContextMenu({ x: e.clientX, y: e.clientY, id })}
             />
             
             <ProcessGroup 
                title="Background Processes" 
                processes={bgProcesses} 
                selectedId={selectedId} 
                onSelect={setSelectedId} 
             />
             
             <ProcessGroup 
                title="Windows Processes" 
                processes={winProcesses} 
                selectedId={selectedId} 
                onSelect={setSelectedId} 
             />
        </div>
      </div>

      {/* Context Menu Portal */}
      {contextMenu && createPortal(
          <div 
            className="fixed z-[9999] w-48 bg-[#252525] border border-white/10 rounded-lg shadow-xl py-1 text-sm text-gray-200"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
             <button onClick={() => { handleFocus(contextMenu.id); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-indigo-600 flex items-center gap-2">
                 <Layers size={14}/> Bring to Front
             </button>
             <button onClick={() => { handleMinimize(contextMenu.id); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-indigo-600 flex items-center gap-2">
                 <EyeOff size={14}/> Minimize / Restore
             </button>
             <div className="h-px bg-white/10 my-1"/>
             <button onClick={() => { processRegistry.sendCommand(contextMenu.id, 'restart'); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-indigo-600 flex items-center gap-2 text-amber-400 hover:text-white">
                 <RefreshCw size={14}/> Restart
             </button>
             <button onClick={() => { handleEndTask(contextMenu.id); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-red-600 flex items-center gap-2 text-red-400 hover:text-white">
                 <Power size={14}/> End Task
             </button>
          </div>,
          document.body
      )}
      {contextMenu && <div className="fixed inset-0 z-[9998]" onClick={() => setContextMenu(null)} onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }} />}
    </div>
  );
};

const ProcessGroup: React.FC<{
    title: string;
    processes: ProcessInfo[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onContextMenu?: (e: React.MouseEvent, id: string) => void;
}> = ({ title, processes, selectedId, onSelect, onContextMenu }) => {
    if (processes.length === 0) return null;

    return (
        <div className="mb-2">
            <div className="px-4 py-1.5 bg-[#252525] text-xs font-bold text-gray-400 flex items-center gap-2 sticky top-[33px] z-10 border-y border-white/5">
                <ChevronDown size={12}/>
                {title} <span className="text-gray-600 font-mono">({processes.length})</span>
            </div>
            <div>
                {processes.map(proc => (
                    <div 
                        key={proc.id}
                        onClick={() => onSelect(proc.id)}
                        onContextMenu={(e) => { e.preventDefault(); if(onContextMenu && proc.type === 'app') onContextMenu(e, proc.id); }}
                        className={`grid grid-cols-[3fr_1fr_1fr_1fr_1fr] px-4 py-2 text-sm cursor-pointer border-b border-transparent hover:bg-white/5 items-center ${selectedId === proc.id ? 'bg-indigo-600/30 hover:bg-indigo-600/40' : ''}`}
                    >
                        {/* Name */}
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-1.5 rounded bg-white/5 text-gray-300">
                                <ProcessIcon type={proc.type} />
                            </div>
                            <div className="truncate font-medium text-gray-200">{proc.name}</div>
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-1.5 text-xs">
                             {proc.metadata?.isMinimized ? (
                                 <><PauseCircle size={12} className="text-amber-400"/> <span className="text-amber-400">Suspended</span></>
                             ) : (
                                 <><CheckCircle2 size={12} className="text-emerald-400"/> <span className="text-emerald-400">Running</span></>
                             )}
                        </div>

                        {/* Metrics */}
                        <div className="text-right font-mono text-gray-400">{proc.metrics.cpu}%</div>
                        <div className="text-right font-mono text-gray-400">{proc.metrics.memory} MB</div>
                        <div className="text-right font-mono text-gray-500 text-xs">{formatUptime(proc.metrics.uptime)}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const GraphCard = ({ label, value, data, color, barColor, icon }: any) => {
    return (
        <div className="flex-1 bg-black/20 rounded-lg border border-white/5 p-4 flex flex-col justify-between relative overflow-hidden min-w-[200px]">
            <div className="flex justify-between items-start z-10 mb-2">
                <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase font-bold mb-1">{label}</span>
                    <span className={`text-xl font-mono font-medium ${color}`}>{value}</span>
                </div>
                <div className={`${color} opacity-80`}>{icon}</div>
            </div>
            <div className="flex items-end h-12 gap-1 opacity-50">
                {data.map((val: number, i: number) => (
                    <div 
                        key={i} 
                        className={`flex-1 rounded-t-sm transition-all duration-300 ${barColor}`} 
                        style={{ height: `${val}%` }} 
                    />
                ))}
            </div>
        </div>
    );
};

const ProcessIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'kernel': return <Terminal size={14} className="text-red-400"/>;
      case 'ui': return <LayoutTemplate size={14} className="text-blue-400"/>;
      case 'service': return <Zap size={14} className="text-yellow-400"/>;
      default: return <AppWindow size={14} className="text-indigo-400"/>;
    }
};

const formatUptime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
};