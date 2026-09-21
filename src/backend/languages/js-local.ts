import type { Backend } from '../index'
import { createConsole, emitLog, USER_SOURCE_URL } from '../store'
import { BLOCKED_GLOBALS, injectTimeout } from './js-guard'

const TIMEOUT_MS = 5000

// Names the evaluated snippet so its own stack frames read as `codeblock.js:line:col`
// instead of `eval at js (…/main.js:line:col)`. Without this the only frame pointing
// at user code would be indistinguishable from the plugin-internal frames we strip.
const js: Backend = async (code, stdio) => {
  const wrapped = createConsole(stdio)
  const deadline = Date.now() + TIMEOUT_MS
  const guarded = injectTimeout(code, deadline)
  const blocked = BLOCKED_GLOBALS.map(() => undefined)
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as new (
      ...args: string[]
    ) => (...args: unknown[]) => Promise<unknown>
    const fn = new AsyncFunction(
      'console',
      ...BLOCKED_GLOBALS,
      `'use strict';${guarded}\n//# sourceURL=${USER_SOURCE_URL}`,
    )
    await Promise.race([
      fn(wrapped, ...blocked),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error('Timeout')), TIMEOUT_MS)
      }),
    ])
  } catch (e) {
    if (e instanceof SyntaxError) {
      // Diagnostic only (devtools): an extraction problem shows up here as
      // concatenated or duplicated source text.
      console.error('[codeblock-runner] invalid code received:', JSON.stringify(code.slice(0, 300)))
    }
    emitLog(stdio, 'error', e)
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
}

js.loading = false
js.runtime = 'Browser (Local)'

export default js
