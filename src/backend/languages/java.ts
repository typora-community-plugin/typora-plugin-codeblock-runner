import type { Backend } from '../index'
import { httpRequest } from '../http'
import { writeLines, type Stdio } from '../store'

// The Java Playground at https://dev.java/playground (Java 27 + preview features).
// Odd protocol: the gateway only accepts `application/x-www-form-urlencoded`, yet
// the body it forwards is a JSON object whose `snippet` is the base64-encoded program.
const url = 'https://bxl7iq6fgjx6zcfh5pzsrhqqoe.apigateway.us-ashburn-1.oci.customer-oci.com/api/execute'

interface JavaStep {
  /** Source of this statement / declaration. */
  src: string
  /** `VALID` when accepted, `REJECTED` for a compile error. */
  status: string
  /** stdout produced by this step. */
  out?: string
  /** Value of a declaration/expression, or the error message. */
  val?: string
  /** Whether the step threw or failed to compile. */
  exc?: boolean
  /** 1-based source line where the step starts. */
  lne?: number
}

interface JavaResponse {
  body?: JavaStep[]
  errorMessage?: string
}

// btoa only handles latin1; go through UTF-8 bytes so non-ASCII code is preserved.
function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function emitError(stdio: Stdio, message: string, line?: number): void {
  stdio.update(prev => [...prev, { text: message, level: 'error', line }])
}

const java: Backend = async (code, stdio) => {
  const body = JSON.stringify({ option: 'na', prefixId: '', snippet: toBase64(code) })
  const res = await httpRequest({
    url,
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body,
  })

  const json = res.json<JavaResponse>()
  if (json.errorMessage) writeLines(stdio, json.errorMessage, 'error')
  for (const step of json.body ?? []) {
    if (step.out) writeLines(stdio, step.out)
    if (step.status === 'REJECTED' || step.exc) {
      emitError(stdio, `Error ⮕ ${step.val || 'execution failed'}`, step.lne)
    }
  }
}

java.loading = false
java.runtime = 'Java Playground (Remote)'

export default java
