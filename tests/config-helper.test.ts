import { afterEach, describe, expect, it } from 'vitest'

import { Application, resetApplicationContextForTests } from '@atlex/core'

import { ConfigRepository } from '../src/ConfigRepository.js'
import { config } from '../src/helpers/config.js'

describe('config() helper', () => {
  afterEach(() => {
    resetApplicationContextForTests()
  })

  it('gets and sets via container', () => {
    const app = new Application()
    const repo = new ConfigRepository({ app: { name: 'T' } })
    app.container.instance('config', repo)
    app.boot()
    expect(config('app.name')).toBe('T')
    config({ 'app.name': 'X' })
    expect(config('app.name')).toBe('X')
  })

  it('throws when config binding missing', () => {
    const app = new Application()
    app.boot()
    expect(() => config('app.name')).toThrow(/not registered/)
  })
})
