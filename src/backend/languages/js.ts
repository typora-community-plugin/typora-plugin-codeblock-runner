import jsLocal from './js-local'
import { makeOneCompilerBackend, ONECOMPILER_RUNTIME } from '../providers/onecompiler'
import { makeRuntimeBackend, RUNTIME_LOCAL, RUNTIME_ONECOMPILER } from '../runtime-dispatch'

// `js` offers two runtimes: the in-renderer engine (local, default) and
// OneCompiler's JavaScript playground (remote).
export const JS_RUNTIME_LOCAL = RUNTIME_LOCAL
export const JS_RUNTIME_ONECOMPILER = RUNTIME_ONECOMPILER

export const JS_RUNTIME_ORDER = [JS_RUNTIME_LOCAL, JS_RUNTIME_ONECOMPILER]

export const JS_RUNTIME_LABELS: Record<string, string> = {
  [JS_RUNTIME_LOCAL]: 'Browser (Local)',
  [JS_RUNTIME_ONECOMPILER]: ONECOMPILER_RUNTIME,
}

export default makeRuntimeBackend({
  languageId: 'js',
  order: JS_RUNTIME_ORDER,
  labels: JS_RUNTIME_LABELS,
  backends: {
    [JS_RUNTIME_LOCAL]: jsLocal,
    [JS_RUNTIME_ONECOMPILER]: makeOneCompilerBackend({ language: 'javascript', file: 'main.js' }),
  },
})
