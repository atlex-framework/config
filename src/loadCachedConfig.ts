import { existsSync, readFileSync } from 'node:fs'

import { AtlexError } from '@atlex/core'

import { getConfigCacheFilePath } from './configCachePaths.js'

/**
 * Read cached configuration JSON if present.
 *
 * @param basePath - Application root.
 * @returns Parsed namespaces, or `null` when no cache file exists.
 * @throws AtlexError when the file exists but is not valid JSON.
 */
export function readCachedConfigSync(basePath: string): Record<string, unknown> | null {
  const filePath = getConfigCacheFilePath(basePath)
  if (!existsSync(filePath)) {
    return null
  }
  try {
    const raw = readFileSync(filePath, 'utf8')
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new AtlexError(
        `Invalid config cache shape (expected object): ${filePath}`,
        'E_CONFIG_CACHE_INVALID',
      )
    }
    return parsed as Record<string, unknown>
  } catch (err) {
    if (err instanceof AtlexError) throw err
    const message = err instanceof Error ? err.message : String(err)
    throw new AtlexError(
      `Failed to read config cache ${filePath}: ${message}`,
      'E_CONFIG_CACHE_READ_FAILED',
    )
  }
}
