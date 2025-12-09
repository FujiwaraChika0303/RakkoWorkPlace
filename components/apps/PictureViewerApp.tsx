import React, { useState, useEffect, useRef } from 'react';
import { 
    ZoomIn, ZoomOut, RotateCw, RotateCcw, RefreshCcw, 
    Image as ImageIcon, Upload, Download, Sliders, 
    Sun, Contrast, Droplet, MoveHorizontal, MoveVertical, 
    Eye, EyeOff, Aperture, PaintBucket, FolderOpen,
    Check, X
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { fsService } from '../../services/fileSystemService';
import { FileSystemItem } from '../../types';
import { FileManagerApp } from './FileManagerApp';

interface PictureViewerProps {
  initialImage?: string;
  initialTitle?: string;
}

interface EditorState {
    brightness: number;
    contrast: number;
    saturation: number;
    grayscale: number;
    sepia: number;
    blur: number;
    invert: number;
    scale: number;
    rotation: number;
    flipH: boolean;
    flipV: boolean;
}

const DEFAULT_STATE: EditorState = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    grayscale: 0,
    sepia: 0,
    blur: 0,
    invert: 0,
    scale: 1,
    rotation: 0,
    flipH: false,
    flipV: false
};

export const PictureViewerApp: React.FC<PictureViewerProps> = ({ initialImage, initialTitle }) => {
  const [image, setImage] = useState<string | null>(initialImage || null);
  const [title, setTitle] = useState(initialTitle || 'Untitled');
  const [state, setState] = useState<EditorState>(DEFAULT_STATE);
  const [showFilePicker, setShowFilePicker] = useState(false);
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialImage) {
        setImage(initialImage);
        setTitle(initialTitle || 'Untitled');
        setState(DEFAULT_STATE);
    }
  }, [initialImage, initialTitle]);

  const updateState = (key: keyof EditorState, value: number | boolean) => {
      setState(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => setState(DEFAULT_STATE);

  // --- 10 New Features Implementation ---

  // 1. File Browser/Open
  const handleOpenClick = () => {
      setShowFilePicker(true);
  };

  const selectImage = (img: FileSystemItem) => {
      if (img.url) {
          setImage(img.url);
          setTitle(img.name);
          setState(DEFAULT_STATE);
          setShowFilePicker(false);
      }
  };

  // 2-9. Filters & Transforms (State Updaters)
  const toggleFlipH = () => updateState('flipH', !state.flipH);
  const toggleFlipV = () => updateState('flipV', !state.flipV);
  const toggleGrayscale = () => updateState('grayscale', state.grayscale > 0 ? 0 : 100);
  const toggleSepia = () => updateState('sepia', state.sepia > 0 ? 0 : 100);
  const toggleInvert = () => updateState('invert', state.invert > 0 ? 0 : 100);

  // 10. Save/Export
  const handleSave = async () => {
      if (!imageRef.current) return;
      
      try {
        // We capture the transformed image container
        const canvas = await html2canvas(imageRef.current, {
            backgroundColor: null,
            logging: false,
            useCORS: true,
            scale: 2 // High quality export
        });
        
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `Edited_${title}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (e) {
          console.error("Save failed", e);
          alert("Could not save image. Note: External images might be blocked by CORS.");
      }
  };

  // Render logic
  if (!image) {
      return (
          <div className="h-full flex flex-col items-center justify-center bg-gray-900 text-gray-400 gap-4">
              <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-2 animate-pulse">
                  <ImageIcon size={48} className="opacity-50" />
              </div>
              <h2 className="text-xl font-bold text-gray-200">Picture Studio</h2>
              <p className="text-sm">No image open</p>
              <button 
                onClick={handleOpenClick}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition-colors font-medium flex items-center gap-2"
              >
                  <FolderOpen size={16} /> Open Image
              </button>
              
              {showFilePicker && (
                  <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-8">
                    <div className="w-full h-full max-w-4xl max-h-[80vh] bg-[#1c1c1c] rounded-xl overflow-hidden shadow-2xl border border-white/10 flex flex-col animate-pop">
                        <div className="flex items-center justify-between p-3 border-b border-white/10 bg-white/5">
                            <span className="font-bold ml-2 text-sm text-white flex items-center gap-2"><ImageIcon size={16}/> Select Image</span>
                            <button onClick={() => setShowFilePicker(false)} className="hover:text-white transition-colors"><X size={18}/></button>
                        </div>
                        <div className="flex-1 overflow-hidden relative">
                            <FileManagerApp 
                                mode="picker"
                                allowedExtensions={['png', 'jpg', 'jpeg', 'webp', 'gif']}
                                onSelectFile={selectImage}
                                onCancel={() => setShowFilePicker(false)}
                                initialPath="/MyDocument/Picture"
                            />
                        </div>
                    </div>
                  </div>
              )}
          </div>
      );
  }

  const transformStyle = {
      transform: `scale(${state.scale}) rotate(${state.rotation}deg) scaleX(${state.flipH ? -1 : 1}) scaleY(${state.flipV ? -1 : 1})`,
      filter: `brightness(${state.brightness}%) contrast(${state.contrast}%) saturate(${state.saturation}%) grayscale(${state.grayscale}%) sepia(${state.sepia}%) invert(${state.invert}%) blur(${state.blur}px)`,
      transition: 'transform 0.2s ease-out, filter 0.2s ease-out'
  };

  return (
    <div className="h-full flex flex-col bg-[#121212] text-gray-200 font-sans relative">
      {/* Top Toolbar */}
      <div className="h-14 border-b border-white/10 bg-[#1a1a1a] flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <ImageIcon size={18} className="text-pink-400" />
                  <span className="truncate max-w-[150px]">{title}</span>
              </div>
              <div className="h-6 w-px bg-white/10" />
              <button onClick={handleOpenClick} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors flex flex-col items-center gap-0.5 text-[10px]">
                  <FolderOpen size={16} /> Open
              </button>
              <button onClick={handleSave} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors flex flex-col items-center gap-0.5 text-[10px]">
                  <Download size={16} /> Save
              </button>
          </div>

          <div className="flex items-center gap-2">
              <button onClick={() => updateState('scale', Math.max(0.1, state.scale - 0.1))} className="p-2 hover:bg-white/10 rounded-full"><ZoomOut size={18}/></button>
              <span className="text-xs w-10 text-center font-mono">{Math.round(state.scale * 100)}%</span>
              <button onClick={() => updateState('scale', Math.min(3, state.scale + 0.1))} className="p-2 hover:bg-white/10 rounded-full"><ZoomIn size={18}/></button>
              <div className="h-6 w-px bg-white/10 mx-2" />
              <button onClick={handleReset} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded text-xs font-medium border border-white/5">Reset All</button>
          </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
          {/* Main Canvas */}
          <div className="flex-1 overflow-hidden relative bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PHBhdGggZmlsbD0iIzIyMiIgZD0iTTAgMGgxMHYxMEgwem0xMCAxMGgxMHYxMEgxMHoiLz48L3N2Zz4=')] flex items-center justify-center p-8">
              <div ref={containerRef} className="relative shadow-2xl">
                  <img 
                    ref={imageRef}
                    src={image} 
                    alt="Edit Target" 
                    className="max-w-full max-h-[calc(100vh-200px)] object-contain"
                    style={transformStyle}
                    draggable={false}
                  />
              </div>
          </div>

          {/* Right Sidebar Controls */}
          <div className="w-72 bg-[#1a1a1a] border-l border-white/10 flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
              <div className="p-4 border-b border-white/5">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Sliders size={14}/> Adjustments</h3>
                  
                  <ControlSlider icon={<Sun size={14}/>} label="Brightness" value={state.brightness} min={0} max={200} onChange={(v) => updateState('brightness', v)} />
                  <ControlSlider icon={<Contrast size={14}/>} label="Contrast" value={state.contrast} min={0} max={200} onChange={(v) => updateState('contrast', v)} />
                  <ControlSlider icon={<PaintBucket size={14}/>} label="Saturation" value={state.saturation} min={0} max={200} onChange={(v) => updateState('saturation', v)} />
                  <ControlSlider icon={<Droplet size={14}/>} label="Blur" value={state.blur} min={0} max={20} step={0.5} onChange={(v) => updateState('blur', v)} />
              </div>

              <div className="p-4 border-b border-white/5">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2"><RefreshCcw size={14}/> Transform</h3>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                      <button onClick={() => updateState('rotation', state.rotation - 90)} className="p-2 bg-white/5 hover:bg-white/10 rounded flex items-center justify-center gap-2 text-xs"><RotateCcw size={14}/> Rotate L</button>
                      <button onClick={() => updateState('rotation', state.rotation + 90)} className="p-2 bg-white/5 hover:bg-white/10 rounded flex items-center justify-center gap-2 text-xs"><RotateCw size={14}/> Rotate R</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                      <button onClick={toggleFlipH} className={`p-2 rounded flex items-center justify-center gap-2 text-xs ${state.flipH ? 'bg-indigo-600 text-white' : 'bg-white/5 hover:bg-white/10'}`}><MoveHorizontal size={14}/> Flip H</button>
                      <button onClick={toggleFlipV} className={`p-2 rounded flex items-center justify-center gap-2 text-xs ${state.flipV ? 'bg-indigo-600 text-white' : 'bg-white/5 hover:bg-white/10'}`}><MoveVertical size={14}/> Flip V</button>
                  </div>
              </div>

              <div className="p-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Aperture size={14}/> Filters</h3>
                  <div className="space-y-2">
                       <FilterToggle label="Grayscale" active={state.grayscale > 0} onClick={toggleGrayscale} icon={<EyeOff size={14}/>} />
                       <FilterToggle label="Sepia" active={state.sepia > 0} onClick={toggleSepia} icon={<ImageSepiaIcon />} />
                       <FilterToggle label="Invert Colors" active={state.invert > 0} onClick={toggleInvert} icon={<Eye size={14}/>} />
                  </div>
              </div>
          </div>
      </div>

      {showFilePicker && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-8">
            <div className="w-full h-full max-w-4xl max-h-[80vh] bg-[#1c1c1c] rounded-xl overflow-hidden shadow-2xl border border-white/10 flex flex-col animate-pop">
                <div className="flex items-center justify-between p-3 border-b border-white/10 bg-white/5">
                    <span className="font-bold ml-2 text-sm text-white flex items-center gap-2"><ImageIcon size={16}/> Select Image</span>
                    <button onClick={() => setShowFilePicker(false)} className="hover:text-white transition-colors"><X size={18}/></button>
                </div>
                <div className="flex-1 overflow-hidden relative">
                    <FileManagerApp 
                        mode="picker"
                        allowedExtensions={['png', 'jpg', 'jpeg', 'webp', 'gif']}
                        onSelectFile={selectImage}
                        onCancel={() => setShowFilePicker(false)}
                        initialPath="/MyDocument/Picture"
                    />
                </div>
            </div>
          </div>
      )}
    </div>
  );
};

const ControlSlider = ({ icon, label, value, min, max, step = 1, onChange }: any) => (
    <div className="mb-4">
        <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-2 text-xs text-gray-400">{icon} {label}</div>
            <div className="text-xs font-mono text-gray-500">{value}</div>
        </div>
        <input 
            type="range" 
            min={min} max={max} step={step} 
            value={value} 
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
    </div>
);

const FilterToggle = ({ label, active, onClick, icon }: any) => (
    <button 
        onClick={onClick}
        className={`w-full p-2.5 rounded-lg flex items-center justify-between text-xs transition-colors ${active ? 'bg-indigo-600 text-white shadow-md' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
    >
        <div className="flex items-center gap-2">{icon} {label}</div>
        {active && <Check size={14} />}
    </button>
);

const ImageSepiaIcon = () => (
    <div className="w-3.5 h-3.5 rounded-full bg-amber-700/60 border border-amber-500/50"></div>
);