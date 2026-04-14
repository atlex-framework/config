import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

import { getConfigCacheFilePath } from './configCachePaths.js'

/**
 * Write merged configuration namespaces to the bootstrap cache file.
 *
 * @param basePath - Application root.
 * @param data - Serializable config tree (JSON-only values).
 */
export function writeConfigCacheSync(basePath: string, data: Record<string, unknown>): void {
  const filePath = getConfigCacheFilePath(basePath)
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

/**
 * Remove the config cache file when it exists.
 *
 * @param basePath - Application root.
 * @returns True when a file was removed.
 */
export function clearConfigCacheSync(basePath: string): boolean {
  const filePath = getConfigCacheFilePath(basePath)
  if (!existsSync(filePath)) {
    return false
  }
  unlinkSync(filePath)
  return true
}
