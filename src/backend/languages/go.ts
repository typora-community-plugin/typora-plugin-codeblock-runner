import type { Backend } from '../index'
import { httpRequest } from '../http'
import { writeLines } from '../store'

// Go playground — form-encoded source, JSON reply carrying a list of output events.
const url = 'https://go.dev/_/compile'

interface GoEvent {
  Message: string
  Kind: 'stdout' | 'stderr'
}

interface GoResponse {
  Errors?: string
  VetErrors?: string
  Events?: GoEvent[] | null
}

const go: Backend = async (code, stdio) => {
  const res = await httpRequest({
    url,
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'version=2&withVet=true&body=' + encodeURIComponent(code),
  })

  const json = res.json<GoResponse>()
  if (json.Errors) writeLines(stdio, json.Errors, 'error')
  if (json.VetErrors) writeLines(stdio, json.VetErrors, 'warn')
  for (const event of json.Events ?? []) {
    writeLines(stdio, event.Message, event.Kind === 'stderr' ? 'error' : undefined)
  }
}

go.loading = false
go.runtime = 'Go Playground (Remote)'

export default go
