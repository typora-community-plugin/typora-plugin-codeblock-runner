import { clearAllCaches } from './backend/cache'
import { clearAllRunners, getRunnerForPre } from './runner-registry'

const FENCE_SELECTOR = 'pre.md-fences'
const FOCUSED_CM_SELECTOR = 'pre.md-fences .CodeMirror-focused'

let lastActivePre: HTMLElement | null = null
let trackerInstalled = false

function onFocusIn(event: FocusEvent): void {
  const target = event.target as HTMLElement | null
  const pre = target?.closest?.(FENCE_SELECTOR)
  if (pre instanceof HTMLElement) lastActivePre = pre
}

/** Idempotent: safe to call on every plugin load. */
export function installActiveBlockTracker(): void {
  if (trackerInstalled) return
  trackerInstalled = true
  document.addEventListener('focusin', onFocusIn, true)
}

export function findActivePre(): HTMLElement | null {
  const active = document.activeElement as HTMLElement | null
  const fromActive = active?.closest?.(FENCE_SELECTOR)
  if (fromActive instanceof HTMLElement) return fromActive

  if (lastActivePre && lastActivePre.isConnected) return lastActivePre

  const focused = document.querySelector(FOCUSED_CM_SELECTOR)
  const fromFocused = focused?.closest(FENCE_SELECTOR)
  if (fromFocused instanceof HTMLElement) return fromFocused

  return null
}

export function runActiveCodeblock(): boolean {
  const pre = findActivePre()
  const handle = pre ? getRunnerForPre(pre) : undefined
  if (!handle) {
    console.debug('[codeblock-runner] no active code block runner found')
    return false
  }
  handle.run()
  return true
}

export function clearAllOutputs(): number {
  const count = clearAllRunners()
  clearAllCaches()
  return count
}
