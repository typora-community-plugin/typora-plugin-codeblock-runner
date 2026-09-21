// Bridges plugin settings from the plugin lifecycle (main.ts) to the language
// backends, which have no reference to the plugin instance.
import { createDefaultLanguages, type LanguageId } from './settings'

let enabledLanguages: Record<LanguageId, boolean> = createDefaultLanguages()
let runtimes: Record<string, string> = {}

export function setRuntimes(value: Record<string, string> | undefined): void {
  runtimes = { ...(value ?? {}) }
}

export function getRuntime(lang: string): string | undefined {
  return runtimes[lang]
}

export function setEnabledLanguages(value: Partial<Record<LanguageId, boolean>> | undefined): void {
  enabledLanguages = { ...createDefaultLanguages(), ...(value ?? {}) }
}

export function isLanguageOn(id: LanguageId): boolean {
  return enabledLanguages[id] !== false
}
