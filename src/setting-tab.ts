import { SettingTab, type SettingItem } from '@typora-community-plugin/core'
import { getBackend } from './backend'
import { HTML_RUNTIME_BROWSER, HTML_RUNTIME_IFRAME, HTML_RUNTIME_LABELS } from './backend/languages/html'
import { JS_RUNTIME_LABELS, JS_RUNTIME_LOCAL, JS_RUNTIME_ONECOMPILER, JS_RUNTIME_ORDER } from './backend/languages/js'
import { NODE_RUNTIME_LABELS, NODE_RUNTIME_LOCAL, NODE_RUNTIME_ONECOMPILER, NODE_RUNTIME_ORDER } from './backend/languages/node'
import { TS_RUNTIME_LABELS, TS_RUNTIME_LOCAL, TS_RUNTIME_ONECOMPILER, TS_RUNTIME_ORDER } from './backend/languages/ts'
import type { TranslateFn } from './i18n'
import type PluginClass from './main'
import { isMacOS } from './platform'
import { LANGUAGE_IDS, LOCAL_LANGUAGES, MACOS_UNSUPPORTED_LANGUAGES, type LanguageId } from './settings'

const LANGUAGE_LABELS: Record<LanguageId, string> = {
  js: 'JavaScript',
  node: 'Node.js',
  ts: 'TypeScript',
  html: 'HTML',
  rust: 'Rust',
  kotlin: 'Kotlin',
  haskell: 'Haskell',
  crystal: 'Crystal',
  v: 'V',
  go: 'Go',
  java: 'Java',
  bash: 'Bash',
  c: 'C',
  cpp: 'C++',
  csharp: 'C#',
  python: 'Python',
  powershell: 'PowerShell',
  php: 'PHP',
  lua: 'Lua',
  python2: 'Python 2',
  r: 'R',
  swift: 'Swift',
  dart: 'Dart',
  julia: 'Julia',
  zig: 'Zig',
}

type RenderContext = {
  t: TranslateFn
  getLanguage: (id: LanguageId) => boolean | undefined
  setLanguage: (id: LanguageId, value: boolean) => void
  getRuntime: (id: LanguageId) => string | undefined
  setRuntime: (id: LanguageId, value: string) => void
}

type LanguageRender = (setting: SettingItem, id: LanguageId, ctx: RenderContext) => void

function addToggle(setting: SettingItem, id: LanguageId, ctx: RenderContext): void {
  setting.addCheckbox(checkbox => {
    checkbox.checked = ctx.getLanguage(id) ?? LOCAL_LANGUAGES.includes(id)
    checkbox.onchange = () => ctx.setLanguage(id, checkbox.checked)
  })
}

function makeRuntimeRender(): LanguageRender {
  return (setting, id, ctx) => {
    setting.addName(LANGUAGE_LABELS[id])
    const runtime = getBackend(id)?.runtime
    if (runtime) setting.addTag(runtime)
    addToggle(setting, id, ctx)
  }
}

const defaultLanguageRender = makeRuntimeRender()

const HTML_RUNTIME_ORDER = [HTML_RUNTIME_BROWSER, HTML_RUNTIME_IFRAME]

type RuntimeLabels = Record<string, string>

/** Select of runtime ids: the stored value is the id, the option shows the label. */
function addRuntimeSelect(
  setting: SettingItem,
  selected: string,
  order: string[],
  labels: RuntimeLabels,
  onSelect: (runtimeId: string) => void,
): void {
  setting.addSelect(select => {
    for (const runtimeId of order) {
      const option = document.createElement('option')
      option.value = runtimeId
      option.textContent = labels[runtimeId]
      option.selected = runtimeId === selected
      select.append(option)
    }
    select.onchange = () => onSelect(select.value)
  })
}

