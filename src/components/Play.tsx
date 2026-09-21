import { createSignal, onCleanup, onMount, Show } from 'solid-js'
import { getT } from '../i18n-bridge'
import { getBackend, isLanguageEnabled } from '../backend'
import { readCache, writeCache } from '../backend/cache'
import type { RunnerHandle } from '../runner-registry'
import { createStdio, type Message } from '../backend/store'
import Icon from './Icon'
import Spin from './Spin'
import Term from './Term'

export default function Play(props: {
  lang: string
  code: string
  getCode?: () => string
  expose?: (handle: RunnerHandle) => void
}) {
  const t = (key: string, params?: Record<string, string | number>) => getT()(key, params)
  const stdio = createStdio()
  const [outputs, setOutputs] = createSignal<Message[]>([])
  const [running, setRunning] = createSignal(false)
  const [hasViewResult, setHasViewResult] = createSignal(false)
  const hasResult = () => outputs().length > 0 || hasViewResult()
  const runtime = () => getBackend(props.lang)?.runtime ?? props.lang

  // Typora does not fire its "edit" event for typing inside a code block, so the
  // mounted runner keeps the code snapshot taken at mount time. Remember the
  // code that actually produced the current output so it can be cached correctly.
  let lastCode = props.code

  let unsubscribe: (() => void) | undefined

  // Persist the current output under the code that produced it. Called right after
  // every run (not only on unmount) so localStorage always reflects the latest
  // result even if the runner is never disposed (e.g. the note is just closed).
  const persist = () => writeCache(lastCode, outputs())

  onMount(() => {
    unsubscribe = stdio.subscribe(setOutputs)
    const cached = readCache(props.code)
    if (cached) stdio.set(cached)
  })

  onCleanup(() => {
    unsubscribe?.()
    persist()
    stdio.clear()
  })

  const run = async () => {
    if (running()) return
    setRunning(true)
    stdio.clear()
    setHasViewResult(false)
    try {
      const code = props.getCode?.() ?? props.code
      lastCode = code
      const backend = getBackend(props.lang)
      if (!backend) {
        stdio.stderr(t('unsupportedLanguage', { lang: props.lang }))
        return
      }
      if (!isLanguageEnabled(props.lang)) {
        stdio.stderr(t('languageDisabled', { lang: props.lang }))
        return
      }
      await backend(code, stdio)
    } catch (e) {
      stdio.stderr(e)
    } finally {
      setHasViewResult(stdio.viewEl.hasChildNodes())
      setRunning(false)
      persist()
    }
  }

  const clearOutput = () => {
    stdio.clear()
    setHasViewResult(false)
    persist()
  }

  const stop = () => {
    getBackend(props.lang)?.terminate?.()
    setRunning(false)
  }

  onMount(() => {
    props.expose?.({ run, clear: clearOutput })
  })

  return (
    <div class="typ-cbr-block">
      <Show when={running() || hasResult()}>
        <div class={`typ-cbr-window${running() ? ' typ-cbr-window--running' : ''}`}>
          <div class="typ-cbr-window__titlebar">
            <span class="typ-cbr-window__icon"><Icon name="window" size={14} /></span>
            <span class="typ-cbr-window__title">{runtime()}</span>
            <Show when={running()}>
              <Spin />
              <button class="typ-cbr-btn" type="button" title={t('stop')} aria-label={t('stop')} onClick={stop}>
                <Icon name="stop" />
              </button>
            </Show>
            <Show when={!running() && hasResult()}>
              <button class="typ-cbr-btn" type="button" title={t('clearOutput')} aria-label={t('clearOutput')} onClick={clearOutput}>
                <Icon name="clear" />
              </button>
            </Show>
          </div>
          <Show when={!running() && hasResult()}>
            <div class="typ-cbr-view" ref={(el: HTMLDivElement) => el.appendChild(stdio.viewEl)} />
            <Show when={outputs().length > 0}>
              <Term lines={outputs()} />
            </Show>
          </Show>
        </div>
      </Show>
    </div>
  )
}
