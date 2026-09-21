import type { Backend } from '../index'
import { httpPostJson } from '../http'
import { writeLines } from '../store'

// Rust playground — /execute compiles and runs the snippet.
const url = 'https://play.rust-lang.org/execute'

interface RustResponse {
  success: boolean
  stdout?: string
  stderr?: string
}

const rust: Backend = async (code, stdio) => {
  const res = await httpPostJson(url, {
    channel: 'stable',
    mode: 'debug',
    edition: '2021',
    crateType: 'bin',
    tests: false,
    code,
    backtrace: false,
  })

  const json = res.json<RustResponse>()
  if (json.success) {
    writeLines(stdio, json.stdout ?? '')
  } else {
    writeLines(stdio, json.stderr ?? '', 'error')
  }
}

rust.loading = false
rust.runtime = 'Rust Playground (Remote)'

export default rust
