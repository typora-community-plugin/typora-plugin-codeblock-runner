export const BLOCKED_GLOBALS: readonly string[] = [
  'window', 'self', 'globalThis', 'top', 'parent', 'frames',
  'document', 'navigator', 'location', 'history', 'screen',
  'localStorage', 'sessionStorage', 'indexedDB', 'caches',
  'DOMParser', 'MutationObserver', 'requestAnimationFrame', 'cancelAnimationFrame',
  'getComputedStyle', 'matchMedia', 'alert', 'confirm', 'prompt', 'open', 'close',
  'print', 'postMessage', 'importScripts',
  'fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'Worker', 'SharedWorker',
  'BroadcastChannel', 'MessageChannel',
  'Function',
  'reqnode', 'File', 'editor', 'Typora', 'require', 'module', 'exports', 'process', 'global',
]

const REGEX_PREV = new Set('(,=:[!&|?{;+-*%^~<>'.split(''))
const REGEX_KEYWORDS = new Set([
  'return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void',
  'do', 'else', 'case', 'yield', 'await', 'throw', 'default',
])

function prevWord(src: string, pos: number): string {
  let j = pos - 1
  while (j >= 0 && /\s/.test(src[j])) j--
  const end = j
  while (j >= 0 && /[\w$]/.test(src[j])) j--
  return src.slice(j + 1, end + 1)
}

function scanString(src: string, start: number): number {
  const quote = src[start]
  let i = start + 1
  while (i < src.length) {
    const c = src[i]
    if (c === '\\') { i += 2; continue }
    if (c === quote) return i + 1
    if (c === '\n') return -1
    i++
  }
  return -1
}

function scanTemplate(src: string, start: number): number {
  let i = start + 1
  while (i < src.length) {
    const c = src[i]
    if (c === '\\') { i += 2; continue }
    if (c === '`') return i + 1
    if (c === '$' && src[i + 1] === '{') {
      i += 2
      let depth = 1
      while (i < src.length && depth > 0) {
        const d = src[i]
        if (d === '{') { depth++; i++ }
        else if (d === '}') { depth--; i++ }
        else if (d === '`') { const end = scanTemplate(src, i); if (end < 0) return -1; i = end }
        else if (d === '"' || d === "'") { const end = scanString(src, i); if (end < 0) return -1; i = end }
        else if (d === '\\') i += 2
        else i++
      }
      if (depth > 0) return -1
      continue
    }
    i++
  }
  return -1
}

function scanRegex(src: string, start: number): number {
  let i = start + 1
  let inClass = false
  let closed = false
  while (i < src.length) {
    const d = src[i]
    if (d === '\\') { i += 2; continue }
    if (d === '\n') return -1
    if (d === '[') inClass = true
    else if (d === ']') inClass = false
    else if (d === '/' && !inClass) { i++; closed = true; break }
    i++
  }
  if (!closed) return -1
  while (i < src.length && /[a-z]/.test(src[i])) i++
  return i
}

function maskSource(src: string): string | null {
  const out = src.split('')
  const blank = (from: number, to: number): void => {
    for (let k = from; k < to && k < out.length; k++) out[k] = ' '
  }
  let i = 0
  let lastSig = ''
  while (i < src.length) {
    const c = src[i]
    if (c === '/' && src[i + 1] === '/') {
      const from = i
      i += 2
      while (i < src.length && src[i] !== '\n') i++
      blank(from, i)
      continue
    }
    if (c === '/' && src[i + 1] === '*') {
      const from = i
      i += 2
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++
      if (i >= src.length) return null
      i += 2
      blank(from, i)
      continue
    }
    if (c === '"' || c === "'") {
      const end = scanString(src, i)
      if (end < 0) return null
      blank(i, end)
      lastSig = 'x'
      i = end
      continue
    }
    if (c === '`') {
      const end = scanTemplate(src, i)
      if (end < 0) return null
      blank(i, end)
      lastSig = 'x'
      i = end
      continue
    }
    if (c === '/') {
      const allowed = lastSig === '' || REGEX_PREV.has(lastSig) || REGEX_KEYWORDS.has(prevWord(src, i))
      if (allowed) {
        const end = scanRegex(src, i)
        if (end < 0) return null
        blank(i, end)
        lastSig = 'x'
        i = end
        continue
      }
    }
    if (!/\s/.test(c)) lastSig = c
    i++
  }
  return out.join('')
}

function skipSpaces(s: string, from: number): number {
  let i = from
  while (i < s.length && /\s/.test(s[i])) i++
  return i
}

export function injectTimeout(code: string, deadlineMs: number): string {
  const masked = maskSource(code)
  if (masked === null) return code

  const check = `if(Date.now()>${deadlineMs})throw new Error("Loop Timeout");`
  const inserts: number[] = []

  const matchParen = (start: number): number => {
    let depth = 0
    for (let k = start; k < masked.length; k++) {
      const ch = masked[k]
      if (ch === '(') depth++
      else if (ch === ')') { depth--; if (depth === 0) return k }
    }
    return -1
  }
  const matchBrace = (start: number): number => {
    let depth = 0
    for (let k = start; k < masked.length; k++) {
      const ch = masked[k]
      if (ch === '{') depth++
      else if (ch === '}') { depth--; if (depth === 0) return k }
    }
    return -1
  }

  const re = /\b(for|while|do)\b/g
  let m: RegExpExecArray | null
  while ((m = re.exec(masked))) {
    const kw = m[1]
    const at = m.index
    const before = at > 0 ? masked[at - 1] : ''
    if (before === '.' || /[\w$]/.test(before)) continue

    let j = skipSpaces(masked, at + kw.length)
    if (kw === 'for' || kw === 'while') {
      if (kw === 'for' && masked.startsWith('await', j) && !/[\w$]/.test(masked[j + 5] ?? '')) {
        j = skipSpaces(masked, j + 5)
      }
      if (masked[j] !== '(') continue
      const close = matchParen(j)
      if (close < 0) return code
      j = skipSpaces(masked, close + 1)
    }

    if (masked[j] !== '{') continue
    const end = matchBrace(j)
    if (end < 0) return code
    inserts.push(j + 1)
  }

  if (inserts.length === 0) return code
  inserts.sort((a, b) => b - a)
  let out = code
  for (const pos of inserts) out = out.slice(0, pos) + check + out.slice(pos)
  return out
}
