export const LOG_LEVEL_CLASS = {
  log: 'typ-cbr-log--log',
  info: 'typ-cbr-log--info',
  debug: 'typ-cbr-log--debug',
  warn: 'typ-cbr-log--warn',
  error: 'typ-cbr-log--error',
} as const

export type LogLevel = keyof typeof LOG_LEVEL_CLASS
