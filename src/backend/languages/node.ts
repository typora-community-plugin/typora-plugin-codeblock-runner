import nodeLocal from './node-local'
import { makeOneCompilerBackend, ONECOMPILER_RUNTIME } from '../providers/onecompiler'
import { makeRuntimeBackend, RUNTIME_LOCAL, RUNTIME_ONECOMPILER } from '../runtime-dispatch'

// `node` offers two runtimes: the in-process Node VM (local, default) and
// OneCompiler's NodeJS playground (remote).
export const NODE_RUNTIME_LOCAL = RUNTIME_LOCAL
export const NODE_RUNTIME_ONECOMPILER = RUNTIME_ONECOMPILER

export const NODE_RUNTIME_ORDER = [NODE_RUNTIME_LOCAL, NODE_RUNTIME_ONECOMPILER]

export const NODE_RUNTIME_LABELS: Record<string, string> = {
  [NODE_RUNTIME_LOCAL]: 'Node.js VM (Local)',
  [NODE_RUNTIME_ONECOMPILER]: ONECOMPILER_RUNTIME,
}

export default makeRuntimeBackend({
  languageId: 'node',
  order: NODE_RUNTIME_ORDER,
  labels: NODE_RUNTIME_LABELS,
  backends: {
    [NODE_RUNTIME_LOCAL]: nodeLocal,
    [NODE_RUNTIME_ONECOMPILER]: makeOneCompilerBackend({ language: 'nodejs', file: 'main.js' }),
  },
})
