import { join } from 'node:path'

import type { Application } from '@atlex/core'
import { ServiceProvider } from '@atlex/core'

import { readAtlexErrorCode } from './atlexErrorCode.js'
import { ConfigRepository } from './ConfigRepository.js'
import { loadEnv } from './env.js'
import { readCachedConfigSync } from './loadCachedConfig.js'
import { FileConfigLoader } from './loaders/FileConfigLoader.js'

function resolveBasePath(app: Application): string {
  try {
    return app.make<string>('paths.base')
  } catch (err: unknown) {
    if (readAtlexErrorCode(err) === 'E_BINDING_NOT_FOUND') {
      return process.cwd()
    }
    throw err
  }
}

/**
 * Registers {@link ConfigRepository} as `config` after loading env and config files (or cache).
 */
export class ConfigServiceProvider extends ServiceProvider {
  /**
   * Load `.env`, then either `bootstrap/cache/config.cached.json` or `config/*` modules.
   *
   * @param app - Application instance.
   */
  public register(app: Application): void {
    const basePath = resolveBasePath(app)
    loadEnv(basePath)

    const cached = readCachedConfigSync(basePath)
    const items =
      cached !== null
        ? cached
        : (() => {
            const loader = new FileConfigLoader(join(basePath, 'config'))
            return loader.loadSync()
          })()

    const repo = new ConfigRepository(items)
    app.container.instance('config', repo)
  }

  /**
   * No-op boot hook (reserved for future warm-up).
   *
   * @param _app - Application instance.
   */
  public boot(_app: Application): void {
    // intentionally empty
  }
}
