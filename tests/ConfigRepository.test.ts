import { describe, expect, it } from 'vitest'

import { ConfigRepository } from '../src/ConfigRepository.js'

describe('ConfigRepository', () => {
  it('gets dot notation and fallbacks', () => {
    const r = new ConfigRepository({
      app: { name: 'Atlex', nested: { x: 1 } },
    })
    expect(r.get('app.name')).toBe('Atlex')
    expect(r.get('app.missing', 'z')).toBe('z')
    expect(r.get('app.nested.x')).toBe(1)
  })

  it('returns deep clones for objects', () => {
    const r = new ConfigRepository({ app: { meta: { a: 1 } } })
    const v = r.get('app.meta') as Record<string, number>
    v.a = 99
    expect((r.get('app.meta') as Record<string, number>).a).toBe(1)
  })

  it('handles wildcards', () => {
    const r = new ConfigRepository({
      database: {
        connections: {
          p: { driver: 'postgres' },
          s: { driver: 'sqlite' },
        },
      },
    })
    expect(r.get('database.connections.*.driver')).toEqual(['postgres', 'sqlite'])
  })

  it('sets single and object keys', () => {
    const r = new ConfigRepository({ app: { name: 'A' } })
    r.set('app.name', 'B')
    expect(r.get('app.name')).toBe('B')
    r.set({ 'cache.default': 'redis', 'cache.stores.redis.url': 'x' })
    expect(r.get('cache.default')).toBe('redis')
    expect(r.get('cache.stores.redis.url')).toBe('x')
  })

  it('getMany and merge', () => {
    const r = new ConfigRepository({ app: { a: 1 } })
    r.merge('app', { b: 2, a: 1 })
    expect(r.get('app.b')).toBe(2)
    const m = r.getMany(['app.a', 'app.b'], { 'app.a': 0 })
    expect(m['app.a']).toBe(1)
    expect(m['app.b']).toBe(2)
  })

  it('prepend and push', () => {
    const r = new ConfigRepository({})
    r.push('mid', 2)
    r.prepend('mid', 1)
    expect(r.get('mid')).toEqual([1, 2])
  })

  it('all() clones', () => {
    const r = new ConfigRepository({ x: { y: 1 } })
    const a = r.all()
    ;(a.x as Record<string, number>).y = 2
    expect((r.get('x') as Record<string, number>).y).toBe(1)
  })

  it('has respects wildcards', () => {
    const r = new ConfigRepository({ a: { b: { c: 1 } } })
    expect(r.has('a.b.c')).toBe(true)
    expect(r.has('a.*.c')).toBe(true)
    expect(r.has('a.*.nope')).toBe(false)
  })
})
