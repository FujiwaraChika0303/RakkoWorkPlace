import React, { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCw, RotateCcw, Maximize, AlertCircle } from 'lucide-react';

interface PictureViewerProps {
  initialImage?: string;
  initialTitle?: string;
}

export const PictureViewerApp: React.FC<PictureViewerProps> = ({ initialImage, initialTitle }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [image, setImage] = useState(initialImage);
  const [title, setTitle] = useState(initialTitle);

  // Reset state when a new image is passed via props
  useEffect(() => {
    if (initialImage && initialImage !== image) {
      setImage(initialImage);
      setTitle(initialTitle);
      setScale(1);
      setRotation(0);
    }
  }, [initialImage, initialTitle, image]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.25));
  const handleRotateCw = () => setRotation(prev => prev + 90);
  const handleRotateCcw = () => setRotation(prev => prev - 90);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
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
      <div className="h-12 border-b border-white/10 bg-gray-900/80 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-1">
          <button onClick={handleZoomOut} className="p-1.5 hover:bg-white/10 rounded-md transition-colors" title="Zoom Out">
            <ZoomOut size={18} />
          </button>
          <span className="text-xs font-mono w-12 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={handleZoomIn} className="p-1.5 hover:bg-white/10 rounded-md transition-colors" title="Zoom In">
            <ZoomIn size={18} />
          </button>
          <div className="w-px h-6 bg-white/10 mx-2" />
          <button onClick={handleRotateCcw} className="p-1.5 hover:bg-white/10 rounded-md transition-colors" title="Rotate Left">
            <RotateCcw size={18} />
          </button>
          <button onClick={handleRotateCw} className="p-1.5 hover:bg-white/10 rounded-md transition-colors" title="Rotate Right">
            <RotateCw size={18} />
          </button>
          <div className="w-px h-6 bg-white/10 mx-2" />
          <button onClick={handleReset} className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-xs font-medium px-3" title="Reset View">
            Reset
          </button>
        </div>
        <div className="text-xs text-gray-500 truncate max-w-[150px] font-mono">
          {title || 'Unknown Image'}
        </div>
      </div>

      {/* Image Area */}
      <div className="flex-1 overflow-hidden relative flex items-center justify-center bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PHBhdGggZmlsbD0iIzIyMiIgZD0iTTAgMGgxMHYxMEgwem0xMCAxMGgxMHYxMEgxMHoiLz48L3N2Zz4=')]">
        <div 
          className="transition-transform duration-300 ease-out"
          style={{ 
            transform: `scale(${scale}) rotate(${rotation}deg)`,
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
            }}
            draggable={false}
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-gray-900 border-t border-white/5 flex items-center px-3 text-[10px] text-gray-500 font-mono gap-4">
        <span>PATH: /MyDocument/Picture/{title}</span>
        <span>ROT: {rotation}°</span>
        <span className="ml-auto">Rakko Viewer</span>
      </div>
    </div>
  );
};