import { createSignal } from 'solid-js'
import type { TranslateFn } from './i18n'

const identity: TranslateFn = key => key

const [getTranslate, setTranslate] = createSignal<TranslateFn>(identity)

export function setT(fn: TranslateFn): void {
  setTranslate(() => fn)
}

export function getT(): TranslateFn {
  return getTranslate()
}
