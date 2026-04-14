import { describe, expect, it } from 'vitest'

import { EnvCaster } from '../src/EnvCaster.js'
import { hasEnv } from '../src/env.js'

describe('@atlex/config examples', () => {
  it('EnvCaster cast true', () => {
    expect(EnvCaster.cast('true')).toBe(true)
  })

  it('EnvCaster cast false', () => {
    expect(EnvCaster.cast('false')).toBe(false)
  })

  it('EnvCaster cast number', () => {
    expect(EnvCaster.cast('42')).toBe(42)
  })

  it('hasEnv returns boolean', () => {
    expect(typeof hasEnv('PATH')).toBe('boolean')
  })

  it('EnvCaster castTo Number', () => {
    expect(EnvCaster.castTo('7', Number)).toBe(7)
  })
})
