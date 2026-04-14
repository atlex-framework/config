import { join } from 'node:path'

/**
 * Absolute path to the serialized config cache file.
 *
 * @param basePath - Application root (same as used by {@link loadEnv}).
 * @returns Path to `bootstrap/cache/config.cached.json`.
 */
export function getConfigCacheFilePath(basePath: string): string {
  return join(basePath, 'bootstrap', 'cache', 'config.cached.json')
}
