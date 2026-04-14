import { afterEach, describe, expect, it } from 'vitest'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { env, envs, hasEnv, loadEnv } from '../src/env.js'

describe('env()', () => {
  const prev = { ...process.env }

  afterEach(() => {
    process.env = { ...prev }
  })

  it('returns undefined when missing without fallback', () => {
    delete process.env['ATLEX_ENV_TEST_X']
    expect(env('ATLEX_ENV_TEST_X')).toBeUndefined()
  })

  it('uses fallback when missing', () => {
    delete process.env['ATLEX_ENV_TEST_X']
    expect(env('ATLEX_ENV_TEST_X', 'def')).toBe('def')
    expect(env('ATLEX_ENV_TEST_X', 3306)).toBe(3306)
    expect(env('ATLEX_ENV_TEST_X', false)).toBe(false)
  })

  it('casts present values with fallback type', () => {
    process.env['ATLEX_ENV_TEST_X'] = 'true'
    expect(env('ATLEX_ENV_TEST_X', false)).toBe(true)
    process.env['ATLEX_ENV_TEST_X'] = '5432'
    expect(env('ATLEX_ENV_TEST_X', 3306)).toBe(5432)
  })

  it('envs reads multiple keys with types', () => {
    process.env['ATLEX_ENV_MULTI_A'] = 'hello'
    process.env['ATLEX_ENV_MULTI_B'] = '7'
    process.env['ATLEX_ENV_MULTI_C'] = 'true'
    const o = envs({
      ATLEX_ENV_MULTI_A: String,
      ATLEX_ENV_MULTI_B: Number,
      ATLEX_ENV_MULTI_C: Boolean,
    })
    expect(o.ATLEX_ENV_MULTI_A).toBe('hello')
    expect(o.ATLEX_ENV_MULTI_B).toBe(7)
    expect(o.ATLEX_ENV_MULTI_C).toBe(true)
  })

  it('hasEnv detects presence', () => {
    process.env['ATLEX_ENV_TEST_Y'] = ''
    expect(hasEnv('ATLEX_ENV_TEST_Y')).toBe(true)
    delete process.env['ATLEX_ENV_TEST_Y']
    expect(hasEnv('ATLEX_ENV_TEST_Y')).toBe(false)
  })

  it('loadEnv merges files in order', () => {
    const dir = join(tmpdir(), `atlex-env-${Date.now()}`)
    mkdirSync(dir, { recursive: true })
    try {
      writeFileSync(join(dir, '.env'), 'APP_ENV=testing\nFOO=1\n', 'utf8')
      writeFileSync(join(dir, '.env.local'), 'FOO=2\n', 'utf8')
      loadEnv(dir)
      expect(process.env['FOO']).toBe('2')
      expect(process.env['APP_ENV']).toBe('testing')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
