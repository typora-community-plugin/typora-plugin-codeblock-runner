import type { Backend } from '../index'
import { CLIENT_AGENT, httpPostJson } from '../http'
import { writeLines, type Stdio } from '../store'

// Kotlin playground compiler API (note: the path intentionally has a double slash).
const url = 'https://api.kotlinlang.org//api/1.7.10/compiler/run'

interface KotlinResponse {
  errors?: Record<string, { message: string; severity: string }[]>
  text?: string
}

// The API wraps program output in pseudo-tags instead of separate fields:
// "…<outStream>stdout</outStream><errStream>stderr</errStream>…". Split them so
// stdout and stderr land on their own rows with the right styling.
const STREAM_RE = /<(out|err)Stream>([\s\S]*?)<\/\1Stream>/g

function writeStreams(stdio: Stdio, text: string): void {
  let lastIndex = 0
  let match: RegExpExecArray | null
  STREAM_RE.lastIndex = 0
  while ((match = STREAM_RE.exec(text)) !== null) {
    if (match.index > lastIndex) writeLines(stdio, text.slice(lastIndex, match.index))
    writeLines(stdio, match[2], match[1] === 'err' ? 'error' : undefined)
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) writeLines(stdio, text.slice(lastIndex))
}

const kotlin: Backend = async (code, stdio) => {
  const res = await httpPostJson(
    url,
    {
      args: '',
      confType: 'java',
      files: [{ name: 'File.kt', publicId: '', text: code }],
    },
    { 'Client-Agent': CLIENT_AGENT },
  )

  const json = res.json<KotlinResponse>()
  if (json.errors) {
    for (const diagnostics of Object.values(json.errors)) {
      for (const diagnostic of diagnostics) {
        const warn = diagnostic.severity.toLowerCase() === 'warning'
        writeLines(stdio, diagnostic.message, warn ? 'warn' : 'error')
      }
    }
  }
  if (json.text) writeStreams(stdio, json.text)
}

kotlin.loading = false
kotlin.runtime = 'Kotlin Playground (Remote)'

export default kotlin
