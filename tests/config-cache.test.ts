import { describe, expect, it } from 'vitest'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { readCachedConfigSync } from '../src/loadCachedConfig.js'
import { clearConfigCacheSync, writeConfigCacheSync } from '../src/writeConfigCache.js'

describe('config cache', () => {
  it('writes, reads, and clears cache file', () => {
    const dir = join(tmpdir(), `atlex-cc-${Date.now()}`)
    mkdirSync(dir, { recursive: true })
    try {
      writeConfigCacheSync(dir, { app: { n: 1 } })
      expect(readCachedConfigSync(dir)).toEqual({ app: { n: 1 } })
      expect(clearConfigCacheSync(dir)).toBe(true)
      expect(clearConfigCacheSync(dir)).toBe(false)
      expect(readCachedConfigSync(dir)).toBeNull()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('throws on invalid JSON cache', () => {
    const dir = join(tmpdir(), `atlex-cc-bad-${Date.now()}`)
    const cacheDir = join(dir, 'bootstrap', 'cache')
    mkdirSync(cacheDir, { recursive: true })
    writeFileSync(join(cacheDir, 'config.cached.json'), '[1]', 'utf8')
    try {
      expect(() => readCachedConfigSync(dir)).toThrow(/Invalid config cache shape/)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
