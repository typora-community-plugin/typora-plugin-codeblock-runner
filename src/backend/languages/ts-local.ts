import type { Backend } from '../index'
import { emitLog } from '../store'
import js from './js-local'

// Sucrase is code-split into its own chunk: it is only fetched the first time a
// TypeScript block runs, keeping the initial main.js small.
let sucrase: typeof import('sucrase') | undefined

async function loadSucrase(): Promise<typeof import('sucrase')> {
  sucrase ??= await import('sucrase')
  return sucrase
}

const ts: Backend = async (code, stdio) => {
  let compiled: string
  try {
    const { transform } = await loadSucrase()
    compiled = transform(code, { transforms: ['typescript'], filePath: 'codeblock.ts' }).code
  } catch (e) {
    emitLog(stdio, 'error', e)
    return
  }
  await js(compiled, stdio)
}

ts.loading = false
ts.runtime = 'Browser (Local)'

export default ts
