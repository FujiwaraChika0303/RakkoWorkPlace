
import { AppId } from '../types';

export interface ThirdPartyAppDefinition {
  id: AppId;
  label: string;
  url: string;
  iconUrl?: string;
}

/**
 * Scans the /ThirdApps directory for valid applications.
 * Rule: A valid app must have an index.html inside a subdirectory.
 * Example: /ThirdApps/MyGame/index.html
 */
export const scanThirdPartyApps = (): ThirdPartyAppDefinition[] => {
  const apps: ThirdPartyAppDefinition[] = [];
  const meta = import.meta as any;

  // Check if we are in a Vite environment supporting glob import
  if (typeof meta.glob !== 'function') {
    console.warn('System: Auto-scan for ThirdPartyApps skipped (import.meta.glob not supported).');
    return [];
  }

  try {
    // 1. Scan for all index.html files (The entry points)
    // eager: true ensures we get the module/URL immediately without a promise
    const htmlModules = meta.glob('/ThirdApps/*/index.html', { 
        query: '?url', 
        import: 'default', 
        eager: true 
    });

    // 2. Scan for all potential icons (png, jpg, svg, etc.)
    const iconModules = meta.glob('/ThirdApps/*/*.{png,jpg,jpeg,svg,webp,ico}', { 
        query: '?url', 
        import: 'default', 
        eager: true 
    });

    // 3. Process each found app
    for (const path in htmlModules) {
        // Path format: /ThirdApps/[AppName]/index.html
        const parts = path.split('/');
        
        // Safety check for folder structure
        if (parts.length < 3) continue;
        
        const folderName = parts[2]; // e.g., "RTest"
        const appName = decodeURIComponent(folderName); // Support URL encoded names
        
        // Create a unique internal ID
        const id = `3rd_party_${folderName}`;
        
        // Get the actual URL for the iframe
        const appUrl = htmlModules[path] as string;

        // Try to find a matching icon in the same folder
        // We look for any icon file path that contains the app's folder path
        const iconKey = Object.keys(iconModules).find(key => key.includes(`/ThirdApps/${folderName}/`));
        const iconUrl = iconKey ? (iconModules[iconKey] as string) : undefined;

        apps.push({
            id,
            label: appName,
            url: appUrl,
            iconUrl
        });
    }

    console.log(`[System] Discovered ${apps.length} third-party apps.`);
    
  } catch (error) {
    console.error('[System] Failed to scan third-party apps:', error);
  }

  return apps;
};
