import { getT } from '../i18n-bridge'

export default function Spin() {
  const t = (key: string, params?: Record<string, string | number>) => getT()(key, params)
  return (
    <span class="typ-cbr-spin" role="status" aria-label={t('loading')}>
      <i />
      <i />
      <i />
      <i />
    </span>
  )
}
