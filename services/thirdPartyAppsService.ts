
import { AppId } from '../types';

export interface ThirdPartyAppDefinition {
  id: AppId;
  label: string;
  url: string;
  iconUrl?: string;
}

export const loadThirdPartyApps = (): ThirdPartyAppDefinition[] => {
  const apps: ThirdPartyAppDefinition[] = [];
  const meta = import.meta as any;

  // Strategy 1: Vite import.meta.glob (Build time / Vite Dev Server)
  // We check if the function exists to avoid runtime errors in other environments
  if (typeof meta.glob === 'function') {
      try {
        const htmlModules = meta.glob('/ThirdApps/*/index.html', { 
            query: '?url', 
            import: 'default', 
            eager: true 
        });

        const iconModules = meta.glob('/ThirdApps/*/*.{png,svg,jpg,jpeg,webp,ico}', { 
            query: '?url', 
            import: 'default', 
            eager: true 
        });

        for (const path in htmlModules) {
            const parts = path.split('/');
            // Expected path: /ThirdApps/[AppName]/index.html
            if (parts.length < 3) continue;
            
            // Extract folder name (App Name)
            const folderName = parts[2]; 
            const id = `third_party_${folderName}`;
            const url = htmlModules[path] as string;

            // Find matching icon
            const iconKey = Object.keys(iconModules).find(key => key.includes(`/ThirdApps/${folderName}/`));
            const iconUrl = iconKey ? (iconModules[iconKey] as string) : undefined;

            apps.push({ id, label: folderName, url, iconUrl });
        }
        return apps;
      } catch (e) {
          console.warn("Auto-scan via glob failed:", e);
      }
  }

  // Strategy 2: Fallback for environments without glob support (e.g. Runtime Browser)
  // Since we cannot scan the filesystem dynamically in a standard browser runtime without a build step,
  // we fallback to manually registering the 'RTest' app which we know exists.
  // In a real production environment without Vite, you would fetch a 'manifest.json' here.
  
  console.log("Using fallback app list (import.meta.glob not available)");
  apps.push({
      id: 'third_party_RTest',
      label: 'RTest',
      url: '/ThirdApps/RTest/index.html',
      iconUrl: undefined // Use default '?' icon
  });

  return apps;
};
