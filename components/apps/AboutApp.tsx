import React from 'react';
import { Github, Code, Heart, Terminal } from 'lucide-react';

export const AboutApp: React.FC = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-gray-900 to-black">
      <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-indigo-900 to-black flex items-center justify-center mb-6 shadow-2xl border border-white/10 animate-pulse">
        <Terminal size={40} className="text-white/80" />
      </div>
      <h2 className="text-3xl font-serif text-white mb-2 tracking-wide">RAKKO WORKPLACE</h2>
      <p className="text-gray-400 text-sm mb-8 max-w-xs leading-relaxed font-sans">
        The next generation web-based operating environment.
        <br/>
        Designed for efficiency.
      </p>
      
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
          <div className="text-indigo-400 text-xs uppercase tracking-widest mb-1 font-bold">Version</div>
          <div className="text-white font-mono">3.0.0</div>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
          <div className="text-emerald-400 text-xs uppercase tracking-widest mb-1 font-bold">System</div>
          <div className="text-white font-mono flex items-center justify-center gap-2">
            Online <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-8 flex items-center gap-2 text-xs text-gray-600">
         <span>Crafted with</span>
         <Heart size={10} className="text-red-900 fill-red-900" />
         <span>by Rakko Industries</span>
      </div>
    </div>
  );
};