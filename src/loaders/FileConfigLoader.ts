import { existsSync, readdirSync, statSync } from 'node:fs'
import { basename, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { AtlexError } from '@atlex/core'
import { createJiti } from 'jiti'

import type { ConfigLoaderInterface } from '../contracts/ConfigLoaderInterface.js'

const ALLOWED_EXT = new Set(['.ts', '.js', '.mjs', '.cjs'])

function isIgnoredConfigFile(fileName: string): boolean {
  if (fileName.startsWith('.')) return true
  const base = basename(fileName, extname(fileName))
  if (base === 'index') return true
  if (fileName.endsWith('.test.ts') || fileName.endsWith('.spec.ts')) return true
  if (fileName.endsWith('.test.js') || fileName.endsWith('.spec.js')) return true
  return false
}

/**
 * Loads `config/*` modules (default export per file) synchronously via `jiti`.
 */
export class FileConfigLoader implements ConfigLoaderInterface {
  public constructor(private readonly configPath: string) {}

  /**
   * Load every eligible module under {@link configPath}.
   *
   * @returns Namespace (filename without extension) → default export.
   * @throws AtlexError when the directory is missing, a file has no default export, or import fails.
   */
  public loadSync(): Record<string, unknown> {
    if (!existsSync(this.configPath)) {
      throw new AtlexError(
        `Configuration directory not found: ${this.configPath}. Create a config/ folder or set paths.base.`,
        'E_CONFIG_DIR_MISSING',
      )
    }
    if (!statSync(this.configPath).isDirectory()) {
      throw new AtlexError(
        `Configuration path is not a directory: ${this.configPath}.`,
        'E_CONFIG_PATH_NOT_DIR',
      )
    }

    const jiti = createJiti(fileURLToPath(import.meta.url), { interopDefault: true })
    const entries = readdirSync(this.configPath)
    const result: Record<string, unknown> = {}

    for (const fileName of entries) {
      if (isIgnoredConfigFile(fileName)) continue
      const ext = extname(fileName)
      if (!ALLOWED_EXT.has(ext)) continue
      const fullPath = join(this.configPath, fileName)
      if (!statSync(fullPath).isFile()) continue

      const ns = basename(fileName, ext)
      try {
        const mod = jiti(fullPath) as { default?: unknown }
        if (mod.default === undefined) {
          throw new AtlexError(
            `Config file must export default: ${fullPath}`,
            'E_CONFIG_NO_DEFAULT_EXPORT',
          )
        }
        result[ns] = mod.default
      } catch (err) {
        if (err instanceof AtlexError) throw err
        const message = err instanceof Error ? err.message : String(err)
        throw new AtlexError(
          `Failed to load config file ${fullPath}: ${message}`,
          'E_CONFIG_LOAD_FAILED',
        )
      }
    }

    return result
  }
}
