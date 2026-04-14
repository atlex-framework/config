/**
 * Loads configuration namespaces (e.g. from the `config/` directory).
 */
export interface ConfigLoaderInterface {
  /**
   * @returns Map of namespace → exported config object.
   */
  loadSync(): Record<string, unknown>
}
