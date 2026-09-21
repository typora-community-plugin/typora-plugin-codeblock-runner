import type { Backend } from '../index'
import { CLIENT_AGENT, httpPostJson, httpRequest } from '../http'
import { writeLines } from '../store'

// Haskell playground — the GHC version is fetched once and reused for submits.
const VERSIONS_URL = 'https://play.haskell.org/versions'
const SUBMIT_URL = 'https://play.haskell.org/submit'

const headers = {
  'Client-Agent': CLIENT_AGENT,
  'Accept': 'application/json',
}

interface HaskellResponse {
  ec: number
  ghcout?: string
  sout?: string
  serr?: string
}

let ghcVersion: string | undefined

async function getGhcVersion(): Promise<string> {
  const res = await httpRequest({ url: VERSIONS_URL, headers })
  const versions = res.json<string[]>()
  ghcVersion = versions[versions.length - 1] ?? ''
  return ghcVersion
}

const hs: Backend = async (code, stdio) => {
  const version = ghcVersion ?? await getGhcVersion()
  const res = await httpPostJson(SUBMIT_URL, { code, opt: 'O1', output: 'run', version }, headers)

  const json = res.json<HaskellResponse>()
  if (json.ec === 0) {
    writeLines(stdio, json.sout ?? '')
    if (json.serr) writeLines(stdio, json.serr, 'warn')
  } else {
    writeLines(stdio, json.ghcout ?? '', 'error')
  }
}

hs.loading = false
hs.runtime = 'Haskell Playground (Remote)'

export default hs
