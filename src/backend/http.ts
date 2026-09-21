/**
 * Minimal HTTP client for the remote language backends.
 *
 * Obsidian's `requestUrl` is not available here, so requests are sent through
 * Node's `http`/`https` obtained from Typora's `reqnode` bridge: that bypasses
 * the renderer's CORS policy, which the playground APIs do not satisfy. On
 * macOS Typora exposes no Node (`File.isNode === false`), so the renderer's
 * `fetch` is used instead (subject to the server's CORS headers).
 */

export const CLIENT_AGENT = 'Typora Codeblock Runner/1.0.0'

export interface HttpRequest {
  url: string
  method?: 'GET' | 'POST'
  headers?: Record<string, string>
  body?: string
}

export interface HttpResponse {
  status: number
  text: string
  json: <T = unknown>() => T
}

type ReqNode = (id: string) => unknown

function getReqNode(): ReqNode | undefined {
  const g = globalThis as unknown as { reqnode?: unknown; File?: { isNode?: boolean } }
  if (g.File?.isNode === false) return undefined
  return typeof g.reqnode === 'function' ? (g.reqnode as ReqNode) : undefined
}

interface NodeResponse {
  statusCode?: number
  headers: Record<string, string | string[] | undefined>
  setEncoding(encoding: string): void
  resume(): void
  on(event: 'data', listener: (chunk: string) => void): void
  on(event: 'end', listener: () => void): void
}

interface NodeRequest {
  on(event: 'error', listener: (error: Error) => void): void
  setTimeout(timeout: number, listener: () => void): void
  destroy(error?: Error): void
  write(chunk: string): void
  end(): void
}

interface NodeNetModule {
  request(
    url: string,
    options: { method: string; headers: Record<string, string> },
    callback: (response: NodeResponse) => void,
  ): NodeRequest
}

const REDIRECT_STATUS = [301, 302, 303, 307, 308]
const MAX_REDIRECTS = 5
const TIMEOUT_MS = 30000

function makeResponse(status: number, text: string): HttpResponse {
  return { status, text, json: <T>() => JSON.parse(text) as T }
}

function nodeRequest(req: HttpRequest, reqnode: ReqNode, redirects: number): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const net = reqnode(req.url.startsWith('https:') ? 'https' : 'http') as NodeNetModule
    const method = req.method ?? 'GET'
    const headers: Record<string, string> = { 'User-Agent': CLIENT_AGENT, ...req.headers }
    if (req.body !== undefined) {
      headers['Content-Length'] = String(new TextEncoder().encode(req.body).length)
    }

    const request = net.request(req.url, { method, headers }, response => {
      const status = response.statusCode ?? 0
      if (REDIRECT_STATUS.includes(status)) {
        response.resume()
        const location = response.headers.location
        const target = Array.isArray(location) ? location[0] : location
        if (!target) return reject(new Error(`HTTP ${status}: redirect location missing`))
        if (redirects <= 0) return reject(new Error('Too many redirects'))
        const next: HttpRequest = { ...req, url: new URL(target, req.url).toString() }
        // 301/302/303 turn a POST into a GET, matching browser behaviour.
        if (method === 'POST' && status !== 307 && status !== 308) {
          next.method = 'GET'
          next.body = undefined
        }
        resolve(nodeRequest(next, reqnode, redirects - 1))
        return
      }

      let text = ''
      response.setEncoding('utf8')
      response.on('data', chunk => { text += chunk })
      response.on('end', () => resolve(makeResponse(status, text)))
    })

    request.on('error', reject)
    request.setTimeout(TIMEOUT_MS, () => { request.destroy(new Error('Request timed out')) })
    if (req.body !== undefined) request.write(req.body)
    request.end()
  })
}

async function fetchRequest(req: HttpRequest): Promise<HttpResponse> {
  const response = await fetch(req.url, {
    method: req.method ?? 'GET',
    headers: req.headers,
    body: req.body,
  })
  return makeResponse(response.status, await response.text())
}

export function httpRequest(req: HttpRequest): Promise<HttpResponse> {
  const reqnode = getReqNode()
  return reqnode ? nodeRequest(req, reqnode, MAX_REDIRECTS) : fetchRequest(req)
}

export function httpPostJson(
  url: string,
  payload: unknown,
  headers?: Record<string, string>,
): Promise<HttpResponse> {
  return httpRequest({
    url,
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
    body: JSON.stringify(payload),
  })
}
