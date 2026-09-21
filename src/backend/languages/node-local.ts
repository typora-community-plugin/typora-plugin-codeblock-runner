import type { Backend } from '../index'
import { createConsole, emitLog, USER_SOURCE_URL } from '../store'
import { injectTimeout } from './js-guard'

const TIMEOUT_MS = 5000

type ReqNode = (id: string) => unknown

// Typora exposes `reqnode` in the renderer as a bridge to Node's `require`, but
// only on Windows and Linux: on macOS there is no Node at all, which Typora
// advertises through `File.isNode === false` (the same flag the plugin core
// checks before touching `reqnode`). Gate on it so `node` blocks report a clear
// error on macOS instead of crashing on an undefined bridge.
function getReqNode(): ReqNode | undefined {
  const g = globalThis as unknown as { reqnode?: unknown; File?: { isNode?: boolean } }
  if (g.File?.isNode === false) return undefined
  return typeof g.reqnode === 'function' ? (g.reqnode as ReqNode) : undefined
}

const PARAMS = ['console', 'require', 'module', 'exports', '__filename', '__dirname']

// Two wrapper lines precede the user's code so a frame reported at
// `codeblock.js:N` maps to user line `N - 2`, matching the AsyncFunction path and
// store.ts's FUNCTION_WRAPPER_LINES. Keep the two in sync.
// Note: no trailing `()` — `vm.Script.runInThisContext` must yield the function
// itself so the caller can pass `require`/`module`/… as arguments.
const WRAPPER_HEAD = `(async function (${PARAMS.join(', ')}) {\n\n`
const WRAPPER_TAIL = '\n})'

function makeAsyncFunction(code: string): (...args: unknown[]) => Promise<unknown> {
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as new (
    ...args: string[]
  ) => (...args: unknown[]) => Promise<unknown>
  return new AsyncFunction(...PARAMS, `${code}\n//# sourceURL=${USER_SOURCE_URL}`)
}

type VmApi = {
  Script: new (code: string, options?: { filename?: string }) => {
    runInThisContext: () => (...args: unknown[]) => Promise<unknown>
  }
}

/**
 * Compile with Node's `vm` when available. `runInThisContext` keeps the compiled
 * function in the renderer's realm, so Error/Promise prototypes stay identical to
 * the host's and stack formatting keeps working. Returns undefined when `vm` is
 * not reachable through `reqnode`, letting the caller fall back to AsyncFunction;
 * genuine syntax errors are re-thrown so they are reported as such.
 */
function compileWithVm(code: string, require: ReqNode): ((...args: unknown[]) => Promise<unknown>) | undefined {
  let vm: VmApi
  try {
    vm = require('vm') as VmApi
  } catch {
    return undefined
  }
  if (!vm?.Script) return undefined

  const script = new vm.Script(WRAPPER_HEAD + code + WRAPPER_TAIL, { filename: USER_SOURCE_URL })
  return script.runInThisContext()
}

const node: Backend = async (code, stdio) => {
  const reqnode = getReqNode()
  if (!reqnode) {
    emitLog(stdio, 'error', new Error('Node.js is unavailable (`reqnode` missing), `node` blocks cannot run on macOS.'))
    return
  }

  const require: ReqNode = id => reqnode(id)
  const module = { exports: {} as unknown }
  const args = [createConsole(stdio), require, module, module.exports, USER_SOURCE_URL, '.']
  const guarded = injectTimeout(code, Date.now() + TIMEOUT_MS)
  let timer: ReturnType<typeof setTimeout> | undefined

  try {
    const run = compileWithVm(guarded, require) ?? makeAsyncFunction(guarded)
    await Promise.race([
      run(...args),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error('Timeout')), TIMEOUT_MS)
      }),
    ])
  } catch (e) {
    emitLog(stdio, 'error', e)
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
}

node.loading = false
node.runtime = 'Node.js VM (Local)'

export default node