/** One description line per runtime, prefixed by its label. */
function addRuntimeDescriptions(
  setting: SettingItem,
  order: string[],
  labels: RuntimeLabels,
  descriptions: RuntimeLabels,
): void {
  setting.addDescription(description => {
    const list = document.createElement('ul')
    list.className = 'typ-cbr-setting-list'
    for (const runtimeId of order) {
      const item = document.createElement('li')
      const code = document.createElement('code')
      code.textContent = labels[runtimeId]
      item.append(code, ` ${descriptions[runtimeId]}`)
      list.append(item)
    }
    description.append(list)
  })
}

/** Runtime select plus one description line per runtime, keyed by i18n key. */
function makeRuntimeSelectRender(
  order: string[],
  labels: RuntimeLabels,
  defaultRuntime: string,
  descriptionKeys: Record<string, string>,
): LanguageRender {
  return (setting, id, ctx) => {
    setting.addName(LANGUAGE_LABELS[id])
    addRuntimeSelect(setting, ctx.getRuntime(id) ?? defaultRuntime, order, labels, value => ctx.setRuntime(id, value))
    const descriptions: RuntimeLabels = {}
    for (const runtimeId of order) descriptions[runtimeId] = ctx.t(descriptionKeys[runtimeId])
    addRuntimeDescriptions(setting, order, labels, descriptions)
    addToggle(setting, id, ctx)
  }
}

const LANGUAGE_RENDERS: Partial<Record<LanguageId, LanguageRender>> = {
  html: makeRuntimeSelectRender(HTML_RUNTIME_ORDER, HTML_RUNTIME_LABELS, HTML_RUNTIME_BROWSER, {
    [HTML_RUNTIME_BROWSER]: 'settings.htmlRuntimeBrowserDesc',
    [HTML_RUNTIME_IFRAME]: 'settings.htmlRuntimeIframeDesc',
  }),
  js: makeRuntimeSelectRender(JS_RUNTIME_ORDER, JS_RUNTIME_LABELS, JS_RUNTIME_LOCAL, {
    [JS_RUNTIME_LOCAL]: 'settings.jsRuntimeLocalDesc',
    [JS_RUNTIME_ONECOMPILER]: 'settings.jsRuntimeOneCompilerDesc',
  }),
  ts: makeRuntimeSelectRender(TS_RUNTIME_ORDER, TS_RUNTIME_LABELS, TS_RUNTIME_LOCAL, {
    [TS_RUNTIME_LOCAL]: 'settings.tsRuntimeLocalDesc',
    [TS_RUNTIME_ONECOMPILER]: 'settings.tsRuntimeOneCompilerDesc',
  }),
  node: makeRuntimeSelectRender(NODE_RUNTIME_ORDER, NODE_RUNTIME_LABELS, NODE_RUNTIME_LOCAL, {
    [NODE_RUNTIME_LOCAL]: 'settings.nodeRuntimeLocalDesc',
    [NODE_RUNTIME_ONECOMPILER]: 'settings.nodeRuntimeOneCompilerDesc',
  }),
}

export class SettingsTab extends SettingTab {
  constructor(private plugin: PluginClass) {
    super()
  }

  get name(): string {
    return this.plugin.manifest.name
  }

  onload(): void {
    this.render()
  }

  rerender(): void {
    this.render()
  }

  private render(): void {
    this.containerEl.replaceChildren()
    const t = this.plugin.t
    const { settings } = this.plugin
    const ctx: RenderContext = {
      t,
      getLanguage: id => settings.get(['languages', id]),
      setLanguage: (id, value) => settings.set(['languages', id], value),
      getRuntime: id => settings.get(['runtimes', id]),
      setRuntime: (id, value) => settings.set(['runtimes', id], value),
    }

    this.addSetting(setting => {
      setting.addTitle(t('settings.languages'))
      setting.addDescription(t('settings.languagesHint'))
    })
    for (const id of LANGUAGE_IDS) {
      if (isMacOS() && MACOS_UNSUPPORTED_LANGUAGES.includes(id)) continue
      const render = LANGUAGE_RENDERS[id] ?? defaultLanguageRender
      this.addSetting(setting => render(setting, id, ctx))
    }
  }
}
