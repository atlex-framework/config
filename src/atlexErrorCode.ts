/**
 * Read an `AtlexError`-style `code` field without relying on `instanceof` across package boundaries.
 *
 * @param err - Caught value.
 * @returns The `code` string when present.
 */
export function readAtlexErrorCode(err: unknown): string | undefined {
  if (typeof err !== 'object' || err === null || !('code' in err)) {
    return undefined
  }
  const c = (err as { code: unknown }).code
  return typeof c === 'string' ? c : undefined
}
