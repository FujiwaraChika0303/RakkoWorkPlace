import { fsService } from '../services/fileSystemService';

// Backward compatibility proxy (Read-Only Snapshot)
// Note: This won't be reactive. Components should use fsService methods.
export const fileSystem = new Proxy({}, {
  get: (target, prop) => {
    if (typeof prop === 'string') {
      return fsService.getDirectory(prop);
    }
    return [];
  }
});
