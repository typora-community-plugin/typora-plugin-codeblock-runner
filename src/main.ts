import './style.scss'
import { Plugin, PluginSettings } from '@typora-community-plugin/core'
import codeblockPostProcessor from './processors/codeblock'
import { refreshRunButtons } from './processors/codeblock'
import { DEFAULT_CONFIG, type IPluginConfig } from './settings'
import { createI18nService, type I18nService } from './i18n'
import { setT } from './i18n-bridge'
import { setEnabledLanguages, setRuntimes } from './settings-bridge'
import { SettingsTab } from './setting-tab'
import { clearAllOutputs, installActiveBlockTracker, runActiveCodeblock } from './commands'


export default class extends Plugin<IPluginConfig> {
  private i18nService!: I18nService

  get t() { return this.i18nService.t }

  onload(): void {
    const settings = new PluginSettings<IPluginConfig>(this.app, this.manifest, { version: 1 })
    settings.setDefault(DEFAULT_CONFIG)
    this.registerSettings(settings)

    const syncSettings = () => {
      setEnabledLanguages(settings.get('languages'))
      setRuntimes(settings.get('runtimes'))
      refreshRunButtons()
    }
    syncSettings()
    this.register(settings.onChange('*', syncSettings))

    this.i18nService = createI18nService(this.manifest, this.app.i18n.locale)
    setT(this.i18nService.t)

    this.registerSettingTab(new SettingsTab(this))

    this.register(this.app.features.markdownEditor.postProcessor.register(codeblockPostProcessor))

    installActiveBlockTracker()

    this.registerCommand({
      id: 'run-code-block',
      title: this.t('commands.runCodeBlock'),
      scope: 'editor',
      hotkey: 'Alt+Ctrl+R',
      callback: () => { runActiveCodeblock() },
    })

    this.registerCommand({
      id: 'clear-all-outputs',
      title: this.t('commands.clearAllOutputs'),
      scope: 'editor',
      callback: () => { clearAllOutputs() },
    })
  }
}
