import React from 'react';
import { Image as ImageIcon, FolderOpen, AlertCircle } from 'lucide-react';
import { fileSystem } from '../../data/fileSystem';

interface GalleryAppProps {
  onOpenImage: (url: string, title: string) => void;
}

export const GalleryApp: React.FC<GalleryAppProps> = ({ onOpenImage }) => {
  // STRICTLY Restrict to /MyDocument/Picture
  const targetPath = '/MyDocument/Picture';
  const rawFiles = fileSystem[targetPath] || [];
  
  // Filter only images just in case
  const images = rawFiles.filter(f => f.fileType === 'image' && f.url);

  return (
    <div className="h-full flex flex-col bg-gray-950/50">
      {/* Address Bar */}
      <div className="h-10 border-b border-white/10 flex items-center px-4 gap-2 bg-white/5">
        <FolderOpen size={16} className="text-indigo-400" />
        <div className="flex items-center text-sm font-mono text-gray-400">
          <span className="opacity-50">MyDocument</span>
          <span className="mx-1 text-gray-600">/</span>
          <span className="text-gray-200 font-medium">Picture</span>
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {images.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <AlertCircle size={32} className="mb-2 opacity-50"/>
                <span className="text-sm">No images found in {targetPath}</span>
             </div>
        ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((img, idx) => (
                <div 
                key={idx} 
                className="group flex flex-col gap-2 cursor-pointer"
                onClick={() => img.url && onOpenImage(img.url, img.name)}
                >
                <div className="aspect-[4/3] rounded-lg overflow-hidden border border-white/10 bg-black/50 relative shadow-sm group-hover:border-indigo-500/50 group-hover:shadow-indigo-500/20 transition-all">
                    <img 
                    src={img.url} 
                    alt={img.name}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" 
                    />
                    <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex items-center gap-2 px-1">
                    <ImageIcon size={14} className="text-indigo-400" />
                    <span className="text-xs text-gray-400 truncate font-mono group-hover:text-indigo-300 transition-colors">
                    {img.name}
                    </span>
                </div>
                </div>
            ))}
            </div>
        )}
        
        <div className="mt-8 pt-4 border-t border-white/5 text-center">
          <span className="text-[10px] text-gray-600 font-serif tracking-widest uppercase opacity-60">
            {images.length} Objects • /MyDocument/Picture
          </span>
        </div>
      </div>
    </div>
  );
};