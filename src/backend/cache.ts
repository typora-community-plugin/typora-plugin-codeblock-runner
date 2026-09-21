import { hashCode } from './hash'
import type { Message } from './store'

export const CACHE_PREFIX = 'codeblock-runner:cache:'

// Model version of the persisted output format. Bump whenever `Message` changes,
// so entries cached by an older version are ignored and regenerated instead of
// being restored with a stale shape (e.g. missing source line numbers).
const CACHE_VERSION = 3

export interface CacheEntry {
  version: number
  outputs: Message[]
  lastAccessTime: number
}

export const cacheKeyFor = (code: string) => `${CACHE_PREFIX}${hashCode(code)}`

export function readCache(code: string): Message[] | null {
  try {
    const raw = localStorage.getItem(cacheKeyFor(code))
    if (!raw) return null
    const entry = JSON.parse(raw) as Partial<CacheEntry>
    if (entry?.version !== CACHE_VERSION) return null
    return Array.isArray(entry.outputs) ? entry.outputs : null
  } catch {
    return null
  }
}

export function writeCache(code: string, outputs: Message[]): void {
  try {
    const key = cacheKeyFor(code)
    if (outputs.length === 0) {
      localStorage.removeItem(key)
      return
    }
    const entry: CacheEntry = { version: CACHE_VERSION, outputs, lastAccessTime: Date.now() }
    localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // ignore localStorage quota/permission errors
  }
}

/** Remove every cached output entry. Returns the number of removed keys. */
export function clearAllCaches(): number {
  let removed = 0
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(CACHE_PREFIX)) keys.push(key)
    }
    for (const key of keys) {
      localStorage.removeItem(key)
      removed++
    }
  } catch {
    // ignore localStorage quota/permission errors
  }
  return removed
}
