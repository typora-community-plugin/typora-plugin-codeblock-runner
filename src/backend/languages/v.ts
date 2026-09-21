import type { Backend } from '../index'
import { httpRequest } from '../http'
import { writeLines } from '../store'

// V playground — form-encoded code, JSON reply.
const url = 'https://play.vlang.io/run'

interface VResponse {
  output?: string
  buildOutput?: string
  error?: string
}

const v: Backend = async (code, stdio) => {
  const res = await httpRequest({
    url,
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `code=${encodeURIComponent(code)}`,
  })

  const json = res.json<VResponse>()
  if (json.error?.length) {
    writeLines(stdio, json.error, 'error')
  } else {
    writeLines(stdio, json.output ?? '')
  }
}

v.loading = false
v.runtime = 'V Playground (Remote)'

export default v
