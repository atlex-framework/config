function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function cloneBoundary(value: unknown): unknown {
  if (value === null || typeof value !== 'object') {
    return value
  }
  try {
    return structuredClone(value)
  } catch {
    return JSON.parse(JSON.stringify(value)) as unknown
  }
}

/**
 * Centralized configuration repository (`config()`-style access).
 */
export class ConfigRepository {
  private readonly items = new Map<string, unknown>()

  private keyCache = new Map<string, string[]>()

  public constructor(initialItems?: Record<string, unknown>) {
    if (initialItems !== undefined) {
      for (const [k, v] of Object.entries(initialItems)) {
        this.items.set(k, v)
      }
    }
  }

  /**
   * @param key - Dot-notation key; empty string returns all namespaces (cloned).
   * @param fallback - Value when the key is missing.
   * @returns Resolved value, wildcard matches as array, or fallback / `undefined`.
   */
  public get<T = unknown>(key: string, fallback?: T): T | unknown[] | undefined {
    if (key === '') {
      return cloneBoundary(this.allRaw()) as T | unknown[] | undefined
    }

    const parts = this.parseDotKey(key)
    if (parts.includes('*')) {
      const resolved = this.getWildcard(parts)
      return resolved === undefined ? fallback : resolved
    }

    const rootKey = parts[0]
    if (rootKey === undefined || rootKey.length === 0) {
      return fallback
    }
    const root = this.items.get(rootKey)
    if (parts.length === 1) {
      return root === undefined ? fallback : (cloneBoundary(root) as T)
    }
    const inner = parts.slice(1)
    const value = this.navigate(root, inner)
    return value === undefined ? fallback : (cloneBoundary(value) as T)
  }

  /**
   * Set one key or many keys using dot notation.
   *
   * @param keyOrValues - Dot key or record of dot keys → values.
   * @param value - Value when the first argument is a string.
   */
  public set(key: string, value: unknown): void
  public set(values: Record<string, unknown>): void
  public set(keyOrValues: string | Record<string, unknown>, value?: unknown): void {
    if (typeof keyOrValues === 'string') {
      this.setOne(keyOrValues, value)
    } else {
      for (const [k, v] of Object.entries(keyOrValues)) {
        this.setOne(k, v)
      }
    }
    this.keyCache.clear()
  }

  /**
   * Whether a key resolves (wildcard-aware).
   *
   * @param key - Dot-notation key.
   * @returns True when the path exists.
   */
  public has(key: string): boolean {
    if (key === '') {
      return this.items.size > 0
    }
    const parts = this.parseDotKey(key)
    if (parts.includes('*')) {
      const v = this.getWildcard(parts)
      return v !== undefined && v.length > 0
    }
    const rootKey = parts[0]
    if (rootKey === undefined || rootKey.length === 0) return false
    const root = this.items.get(rootKey)
    if (parts.length === 1) return root !== undefined
    return this.navigate(root, parts.slice(1)) !== undefined
  }

  /**
   * Deep clone of all configuration namespaces.
   *
   * @returns Plain object `{ [namespace]: config }`.
   */
  public all(): Record<string, unknown> {
    return cloneBoundary(this.allRaw()) as Record<string, unknown>
  }

  /**
   * Batch read with optional per-key fallbacks.
   *
   * @param keys - Dot-notation keys.
   * @param fallbacks - Optional map of key → fallback.
   * @returns Map of input key → resolved value.
   */
  public getMany(keys: string[], fallbacks?: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {}
    for (const k of keys) {
      out[k] = this.get(k, fallbacks?.[k])
    }
    return out
  }

  /**
   * Batch set via {@link set}.
   *
   * @param values - Dot keys → values.
   */
  public setMany(values: Record<string, unknown>): void {
    this.set(values)
  }

  /**
   * Prepend to an array at `key`, creating `[value]` when missing.
   *
   * @param key - Dot-notation key.
   * @param value - Entry to unshift.
   */
  public prepend(key: string, value: unknown): void {
    const current = this.getInternal(key)
    if (current === undefined) {
      this.set(key, [value])
      return
    }
    if (Array.isArray(current)) {
      this.set(key, [value, ...current])
      return
    }
    this.set(key, [value, current])
  }

