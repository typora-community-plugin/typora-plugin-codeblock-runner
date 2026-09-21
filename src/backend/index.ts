import type { Stdio } from './store'
import { languageIds, languages } from './languages'
import { isLanguageOn } from '../settings-bridge'
import { isMacOS } from '../platform'
import { MACOS_UNSUPPORTED_LANGUAGES, type LanguageId } from '../settings'
import type { Message } from './store'

export type Backend = {
  loading?: boolean
  /** Human-readable runtime environment, shown in the output window's title bar. */
  runtime?: string
  terminate?: () => void
  (code: string, stdio: Stdio): Promise<void>
}

export type { Message, Stdio }
export { languages }

export function getBackend(lang: string): Backend | undefined {
  return languages[lang.toLowerCase()]
}

export function getLanguageId(lang: string): LanguageId | undefined {
  return languageIds[lang.toLowerCase()]
}

/** Whether the language group for this code-fence alias is turned on in settings. */
export function isLanguageEnabled(lang: string): boolean {
  const id = getLanguageId(lang)
  if (id === undefined) return false
  if (isMacOS() && MACOS_UNSUPPORTED_LANGUAGES.includes(id)) return false
  return isLanguageOn(id)
}
