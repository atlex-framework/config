type PrimitiveTarget = 'string' | 'number' | 'boolean'

/**
 * Handles environment variable type casting with conventional `.env` rules.
 */
export class EnvCaster {
  /**
   * Cast a string value to its proper type.
   *
   * @param value - Raw string from `process.env`.
   * @returns Cast scalar or empty string / null per casting rules.
   */
  public static cast(value: string): string | number | boolean | null {
    const lower = value.toLowerCase().trim()

    if (lower === 'true') return true
    if (lower === 'false') return false
    if (lower === 'null') return null
    if (value === '' || lower === '(empty)') return ''

    if (!Number.isNaN(Number(value)) && value !== '') {
      if (/^0\d+$/.test(value) && value !== '0') {
        return value
      }
      return Number(value)
    }

    return value
  }

  /**
   * Cast a string to a target primitive type (used when `env()` has a typed fallback).
   *
   * @param value - Raw env string.
   * @param targetType - Primitive name or constructor.
   * @returns Value coerced to the target type.
   */
  public static castTo(
    value: string,
    targetType: PrimitiveTarget | BooleanConstructor | NumberConstructor | StringConstructor,
  ): string | number | boolean {
    if (typeof targetType === 'function') {
      if (targetType === Boolean) {
        return this.cast(value) === true
      }
      if (targetType === Number) {
        const num = Number(value)
        return Number.isNaN(num) ? 0 : num
      }
      if (targetType === String) {
        return value
      }
      return value
    }

    switch (targetType) {
      case 'boolean':
        return this.cast(value) === true
      case 'number': {
        const num = Number(value)
        return Number.isNaN(num) ? 0 : num
      }
      case 'string':
      default:
        return value
    }
  }
}