  /**
   * Append to an array at `key`, creating `[value]` when missing.
   *
   * @param key - Dot-notation key.
   * @param value - Entry to push.
   */
  public push(key: string, value: unknown): void {
    const current = this.getInternal(key)
    if (current === undefined) {
      this.set(key, [value])
      return
    }
    if (Array.isArray(current)) {
      this.set(key, [...current, value])
      return
    }
    this.set(key, [current, value])
  }

  /**
   * Deep-merge `items` into the given top-level namespace.
   *
   * @param namespace - Top-level key (e.g. `app`).
   * @param items - Partial config to merge.
   */
  public merge(namespace: string, items: Record<string, unknown>): void {
    const existing = this.items.get(namespace)
    const base = isPlainObject(existing) ? existing : {}
    const merged = this.deepMerge(base, items)
    this.items.set(namespace, merged)
    this.keyCache.clear()
  }

  private allRaw(): Record<string, unknown> {
    const out: Record<string, unknown> = {}
    for (const [k, v] of this.items.entries()) {
      out[k] = v
    }
    return out
  }

  private parseDotKey(key: string): string[] {
    if (this.keyCache.has(key)) {
      return this.keyCache.get(key)!
    }
    const parts = key.split('.').filter((p) => p.length > 0)
    this.keyCache.set(key, parts)
    return parts
  }

  private setOne(key: string, value: unknown): void {
    const parts = key.split('.').filter((p) => p.length > 0)
    if (parts.length === 0) return
    const rootKey = parts[0]!
    if (parts.length === 1) {
      this.items.set(rootKey, value)
      this.keyCache.clear()
      return
    }
    const root = this.items.get(rootKey)
    const base: Record<string, unknown> = isPlainObject(root) ? { ...root } : {}
    this.setAtPath(base, parts.slice(1), value)
    this.items.set(rootKey, base)
    this.keyCache.clear()
  }

  private setAtPath(target: Record<string, unknown>, parts: string[], value: unknown): void {
    if (parts.length === 0) return
    if (parts.length === 1) {
      target[parts[0]!] = value
      return
    }
    const head = parts[0]!
    const next = target[head]
    const child: Record<string, unknown> = isPlainObject(next) ? { ...next } : {}
    target[head] = child
    this.setAtPath(child, parts.slice(1), value)
  }

  private navigate(root: unknown, parts: string[]): unknown {
    let cur: unknown = root
    for (const part of parts) {
      if (!isPlainObject(cur)) return undefined
      cur = cur[part]
      if (cur === undefined) return undefined
    }
    return cur
  }

  private getInternal(key: string): unknown {
    const parts = key.split('.').filter((p) => p.length > 0)
    if (parts.length === 0) return undefined
    const rootKey = parts[0]!
    const root = this.items.get(rootKey)
    if (parts.length === 1) return root
    return this.navigate(root, parts.slice(1))
  }

  private getWildcard(parts: string[]): unknown[] | undefined {
    const rootKey = parts[0]
    if (rootKey === undefined || rootKey === '*') return undefined
    const root = this.items.get(rootKey)
    if (root === undefined) return undefined
    const rest = parts.slice(1)
    if (rest.length === 0) {
      return [root]
    }
    return this.walkWildcard(root, rest)
  }

  private walkWildcard(cur: unknown, parts: string[]): unknown[] {
    if (parts.length === 0) {
      return cur === undefined ? [] : [cur]
    }
    const [head, ...tail] = parts
    if (head === '*') {
      if (!isPlainObject(cur)) return []
      if (tail.length === 0) {
        return Object.values(cur)
      }
      const acc: unknown[] = []
      for (const v of Object.values(cur)) {
        acc.push(...this.walkWildcard(v, tail))
      }
      return acc
    }
    if (!isPlainObject(cur)) return []
    if (head === undefined) return []
    const next = cur[head]
    if (next === undefined) return []
    return this.walkWildcard(next, tail)
  }

  private deepMerge(
    a: Record<string, unknown>,
    b: Record<string, unknown>,
  ): Record<string, unknown> {
    const out: Record<string, unknown> = { ...a }
    for (const [k, v] of Object.entries(b)) {
      const av = out[k]
      out[k] = isPlainObject(av) && isPlainObject(v) ? this.deepMerge(av, v) : v
    }
    return out
  }
}
