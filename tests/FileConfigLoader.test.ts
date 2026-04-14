import { describe, expect, it } from 'vitest'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { FileConfigLoader } from '../src/loaders/FileConfigLoader.js'

describe('FileConfigLoader', () => {
  it('loads default exports from config directory', () => {
    const dir = join(tmpdir(), `atlex-cfg-${Date.now()}`)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'alpha.ts'), `export default { k: 1 }`, 'utf8')
    const loader = new FileConfigLoader(dir)
    expect(loader.loadSync().alpha).toEqual({ k: 1 })
    rmSync(dir, { recursive: true, force: true })
  })

  it('throws when directory missing', () => {
    const loader = new FileConfigLoader(join(tmpdir(), `missing-${Date.now()}`))
    expect(() => loader.loadSync()).toThrow(/Configuration directory not found/)
  })
})
