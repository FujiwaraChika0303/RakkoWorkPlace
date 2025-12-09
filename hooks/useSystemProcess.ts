import { useEffect, useRef } from 'react';
import { processRegistry, ProcessType } from '../services/processRegistry';

interface UseSystemProcessProps {
  id: string;
  name: string;
  type: ProcessType;
  meta?: any;
}

export const useSystemProcess = ({ id, name, type, meta }: UseSystemProcessProps, active: boolean = true) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const renderCount = useRef(0);
  
  // Use a Ref for start time so it doesn't reset on re-renders, only on full unmount/remount
  const startTimeRef = useRef<number>(Date.now());
  const memoryOffsetRef = useRef<number>(Math.random() * 20); // Random starting offset
  const memoryTrendRef = useRef<number>(0.5); // 0.5 means increasing, -0.5 decreasing

  // Track renders
  useEffect(() => {
    renderCount.current++;
  });

  // Registration & Lifecycle
  useEffect(() => {
    if (!active) return;

    // Reset start time if this is a fresh activation
    if (Date.now() - startTimeRef.current > 10000 && type === 'app') {
       // If it's been inactive for > 10s, treat as new launch for apps
       startTimeRef.current = Date.now();
    }

    // 1. Register on Mount
    processRegistry.register({
      id,
      name,
      type,
      metadata: meta
    });

    // 2. Start Metric Polling Loop
    const intervalId = setInterval(() => {
      const now = Date.now();
      const uptime = Math.floor((now - startTimeRef.current) / 1000);
      
      let domNodes = 0;
      if (elementRef.current) {
          domNodes = elementRef.current.getElementsByTagName('*').length;
      }
      
      // --- Improved Realistic Metrics ---
      
      // Memory Jitter: Simulate allocation and garbage collection
      // Change trend occasionally
      if (Math.random() > 0.8) {
          memoryTrendRef.current = Math.random() > 0.5 ? 1 : -1;
      }
      // Apply trend
      memoryOffsetRef.current += (Math.random() * 2 * memoryTrendRef.current);
      // Clamp offset
      if (memoryOffsetRef.current < 0) memoryOffsetRef.current = 0;
      if (memoryOffsetRef.current > 50) memoryOffsetRef.current = 50;

      // Base memory on DOM size (approx 0.1MB per node is high, but good for visuals) + base overhead
      const baseMemory = 15 + (domNodes * 0.02);
      // Add render "leak" simulation
      const activityMemory = renderCount.current * 0.1;
      
      const memory = Math.round(baseMemory + memoryOffsetRef.current + activityMemory);

      // CPU: Heuristic based on render frequency delta + DOM complexity
      // Add some random idle noise (0-2%)
      const idleCpu = Math.random() * 2;
      const activeCpu = (renderCount.current * 2) + (domNodes / 500);
      const cpuLoad = Math.min(100, parseFloat((idleCpu + activeCpu).toFixed(1)));
      
      // Reset render count for next sample
      renderCount.current = 0;

      processRegistry.updateMetrics(id, {
        cpu: cpuLoad,
        memory,
        uptime,
        domNodes
      });
    }, 1000);

    // 3. Cleanup on Unmount
    return () => {
      clearInterval(intervalId);
      processRegistry.unregister(id);
    };
  }, [id, name, type, active]);

  return { elementRef };
};