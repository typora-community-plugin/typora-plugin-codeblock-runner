import type { LogLevel } from './style-class'

/**
 * A single console/output entry. Structured rather than pre-rendered HTML so it
 * survives the localStorage cache unchanged (the log level and source line are
 * data, not markup) and so text is escaped by the renderer.
 */
export interface Message {
  /** Already-formatted text of the logged values. */
  text: string
  /** Present for `console.*` / emitted logs; drives the log-level styling. */
  level?: LogLevel
  /** 1-based source line in the user's code block (console messages only). */
  line?: number
}
export type Stdio = ReturnType<typeof createStdio>

// Absolute URL of this module's bundled chunk, query/hash removed.
const SELF_URL = import.meta.url.replace(/[?#].*$/, '')
// Directory the plugin is bundled into. The build code-splits into many chunks
// (js-*.js, mount-*.js, store-*.js …) that all live beside this module, so any
// frame resolving inside it is plugin-internal and must be dropped from stacks.
const SELF_DIR = SELF_URL.slice(0, SELF_URL.lastIndexOf('/') + 1)
const URL_RE = /[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^\s)]+/g
const LOCATION_RE = /:\d+:\d+$/
// The plugin core (host-provided) bundles to .../@typora-community-plugin/core/dist/core.js.
// Frames from its codeblock button wrapper (`onclick` -> user code) must not leak
// into user error stacks.
const CORE_URL_RE = /@typora-community-plugin\/core/

// js.ts evaluates user code with this sourceURL so its frames read as
// `codeblock.js:line:col` and survive the internal-frame filter below.
export const USER_SOURCE_URL = 'codeblock.js'
// V8 compiles `new AsyncFunction(...)` with a two-line wrapper, so the snippet's own
// frames are reported two lines past their position in the user's code block.
const FUNCTION_WRAPPER_LINES = 2
const USER_FRAME_RE = new RegExp(`${USER_SOURCE_URL.replace(/\./g, '\\.')}:(\\d+)`, 'g')
// Captures the user-code frame (with column) so its line can be recovered.
const USER_LINE_RE = new RegExp(`${USER_SOURCE_URL.replace(/\./g, '\\.')}:(\\d+):\\d+`)

function isInternalFrame(frame: string): boolean {
  const urls = frame.match(URL_RE)
  if (!urls) return false
  return urls.some(raw => {
    const url = raw.replace(/[?#].*$/, '').replace(LOCATION_RE, '')
    // typora:// covers Typora's own bundle (frame.js); SELF_DIR covers every
    // chunk of this plugin, not just the one this module happens to live in;
    // CORE_URL_RE covers the plugin core's button onclick wrapper.
    return url.startsWith('typora://')
      || CORE_URL_RE.test(url)
      || url === SELF_URL
      || (SELF_DIR.length > 1 && url.startsWith(SELF_DIR))
  })
}

function shiftUserLine(frame: string): string {
  return frame.replace(USER_FRAME_RE, (_match, line: string) => {
    const shifted = Number(line) - FUNCTION_WRAPPER_LINES
    return `${USER_SOURCE_URL}:${shifted > 0 ? shifted : 1}`
  })
}

// Keeps the `Name: message` header and any frame that still points at user code.
function formatStack(stack: string): string {
  const [head, ...frames] = stack.split('\n')
  return [head, ...frames.filter(frame => !isInternalFrame(frame)).map(shiftUserLine)].join('\n')
}

/**
 * Line in the user's code block where the current call originated, shifted to
 * compensate for the AsyncFunction wrapper. Drives the DevTools-style source line
 * shown on the right of each console message.
 */
function callerLine(): number | undefined {
  const stack = new Error().stack
  if (!stack) return undefined
  for (const frame of stack.split('\n')) {
    const match = USER_LINE_RE.exec(frame)
    if (match) {
      const line = Number(match[1]) - FUNCTION_WRAPPER_LINES
      return line > 0 ? line : 1
    }
  }
  return undefined
}

function formatValue(value: unknown): string {
  if (typeof value === 'string') return value
  if (value instanceof Error) {
    return value.stack ? formatStack(value.stack) : `${value.name}: ${value.message}`
  }
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'object') {
    try {
      const json = JSON.stringify(value)
      return json === undefined ? String(value) : json
    } catch {
      return String(value)
    }
  }
  return String(value)
}

export function createStdio() {
  let outputs: Message[] = []
  let subscribers: ((outputs: Message[]) => void)[] = []
  let cleanups: (() => void)[] = []
  const viewEl = document.createElement('div')

  const update = (setter: (prev: Message[]) => Message[]) => {
    outputs = setter(outputs)
    for (const subscriber of subscribers) subscriber(outputs)
  }
  const set = (value: Message[]) => update(() => value)
  const toMessage = (...data: unknown[]): Message => ({ text: data.map(formatValue).join(' ') })
  const write = (...data: unknown[]) => update(prev => [...prev, toMessage(...data)])
  const stderr = (...data: unknown[]) => update(prev => [...prev, toMessage(...data)])
  const clear = () => {
    for (const cleanup of cleanups.splice(0)) {
      try {
        cleanup()
      } catch (e) {
        console.error('[codeblock-runner] cleanup failed', e)
      }
    }
    set([])
    viewEl.replaceChildren()
  }
  const subscribe = (subscriber: (outputs: Message[]) => void) => {
    subscribers.push(subscriber)
    return () => {
      subscribers = subscribers.filter(s => s !== subscriber)
    }
  }
  /** Registers teardown that runs on the next `clear()` (or language restart). */
  const onClear = (cleanup: () => void) => {
    cleanups.push(cleanup)
  }

  return {
    viewEl,
    getOutputs: () => outputs,
    update,
    set,
    write,
    stdout: write,
    stderr,
    clear,
    onClear,
    subscribe,
  }
}

export function emitLog(stdio: Stdio, level: LogLevel, ...data: unknown[]): void {
  const text = data.map(formatValue).join(' ')
  stdio.update(prev => [...prev, { text, level, line: callerLine() }])
}

/**
 * Write remote output (playground responses) as one console row per line, since
 * those APIs return a single blob and Term renders one `.typ-cbr-line` per
 * message. An optional level tints every line (e.g. a compiler's stderr).
 */
export function writeLines(stdio: Stdio, text: string, level?: LogLevel): void {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop()
  for (const line of lines) {
    if (level) emitLog(stdio, level, line)
    else stdio.stdout(line)
  }
}

export interface WrappedConsole {
  log: (...data: unknown[]) => void
  info: (...data: unknown[]) => void
  debug: (...data: unknown[]) => void
  warn: (...data: unknown[]) => void
  error: (...data: unknown[]) => void
}

/** A `console` whose output is redirected into the given stdio view. */
export function createConsole(stdio: Stdio): WrappedConsole {
  const make = (level: LogLevel) => (...data: unknown[]) => emitLog(stdio, level, ...data)
  return {
    log: make('log'),
    info: make('info'),
    debug: make('debug'),
    warn: make('warn'),
    error: make('error'),
  }
}
