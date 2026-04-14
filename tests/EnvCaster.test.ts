import { describe, expect, it } from 'vitest'

import { EnvCaster } from '../src/EnvCaster.js'

describe('EnvCaster', () => {
  it('casts boolean strings', () => {
    expect(EnvCaster.cast('true')).toBe(true)
    expect(EnvCaster.cast('TRUE')).toBe(true)
    expect(EnvCaster.cast('false')).toBe(false)
  })

  it('casts null and empty', () => {
    expect(EnvCaster.cast('null')).toBe(null)
    expect(EnvCaster.cast('')).toBe('')
    expect(EnvCaster.cast('(empty)')).toBe('')
  })

  it('casts numbers and rejects leading-zero octal-like strings', () => {
    expect(EnvCaster.cast('3306')).toBe(3306)
    expect(EnvCaster.cast('3.14')).toBe(3.14)
    expect(EnvCaster.cast('08')).toBe('08')
    expect(EnvCaster.cast('0')).toBe(0)
  })

  it('castTo respects constructors', () => {
    expect(EnvCaster.castTo('true', Boolean)).toBe(true)
    expect(EnvCaster.castTo('0', Boolean)).toBe(false)
    expect(EnvCaster.castTo('x', Number)).toBe(0)
    expect(EnvCaster.castTo('9', Number)).toBe(9)
    expect(EnvCaster.castTo('hi', String)).toBe('hi')
  })
})
