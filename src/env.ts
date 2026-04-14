import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { config as dotenvConfig } from 'dotenv'

import { EnvCaster } from './EnvCaster.js'

/**
 * Specification entry for {@link envs}: primitive name or constructor.
 */
export type EnvsEntry =
  | 'string'
  | 'number'
  | 'boolean'
  | typeof String
  | typeof Number
  | typeof Boolean

function loadEnvFile(absolutePath: string): void {
  if (!existsSync(absolutePath)) {
    return
  }
  dotenvConfig({ path: absolutePath, override: true })
}

/**
 * Load `.env` files into `process.env` (later files override earlier ones).
 *
 * Order: `.env`, `.env.local`, `.env.{APP_ENV}`, `.env.{APP_ENV}.local` (when `APP_ENV` is set).
 *
 * @param basePath - Directory containing env files (default: `process.cwd()`).
 */
export function loadEnv(basePath: string = process.cwd()): void {
  loadEnvFile(join(basePath, '.env'))
  loadEnvFile(join(basePath, '.env.local'))
  const envName = process.env.APP_ENV?.trim()
  if (envName !== undefined && envName.length > 0) {
    loadEnvFile(join(basePath, `.env.${envName}`))
    loadEnvFile(join(basePath, `.env.${envName}.local`))
  }
}

/**
 * Read an environment variable with optional fallback and typed casting.
 *
 * @param key - Variable name.
 * @returns Cast value, or `undefined` when missing and no fallback.
 */
export function env(key: string): string | number | boolean | null | undefined

/**
 * Read an environment variable with a string fallback.
 *
 * @param key - Variable name.
 * @param fallback - Default when the variable is unset.
 * @returns Cast string (or fallback).
 */
export function env(key: string, fallback: string): string

/**
 * Read an environment variable with a numeric fallback.
 *
 * @param key - Variable name.
 * @param fallback - Default when the variable is unset.
 * @returns Cast number (or fallback).
 */
export function env(key: string, fallback: number): number

/**
 * Read an environment variable with a boolean fallback.
 *
 * @param key - Variable name.
 * @param fallback - Default when the variable is unset.
 * @returns Cast boolean (or fallback).
 */
export function env(key: string, fallback: boolean): boolean

/**
 * Read an environment variable with `null` fallback.
 *
 * @param key - Variable name.
 * @param fallback - Default when the variable is unset.
 * @returns Cast value or `null`.
 */
export function env(key: string, fallback: null): string | number | boolean | null

export function env(
  key: string,
  fallback?: string | number | boolean | null,
): string | number | boolean | null | undefined {
  const raw = process.env[key]
  if (raw === undefined) {
    if (arguments.length >= 2) {
      return fallback as string | number | boolean | null
    }
    return undefined
  }

  if (arguments.length >= 2 && fallback !== undefined) {
    const t = typeof fallback
    if (t === 'boolean') {
      return EnvCaster.castTo(raw, Boolean)
    }
    if (t === 'number') {
      return EnvCaster.castTo(raw, Number)
    }
    if (t === 'string') {
      return EnvCaster.castTo(raw, String)
    }
    if (fallback === null) {
      return EnvCaster.cast(raw)
    }
  }

  return EnvCaster.cast(raw)
}

/**
 * Read several environment variables using explicit target types.
 *
 * @param spec - Map of env key → desired primitive (`'string'`, constructors, etc.).
 * @returns Object of cast values (`undefined` when a key is unset).
 */
export function envs(
  spec: Record<string, EnvsEntry>,
): Record<string, string | number | boolean | null | undefined> {
  const out: Record<string, string | number | boolean | null | undefined> = {}
  for (const [key, t] of Object.entries(spec)) {
    const raw = process.env[key]
    if (raw === undefined) {
      out[key] = undefined
      continue
    }
    if (t === 'string' || t === String) {
      out[key] = EnvCaster.castTo(raw, String)
    } else if (t === 'number' || t === Number) {
      out[key] = EnvCaster.castTo(raw, Number)
    } else if (t === 'boolean' || t === Boolean) {
      out[key] = EnvCaster.castTo(raw, Boolean)
    } else {
      out[key] = EnvCaster.cast(raw)
    }
  }
  return out
}

/**
 * Whether `key` exists on `process.env` (even when the value is empty).
 *
 * @param key - Variable name.
 * @returns True when the key is present.
 */
export function hasEnv(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(process.env, key)
}
