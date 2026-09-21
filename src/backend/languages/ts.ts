import tsLocal from './ts-local'
import { makeOneCompilerBackend, ONECOMPILER_RUNTIME } from '../providers/onecompiler'
import { makeRuntimeBackend, RUNTIME_LOCAL, RUNTIME_ONECOMPILER } from '../runtime-dispatch'

// `ts` offers two runtimes: Sucrase transpile + local run (local, default) and
// OneCompiler's TypeScript playground (remote).
export const TS_RUNTIME_LOCAL = RUNTIME_LOCAL
export const TS_RUNTIME_ONECOMPILER = RUNTIME_ONECOMPILER

export const TS_RUNTIME_ORDER = [TS_RUNTIME_LOCAL, TS_RUNTIME_ONECOMPILER]

export const TS_RUNTIME_LABELS: Record<string, string> = {
  [TS_RUNTIME_LOCAL]: 'Browser (Local)',
  [TS_RUNTIME_ONECOMPILER]: ONECOMPILER_RUNTIME,
}

export default makeRuntimeBackend({
  languageId: 'ts',
  order: TS_RUNTIME_ORDER,
  labels: TS_RUNTIME_LABELS,
  backends: {
    [TS_RUNTIME_LOCAL]: tsLocal,
    [TS_RUNTIME_ONECOMPILER]: makeOneCompilerBackend({ language: 'typescript', file: 'main.ts' }),
  },
})
