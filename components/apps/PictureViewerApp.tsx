import React, { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCw, RotateCcw, AlertCircle, Download, FlipHorizontal, FlipVertical, Wand2 } from 'lucide-react';

interface PictureViewerProps {
  initialImage?: string;
  initialTitle?: string;
}

type FilterType = 'none' | 'grayscale' | 'sepia' | 'invert' | 'blur';

export const PictureViewerApp: React.FC<PictureViewerProps> = ({ initialImage, initialTitle }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [filter, setFilter] = useState<FilterType>('none');
  const [image, setImage] = useState(initialImage);
  const [title, setTitle] = useState(initialTitle);

  // Reset state when a new image is passed via props
  useEffect(() => {
    if (initialImage && initialImage !== image) {
      setImage(initialImage);
      setTitle(initialTitle);
      // Reset view controls
      setScale(1);
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      setFilter('none');
    }
  }, [initialImage, initialTitle, image]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.25));
  const handleRotateCw = () => setRotation(prev => prev + 90);
  const handleRotateCcw = () => setRotation(prev => prev - 90);
  const handleFlipH = () => setFlipH(prev => !prev);
  const handleFlipV = () => setFlipV(prev => !prev);
  
  const cycleFilter = () => {
    const filters: FilterType[] = ['none', 'grayscale', 'sepia', 'invert', 'blur'];
    const nextIndex = (filters.indexOf(filter) + 1) % filters.length;
    setFilter(filters[nextIndex]);
  };

  const handleDownload = () => {
    if (!image) return;
    const a = document.createElement('a');
    a.href = image;
    a.download = title || 'downloaded-image';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setFilter('none');
  };

  const getFilterStyle = (f: FilterType) => {
    switch(f) {
        case 'grayscale': return 'grayscale(100%)';
        case 'sepia': return 'sepia(100%)';
        case 'invert': return 'invert(100%)';
        case 'blur': return 'blur(2px)';
        default: return 'none';
    }
  };

  if (!image) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 bg-gray-900/50">
        <AlertCircle size={48} className="mb-4 opacity-50" />
        <p className="font-serif text-lg">No image selected</p>
        <p className="text-xs mt-2">Open an image from /MyDocument/Picture</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-950 text-gray-200">
      {/* Toolbar */}
      <div className="h-12 border-b border-white/10 bg-gray-900/80 flex items-center justify-between px-2 shrink-0 overflow-x-auto">
        <div className="flex items-center gap-1">
          {/* Zoom */}
          <button onClick={handleZoomOut} className="p-1.5 hover:bg-white/10 rounded-md transition-colors" title="Zoom Out">
            <ZoomOut size={18} />
          </button>
          <span className="text-xs font-mono w-10 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={handleZoomIn} className="p-1.5 hover:bg-white/10 rounded-md transition-colors" title="Zoom In">
            <ZoomIn size={18} />
          </button>
          
          <div className="w-px h-6 bg-white/10 mx-2" />
          
          {/* Transform */}
          <button onClick={handleRotateCcw} className="p-1.5 hover:bg-white/10 rounded-md transition-colors" title="Rotate Left">
            <RotateCcw size={18} />
          </button>
          <button onClick={handleRotateCw} className="p-1.5 hover:bg-white/10 rounded-md transition-colors" title="Rotate Right">
            <RotateCw size={18} />
          </button>
          <button onClick={handleFlipH} className={`p-1.5 hover:bg-white/10 rounded-md transition-colors ${flipH ? 'bg-white/10 text-indigo-300' : ''}`} title="Flip Horizontal">
            <FlipHorizontal size={18} />
          </button>
          <button onClick={handleFlipV} className={`p-1.5 hover:bg-white/10 rounded-md transition-colors ${flipV ? 'bg-white/10 text-indigo-300' : ''}`} title="Flip Vertical">
            <FlipVertical size={18} />
          </button>

          <div className="w-px h-6 bg-white/10 mx-2" />

          {/* Filters */}
          <button 
            onClick={cycleFilter} 
            className={`p-1.5 hover:bg-white/10 rounded-md transition-colors flex items-center gap-1 ${filter !== 'none' ? 'bg-indigo-500/20 text-indigo-300' : ''}`} 
            title="Toggle Filters"
          >
            <Wand2 size={18} />
            {filter !== 'none' && <span className="text-[10px] font-bold uppercase">{filter}</span>}
          </button>

          <div className="w-px h-6 bg-white/10 mx-2" />

          {/* Actions */}
          <button onClick={handleReset} className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-xs font-medium px-2" title="Reset View">
            Reset
          </button>
          <button onClick={handleDownload} className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-xs font-medium px-2 flex items-center gap-1" title="Download Image">
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* Image Area */}
      <div className="flex-1 overflow-hidden relative flex items-center justify-center bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PHBhdGggZmlsbD0iIzIyMiIgZD0iTTAgMGgxMHYxMEgwem0xMCAxMGgxMHYxMEgxMHoiLz48L3N2Zz4=')]">
        <div 
          className="transition-all duration-300 ease-out"
          style={{ 
            transform: `scale(${scale}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
            maxWidth: '100%',
            maxHeight: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img 
            src={image} 
            alt={title} 
            className="max-w-[90%] max-h-[90%] shadow-2xl ring-1 ring-white/10"
            style={{ 
              objectFit: 'contain',
              filter: getFilterStyle(filter)
            }}
            draggable={false}
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-gray-900 border-t border-white/5 flex items-center px-3 text-[10px] text-gray-500 font-mono gap-4">
        <span className="truncate max-w-[200px]">{title || 'Untitled'}</span>
        <span>ROT: {rotation}°</span>
        {filter !== 'none' && <span className="text-indigo-400 uppercase">FX: {filter}</span>}
        <span className="ml-auto">Rakko Viewer</span>
      </div>
    </div>
  );
};