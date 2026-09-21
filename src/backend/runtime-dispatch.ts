import type { Backend } from './index'
import { getRuntime } from '../settings-bridge'

// Runtime ids shared by the languages that offer both an in-Typora and an
// OneCompiler runtime (js, ts, node).
export const RUNTIME_LOCAL = 'local'
export const RUNTIME_ONECOMPILER = 'onecompiler'

export interface RuntimeBackendOptions {
  /** Key under `runtimes` in the plugin config, e.g. `js`. */
  languageId: string
  /** Runtime ids in display order; the first is the default. */
  order: string[]
  /** Output-window title per runtime id. */
  labels: Record<string, string>
  /** Backend per runtime id. */
  backends: Record<string, Backend>
}

/**
 * Dispatch to a per-runtime backend according to the `runtimes.<id>` setting.
 * Unknown/unset values fall back to the first entry in `order`.
 */
export function makeRuntimeBackend(options: RuntimeBackendOptions): Backend {
  const resolve = (): string => {
    const selected = getRuntime(options.languageId)
    return selected && options.backends[selected] ? selected : options.order[0]
  }

  const backend: Backend = (code, stdio) => options.backends[resolve()](code, stdio)
  backend.loading = false
  Object.defineProperty(backend, 'runtime', { get: () => options.labels[resolve()] })
  return backend
}
