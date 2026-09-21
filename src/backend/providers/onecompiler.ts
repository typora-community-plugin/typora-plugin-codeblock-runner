import type { Backend } from '../index'
import { httpRequest } from '../http'
import { writeLines, type Stdio } from '../store'
import type { LogLevel } from '../style-class'

// OneCompiler run APIs. Most languages stream NDJSON events over SSE from
// `/api/console/run`; the ones below are only served by the newer
// `/api/editorx/execute`, which answers with a single JSON document instead.
const STREAM_URL = 'https://onecompiler.com/api/console/run'
const JSON_URL = 'https://onecompiler.com/api/editorx/execute'
const JSON_LANGUAGES = new Set([
  'csharp', 'php', 'lua', 'python2', 'r', 'swift', 'dart', 'julia', 'zig',
  'javascript', 'typescript',
])

export const ONECOMPILER_RUNTIME = 'OneCompiler (Remote)'

export interface OneCompilerConfig {
  /** OneCompiler language id, e.g. `python`, `nodejs`, `csharp`. */
  language: string
  /** Entry file name the playground expects, e.g. `main.py`. */
  file: string
  /** Display label for the output window title; defaults to `OneCompiler (Remote)`. */
  label?: string
}

interface StreamEvent {
  type?: 'started' | 'stdout' | 'stderr' | 'exit' | 'error' | string
  data?: string
  message?: string
}

interface JsonResult {
  stdout?: string
  stderr?: string
  exception?: string
}

function emit(stdio: Stdio, text: string | undefined, level?: LogLevel): void {
  if (text) writeLines(stdio, text, level)
}

async function runStream(language: string, file: string, code: string, stdio: Stdio): Promise<void> {
  const res = await httpRequest({
    url: STREAM_URL,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language, files: [{ name: file, content: code }] }),
  })

  for (const line of res.text.split('\n')) {
    if (!line.trim()) continue
    let event: StreamEvent
    try {
      event = JSON.parse(line) as StreamEvent
    } catch {
      continue
    }
    if (event.type === 'stdout') emit(stdio, event.data)
    else if (event.type === 'stderr') emit(stdio, event.data, 'error')
    else if (event.type === 'error') emit(stdio, event.message, 'error')
  }
}

async function runJson(language: string, file: string, code: string, stdio: Stdio): Promise<void> {
  const res = await httpRequest({
    url: JSON_URL,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language, files: [{ name: file, content: code }], stdin: '' }),
  })

  const json = res.json<JsonResult>()
  if (json.stdout) writeLines(stdio, json.stdout)
  if (json.stderr) writeLines(stdio, json.stderr, 'error')
  if (json.exception) writeLines(stdio, json.exception, 'error')
}

/** Build a backend that submits code to OneCompiler's online playground. */
export function makeOneCompilerBackend(config: OneCompilerConfig): Backend {
  const backend: Backend = (code, stdio) => JSON_LANGUAGES.has(config.language)
    ? runJson(config.language, config.file, code, stdio)
    : runStream(config.language, config.file, code, stdio)

  backend.loading = false
  backend.runtime = config.label ?? ONECOMPILER_RUNTIME
  return backend
}
