import { AppId } from '../types';

export type ProcessType = 'app' | 'service' | 'ui' | 'kernel';
export type ProcessStatus = 'running' | 'suspended' | 'restarting' | 'stopped';

export interface ProcessMetrics {
  cpu: number;    // Percentage
  memory: number; // MB
  uptime: number; // Seconds
  domNodes: number;
}

export interface ProcessInfo {
  id: string;
  name: string;
  type: ProcessType;
  status: ProcessStatus;
  metrics: ProcessMetrics;
  metadata?: any;
}

// Added 'focus' and 'minimize' for advanced Task Manager features
export type ProcessCommand = 'stop' | 'restart' | 'focus' | 'minimize';

type ProcessListener = (processes: ProcessInfo[]) => void;
type CommandListener = (id: string, command: ProcessCommand) => void;

class ProcessRegistry {
  private processes: Map<string, ProcessInfo> = new Map();
  private listeners: Set<ProcessListener> = new Set();
  private commandListeners: Set<CommandListener> = new Set();

  // --- Registration ---

  register(info: Omit<ProcessInfo, 'status' | 'metrics'>) {
    this.processes.set(info.id, {
      ...info,
      status: 'running',
      metrics: { cpu: 0, memory: 0, uptime: 0, domNodes: 0 }
    });
    this.notifyListeners();
  }

  unregister(id: string) {
    if (this.processes.has(id)) {
      this.processes.delete(id);
      this.notifyListeners();
    }
  }

  // --- Updates ---

  updateMetrics(id: string, metrics: Partial<ProcessMetrics>) {
    const proc = this.processes.get(id);
    if (proc) {
      proc.metrics = { ...proc.metrics, ...metrics };
      // Optimization: In a real high-frequency app, we wouldn't notify on every metric tick
      // But for this simulation, it drives the UI graphs.
    }
  }

  updateStatus(id: string, status: ProcessStatus) {
    const proc = this.processes.get(id);
    if (proc) {
      proc.status = status;
      this.notifyListeners();
    }
  }

  // --- Query ---

  getProcesses(): ProcessInfo[] {
    return Array.from(this.processes.values());
  }

  getProcess(id: string): ProcessInfo | undefined {
    return this.processes.get(id);
  }

  // --- Subscriptions ---

  subscribe(listener: ProcessListener): () => void {
    this.listeners.add(listener);
    listener(this.getProcesses()); // Initial emit
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    const list = this.getProcesses();
    this.listeners.forEach(l => l(list));
  }

  // --- Commands (Control Plane) ---

  onCommand(listener: CommandListener): () => void {
    this.commandListeners.add(listener);
    return () => this.commandListeners.delete(listener);
  }

  sendCommand(id: string, command: ProcessCommand) {
    console.log(`[ProcessRegistry] Sending command '${command}' to ${id}`);
    this.commandListeners.forEach(l => l(id, command));
  }
}

export const processRegistry = new ProcessRegistry();