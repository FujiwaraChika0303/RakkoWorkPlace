import React from 'react';

export const AboutApp: React.FC = () => {
  return (
    <div className="w-full h-full overflow-hidden rounded bg-white">
      <iframe 
        src="https://aboutwp.rakko.cn" 
        className="w-full h-full border-none block"
        title="About Rakko Workplace"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      />
    </div>
  );
};