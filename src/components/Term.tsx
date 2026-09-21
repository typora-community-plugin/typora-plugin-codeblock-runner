import { For, Show } from 'solid-js'
import { LOG_LEVEL_CLASS } from '../backend/style-class'
import type { Message } from '../backend/store'

const ANSI_SGR_RE = /\u001b\[([0-9;]*)m/g

const FG = ['#000000', '#cd3131', '#0dbc79', '#e5e510', '#2472c8', '#bc3fbc', '#11a8cd', '#e5e5e5']
const FG_BRIGHT = ['#666666', '#f14c4c', '#23d18b', '#f5f543', '#3b8eea', '#d670d6', '#29b8db', '#ffffff']
const BG = ['#000000', '#cd3131', '#0dbc79', '#e5e510', '#2472c8', '#bc3fbc', '#11a8cd', '#e5e5e5']
const BG_BRIGHT = ['#666666', '#f14c4c', '#23d18b', '#f5f543', '#3b8eea', '#d670d6', '#29b8db', '#ffffff']

interface AnsiState {
  bold: boolean
  italic: boolean
  underline: boolean
  fg: string | null
  bg: string | null
}

interface AnsiSpan {
  text: string
  style: string
}

function createState(): AnsiState {
  return { bold: false, italic: false, underline: false, fg: null, bg: null }
}

function applySgr(state: AnsiState, param: number): void {
  if (param === 0) {
    state.bold = false
    state.italic = false
    state.underline = false
    state.fg = null
    state.bg = null
    return
  }
  if (param === 1) {
    state.bold = true
    return
  }
  if (param === 3) {
    state.italic = true
    return
  }
  if (param === 4) {
    state.underline = true
    return
  }
  if (param === 22) {
    state.bold = false
    return
  }
  if (param === 23) {
    state.italic = false
    return
  }
  if (param === 24) {
    state.underline = false
    return
  }
  if (param === 39) {
    state.fg = null
    return
  }
  if (param === 49) {
    state.bg = null
    return
  }
  if (param >= 30 && param <= 37) {
    state.fg = FG[param - 30]
    return
  }
  if (param >= 90 && param <= 97) {
    state.fg = FG_BRIGHT[param - 90]
    return
  }
  if (param >= 40 && param <= 47) {
    state.bg = BG[param - 40]
    return
  }
  if (param >= 100 && param <= 107) {
    state.bg = BG_BRIGHT[param - 100]
  }
}

function styleOf(state: AnsiState): string {
  const rules: string[] = []
  if (state.bold) rules.push('font-weight:bold')
  if (state.italic) rules.push('font-style:italic')
  if (state.underline) rules.push('text-decoration:underline')
  if (state.fg) rules.push(`color:${state.fg}`)
  if (state.bg) rules.push(`background-color:${state.bg}`)
  return rules.join(';')
}

function parseAnsi(line: string): AnsiSpan[] {
  const spans: AnsiSpan[] = []
  const state = createState()
  let lastIndex = 0
  let match: RegExpExecArray | null
  ANSI_SGR_RE.lastIndex = 0
  while ((match = ANSI_SGR_RE.exec(line)) !== null) {
    if (match.index > lastIndex) {
      spans.push({ text: line.slice(lastIndex, match.index), style: styleOf(state) })
    }
    const params = match[1].length === 0 ? [0] : match[1].split(';').map(Number)
    for (const param of params) applySgr(state, param)
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < line.length) {
    spans.push({ text: line.slice(lastIndex), style: styleOf(state) })
  }
  return spans
}

export default function Term(props: { lines: Message[] }) {
  return (
    <div class="typ-cbr-output">
      <For each={props.lines}>
        {message => (
          <div class="typ-cbr-line">
            <Show
              when={message.level}
              fallback={
                <For each={parseAnsi(message.text)}>
                  {span => <span style={span.style}>{span.text}</span>}
                </For>
              }
            >
              {level => (
                <div class={`${LOG_LEVEL_CLASS[level()]} typ-cbr-log`}>
                  <span class="typ-cbr-msg">{message.text}</span>
                  <Show when={message.line !== undefined}>
                    <span class="typ-cbr-loc">:{message.line}</span>
                  </Show>
                </div>
              )}
            </Show>
          </div>
        )}
      </For>
    </div>
  )
}
