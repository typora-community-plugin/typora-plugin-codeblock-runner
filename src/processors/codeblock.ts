import { CodeblockPostProcessor } from '@typora-community-plugin/core'
import { getLanguageId, isLanguageEnabled } from '../backend'
import { hashCode } from '../backend/hash'
import { mountRunner } from './mount'
import { getRunnerForPre, RUNNER_CONTAINER_CLASS, RUNNER_CONTAINER_SELECTOR } from '../runner-registry'
import { ICON_PATHS } from '../components/Icon'
import { getT } from '../i18n-bridge'
import { editor } from 'typora'

const LANGS = [
  'js', 'javascript', 'node', 'nodejs', 'ts', 'typescript', 'html',
  'v', 'vlang', 'crystal', 'cr', 'hs', 'haskell', 'kotlin', 'kt', 'rust', 'rs',
  'go', 'golang', 'java',
  'bash', 'sh', 'c', 'cpp', 'cc', 'csharp', 'cs',
  'python', 'py', 'python2', 'py2', 'powershell', 'ps1', 'pwsh',
  'php', 'lua', 'r', 'swift', 'dart', 'julia', 'jl', 'zig',
]
const MOUNT_ATTR = 'data-cbr-mounted'
const RUN_BUTTON_CLASS = 'typ-cbr-run-btn'

// The run button lives in the codeblock's core .typ-buttons group (see below), so
// its label is inline markup: reuse the shared play glyph from components/Icon.
const PLAY_ICON =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
  `<path d="${ICON_PATHS.play}"/></svg>`

const cleanups = new WeakMap<HTMLElement, () => void>()

function resolveCodeblock(el: HTMLElement): HTMLElement | null {
  if (el.matches?.('pre.md-fences')) return el
  return el.querySelector?.('pre.md-fences') ?? null
}

type FencesApi = {
  queue: Record<string, { getWrapperElement?: () => Element } | undefined>
  getValue: (cid: string) => string
}

function getFencesApi(): FencesApi | undefined {
  if (typeof editor === 'undefined' || !editor) return undefined
  const fences = (editor as unknown as { fences?: FencesApi }).fences
  return fences && typeof fences.getValue === 'function' ? fences : undefined
}

/**
 * Resolve the Typora content id (cid) of the code block that owns this <pre>.
 * `<pre cid="...">` is used when present; otherwise the cid is looked up by
 * matching `editor.fences.queue`, which maps cid -> CodeMirror instance.
 */
function resolveCid(pre: HTMLElement): string | null {
  const attr = pre.getAttribute('cid')
  if (attr) return attr

  const wrapper = pre.querySelector('.CodeMirror')
  if (!wrapper) return null

  const fences = getFencesApi()
  if (!fences?.queue) return null

  for (const cid in fences.queue) {
    const cm = fences.queue[cid]
    if (cm && typeof cm.getWrapperElement === 'function' && cm.getWrapperElement() === wrapper) {
      return cid
    }
  }
  return null
}

function readFenceValue(cid: string): string | null {
  const fences = getFencesApi()
  if (!fences) return null
  try {
    const value = fences.getValue(cid)
    // `''` is a legitimate value for an empty block: returning it as-is stops
    // the DOM fallbacks below from scraping the language label / line numbers,
    // which would be evaluated as (invalid) code.
    return typeof value === 'string' ? value : null
  } catch {
    return null
  }
}

/**
 * Editor mode renders one CodeMirror element per line and encodes line breaks as
 * <br>, which textContent drops: concatenating textContent therefore yields
 * syntactically invalid code. Always prefer the authoritative fences API.
 */
