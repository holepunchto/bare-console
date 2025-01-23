import Log from 'bare-logger'

interface Console {
  readonly Console: ConsoleConstructor

  debug(...data: unknown[]): void
  log(...data: unknown[]): void
  info(...data: unknown[]): void
  warn(...data: unknown[]): void
  error(...data: unknown[]): void

  clear(): void

  time(label?: string): void
  timeEnd(label?: string): void
  timeLog(label?: string, ...data: unknown[]): void

  assert(condition: unknown, ...data: unknown[]): void
  count(label?: string): void
  countReset(label?: string): void
  trace(...data: unknown[]): void
}

declare class Console {
  constructor(log?: Log)
}

type ConsoleConstructor = typeof Console

declare namespace Console {
  export { Console }
}

export = Console
