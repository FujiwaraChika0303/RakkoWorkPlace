import React, { useState } from 'react';
import { Loader2, Globe } from 'lucide-react';

interface IframeAppProps {
  src: string;
  title: string;
}

export const IframeApp: React.FC<IframeAppProps> = ({ src, title }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="w-full h-full relative bg-gray-50 flex flex-col">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 animate-fade-in">
          <Loader2 size={40} className="text-indigo-500 animate-spin mb-4" />
          <h3 className="text-lg font-medium text-gray-700">Loading {title}...</h3>
          <p className="text-sm text-gray-400 mt-1">Initializing Third-Party Runtime</p>
        </div>
      )}

      {hasError ? (
         <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-500 p-8 text-center">
            <Globe size={48} className="mb-4 opacity-50" />
            <h3 className="text-lg font-bold">Application Error</h3>
            <p className="text-sm">Could not load the application resource.</p>
         </div>
      ) : (
          <iframe 
            src={src}
            title={title}
            className={`w-full h-full border-none transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            onLoad={() => setIsLoading(false)}
            onError={() => setHasError(true)}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
          />
      )}
    </div>
  );
};