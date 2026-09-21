import { I18n, path } from '@typora-community-plugin/core'
import type { PluginManifest } from '@typora-community-plugin/core'

export type TranslateParams = Record<string, string | number>
export type TranslateFn = (key: string, params?: TranslateParams) => string
export type I18nService = { locale: string; t: TranslateFn }

export function createI18nService(manifest: PluginManifest, userLang: string): I18nService {
  let locale = userLang
  let resources: Record<string, unknown> = {}

  try {
    const i18n = new I18n<Record<string, unknown>>({
      localePath: path.join(manifest.dir!, 'locales'),
      userLang,
    })
    locale = i18n.locale
    resources = (i18n.t ?? {}) as unknown as Record<string, unknown>
  } catch (error) {
    console.error('[codeblock-runner] failed to load locales', error)
  }

  const t: TranslateFn = (key, params?) => {
    const parts = key.split('.')
    let current: unknown = resources
    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return key
      }
      current = (current as Record<string, unknown>)[part]
    }
    if (typeof current === 'string') {
      let text = current
      if (params) {
        for (const k of Object.keys(params)) {
          text = text.split('{{' + k + '}}').join(String((params as Record<string, string>)[k]))
        }
      }
      return text
    }
    return key
  }

  return { locale, t }
}
