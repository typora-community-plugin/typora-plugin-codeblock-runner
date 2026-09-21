import type { Backend } from '../index'
import { getRuntime } from '../../settings-bridge'
import type { Stdio } from '../store'

// The inline path injects markup into a closed shadow root: scripts inserted via
// innerHTML never execute, and styles stay scoped. The sandbox path runs the
// markup in a sandboxed iframe instead, which does execute scripts — isolated from
// the note because `allow-same-origin` is intentionally absent (opaque origin).
const SANDBOX_TOKENS = 'allow-scripts allow-modals allow-forms allow-pointer-lock'

// The framed document posts its height so the parent can size the iframe to fit.
const HEIGHT_MESSAGE = 'typ-cbr-html-height'
const RESIZE_REPORTER =
  '<script>(function(){var send=function(){try{parent.postMessage(' +
  `{type:"${HEIGHT_MESSAGE}",height:document.documentElement.scrollHeight}` +
  ',"*")}catch(e){}};addEventListener("load",send);' +
  'new ResizeObserver(send).observe(document.documentElement);send()})()</script>'

function renderInline(viewEl: HTMLElement, code: string): void {
  const host = document.createElement('div')
  host.className = 'typ-cbr-html'
  const shadow = host.attachShadow({ mode: 'closed' })
  const inner = document.createElement('div')
  inner.innerHTML = code
  shadow.appendChild(inner)
  viewEl.appendChild(host)
}

function renderSandboxed(stdio: Stdio, code: string): void {
  const host = document.createElement('div')
  host.className = 'typ-cbr-html typ-cbr-html--sandboxed'

  const frame = document.createElement('iframe')
  frame.className = 'typ-cbr-html__frame'
  frame.setAttribute('sandbox', SANDBOX_TOKENS)
  frame.setAttribute('srcdoc', code + RESIZE_REPORTER)

  const onMessage = (event: MessageEvent) => {
    if (event.source !== frame.contentWindow) return
    const data = event.data as { type?: string; height?: number } | null
    if (data?.type === HEIGHT_MESSAGE && typeof data.height === 'number') {
      frame.style.height = `${data.height}px`
    }
  }
  window.addEventListener('message', onMessage)
  stdio.onClear(() => window.removeEventListener('message', onMessage))

  host.appendChild(frame)
  stdio.viewEl.appendChild(host)
}

const html: Backend = async (code, stdio) => {
  stdio.clear()
  if (getRuntime('html') === HTML_RUNTIME_IFRAME) {
    renderSandboxed(stdio, code)
  } else {
    renderInline(stdio.viewEl, code)
  }
}

export const HTML_RUNTIME_BROWSER = 'browser'
export const HTML_RUNTIME_IFRAME = 'iframe'

export const HTML_RUNTIME_LABELS: Record<string, string> = {
  [HTML_RUNTIME_BROWSER]: 'Browser (Local)',
  [HTML_RUNTIME_IFRAME]: 'Sandbox (Local)',
}

html.loading = false
// Runtime label mirrors the settings' runtime selection, which the settings tab
// exposes as a select between these two modes.
Object.defineProperty(html, 'runtime', {
  get: () => HTML_RUNTIME_LABELS[getRuntime('html') ?? HTML_RUNTIME_BROWSER],
})

export default html
