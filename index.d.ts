import Log from 'bare-logger'

declare class Console {
  constructor(log?: Log)

  get Console(): typeof Console

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

declare namespace Console {
  export { Console }
}

export = Console
