import { AtlexError, getApplicationContext } from '@atlex/core'

import { readAtlexErrorCode } from '../atlexErrorCode.js'
import { type ConfigRepository } from '../ConfigRepository.js'

/**
 * Global configuration accessor (requires {@link ConfigServiceProvider} and booted application context).
 *
 * @param key - Dot-notation key.
 * @param fallback - Value when missing.
 * @returns Resolved value or `undefined`.
 */
export function config<T = unknown>(key: string, fallback?: T): T | undefined

/**
 * Set runtime configuration values.
 *
 * @param values - Map of dot keys → values.
 */
export function config(values: Record<string, unknown>): void

export function config<T = unknown>(
  keyOrValues: string | Record<string, unknown>,
  fallback?: T,
): T | undefined | void {
  let app
  try {
    app = getApplicationContext()
  } catch {
    throw new AtlexError(
      'ConfigRepository is not available: application context is not set. Call application.boot() after registering ConfigServiceProvider.',
      'E_CONFIG_NO_APPLICATION',
    )
  }

  let repo: ConfigRepository
  try {
    repo = app.make<ConfigRepository>('config')
  } catch (err: unknown) {
    if (readAtlexErrorCode(err) === 'E_BINDING_NOT_FOUND') {
      throw new AtlexError(
        'ConfigRepository is not registered in the container. Register ConfigServiceProvider and bind the "config" instance.',
        'E_CONFIG_NOT_REGISTERED',
      )
    }
    throw err
  }

  if (typeof keyOrValues === 'string') {
    return repo.get<T>(keyOrValues, fallback) as T | undefined
  }
  repo.setMany(keyOrValues)
}
