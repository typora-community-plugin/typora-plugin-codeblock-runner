import { isMacOS } from './platform'


export type LanguageId =
  | 'js'
  | 'node'
  | 'ts'
  | 'html'
  | 'rust'
  | 'kotlin'
  | 'haskell'
  | 'crystal'
  | 'v'
  | 'go'
  | 'java'
  | 'bash'
  | 'c'
  | 'cpp'
  | 'csharp'
  | 'python'
  | 'powershell'
  | 'php'
  | 'lua'
  | 'python2'
  | 'r'
  | 'swift'
  | 'dart'
  | 'julia'
  | 'zig'

/** Display / iteration order, sorted alphabetically by display name. */
export const LANGUAGE_IDS: LanguageId[] = [
  'bash', 'c', 'cpp', 'csharp', 'crystal', 'dart', 'go', 'haskell',
  'html', 'java', 'js', 'julia', 'kotlin', 'lua', 'node', 'php',
  'powershell', 'python', 'python2', 'r', 'rust', 'swift', 'ts', 'v', 'zig',
]

/** Backends that execute inside Typora. Enabled by default. */
export const LOCAL_LANGUAGES: LanguageId[] = ['js', 'node', 'ts', 'html']

/** Backends that submit code to an online playground. Disabled by default. */
export const REMOTE_LANGUAGES: LanguageId[] = [
  'rust', 'kotlin', 'haskell', 'crystal', 'v', 'go', 'java',
  'bash', 'c', 'cpp', 'csharp', 'python', 'powershell',
  'dart', 'julia', 'lua', 'php', 'python2', 'r', 'swift', 'zig',
]

// Remote playgrounds that send no CORS headers, so the macOS renderer (no
// `reqnode`, `fetch` fallback only) cannot reach them. OneCompiler is included:
// its API answers without `Access-Control-Allow-Origin`.
export const MACOS_UNSUPPORTED_LANGUAGES: LanguageId[] = [
  'node', 'kotlin', 'v', 'go', 'java',
  'bash', 'c', 'cpp', 'csharp', 'python', 'powershell',
  'dart', 'julia', 'lua', 'php', 'python2', 'r', 'swift', 'zig',
]

export function createDefaultLanguages(): Record<LanguageId, boolean> {
  const languages = {} as Record<LanguageId, boolean>
  const unsupported = isMacOS() ? MACOS_UNSUPPORTED_LANGUAGES : []
  for (const id of LANGUAGE_IDS) languages[id] = LOCAL_LANGUAGES.includes(id) && !unsupported.includes(id)
  return languages
}

export type IPluginConfig = {
  languages: Record<string, boolean>
  /** Selected runtime per language, only for languages that offer more than one. */
  runtimes: Record<string, string>
}

export const DEFAULT_CONFIG: IPluginConfig = {
  languages: createDefaultLanguages(),
  runtimes: {},
}
