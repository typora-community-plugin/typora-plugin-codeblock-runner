import type { Backend } from '../index'
import { httpPostJson } from '../http'
import { writeLines } from '../store'

// Crystal playground — JSON request, execution result nested under run_request.run.
const url = 'https://play.crystal-lang.org/run_requests'

interface CrystalResponse {
  run_request?: {
    run?: {
      stdout?: string
      stderr?: string
    }
  }
}

const crystal: Backend = async (code, stdio) => {
  const res = await httpPostJson(url, {
    run_request: {
      language: 'crystal',
      version: '1.8.2',
      code,
    },
  })

  const run = res.json<CrystalResponse>().run_request?.run
  if (run?.stderr) {
    writeLines(stdio, run.stderr, 'error')
  } else {
    writeLines(stdio, run?.stdout ?? '')
  }
}

crystal.loading = false
crystal.runtime = 'Crystal Playground (Remote)'

export default crystal