function readCode(pre: HTMLElement): string {
  // 1) Authoritative: Typora's own fences API (exact source, accurate newlines).
  const cid = resolveCid(pre)
  if (cid) {
    const value = readFenceValue(cid)
    if (value !== null) return value.trim()
  }

  // 2) Editor-mode fallback: the CodeMirror instance is attached to its wrapper.
  const cmHost = pre.querySelector('.CodeMirror') as (HTMLElement & { CodeMirror?: { getValue?: () => string } }) | null
  const cm = cmHost?.CodeMirror
  if (cm && typeof cm.getValue === 'function') {
    const value = cm.getValue()
    if (value.trim()) return value.trim()
  }

  // 3) Editor-mode fallback: re-join one rendered line per element.
  const lines = pre.querySelectorAll('.CodeMirror-line')
  if (lines.length > 0) {
    const parts: string[] = []
    for (let i = 0; i < lines.length; i++) {
      parts.push(lines[i].textContent ?? '')
    }
    const text = parts.join('\n')
    if (text.trim()) return text.trim()
  }

  // 4) Preview mode: the rendered <code> holds the plain source.
  const codeEl = pre.querySelector('code')
  const codeText = codeEl?.textContent ?? ''
  if (codeText.trim()) return codeText.trim()

  // 5) Last resort: remove our own runner UI (it lives inside <pre>) before reading.
  const clone = pre.cloneNode(true) as HTMLElement
  clone.querySelector('.' + RUNNER_CONTAINER_CLASS)?.remove()
  return (clone.textContent ?? '').trim()
}

const processor = CodeblockPostProcessor.from({
  lang: LANGS,
  exportPreview: false,

  // Run button, rendered by the core into `.typ-buttons` (top-right on hover).
  // `title`/`text` are getters so they resolve after i18n is initialised rather than
  // at module-eval time; the onClick just drives the runner already mounted on the pre.
  button: {
    get text() { return PLAY_ICON },
    get title() { return getT()('run') },
    className: RUN_BUTTON_CLASS,
    onclick: (_event, { codeblock }) => getRunnerForPre(codeblock)?.run(),
  },

  process(this: CodeblockPostProcessor, el: HTMLElement) {
    const pre = resolveCodeblock(el)
    if (!pre) return

    // must read source before inserting UI, otherwise pre.textContent includes runner UI
    const code = readCode(pre)
    const lang = (pre.getAttribute('lang') ?? '').toLowerCase()

    // Overriding `process` bypasses the base implementation, which is what renders
    // `this.button`; sync it explicitly so only enabled languages expose a run button.
    syncRunButton(pre, isLanguageEnabled(lang))

    const hash = hashCode(code)

    const existing = pre.querySelector(RUNNER_CONTAINER_SELECTOR) as HTMLElement | null
    // idempotent: skip only if mounted with same code hash AND the container still has rendered UI
    if (existing && existing.firstElementChild && pre.getAttribute(MOUNT_ATTR) === hash) return

    if (existing) {
      cleanups.get(existing)?.()
      cleanups.delete(existing)
      existing.remove()
    }

    const container = document.createElement('div')
    container.className = RUNNER_CONTAINER_CLASS
    pre.appendChild(container)

    try {
      const cleanup = mountRunner(container, lang, code, () => readCode(pre))
      cleanups.set(container, cleanup)
      // only mark as mounted after a successful mount
      pre.setAttribute(MOUNT_ATTR, hash)
    } catch (error) {
      container.remove()
      console.error('[codeblock-runner] failed to mount runner UI', error)
    }
  },
})

/**
 * Show the run button for enabled languages and remove it (plus any now-empty
 * `.typ-buttons` group we created) for disabled ones.
 */
function syncRunButton(pre: HTMLElement, enabled: boolean): void {
  if (enabled) {
    if (processor.button) processor.renderButton(pre, processor.button)
    return
  }

  const buttons = pre.querySelectorAll('.' + RUN_BUTTON_CLASS)
  for (let i = 0; i < buttons.length; i++) buttons[i].remove()

  const group = pre.querySelector('.typ-buttons')
  if (group && group.childElementCount === 0) group.remove()
}

/**
 * Re-evaluate run buttons on every mounted code block. Called when language
 * settings change so the buttons appear/disappear without a full re-render.
 */
export function refreshRunButtons(): void {
  // Editor mode only (the core's selector requires `.CodeMirror`), so preview
  // blocks never gain a button during a settings-driven refresh.
  const fences = document.querySelectorAll('pre.md-fences:has(.CodeMirror)')
  for (let i = 0; i < fences.length; i++) {
    const pre = fences[i] as HTMLElement
    const lang = (pre.getAttribute('lang') ?? '').toLowerCase()
    if (!getLanguageId(lang)) continue
    syncRunButton(pre, isLanguageEnabled(lang))
  }
}

export default processor
