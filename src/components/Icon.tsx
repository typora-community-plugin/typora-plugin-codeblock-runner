export const ICON_PATHS = {
  play: 'M8 5v14l11-7z',
  clear: 'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  stop: 'M6 6h12v12H6z',
  window: 'M20 4H4c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8h16v10z',
} as const

export type IconName = keyof typeof ICON_PATHS

export default function Icon(props: { name: IconName; size?: number }) {
  return (
    <svg
      width={props.size ?? 16}
      height={props.size ?? 16}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d={ICON_PATHS[props.name]} />
    </svg>
  )
}
