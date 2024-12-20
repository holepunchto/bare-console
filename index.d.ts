import Log from 'bare-logger'

declare class Console {
  constructor(log?: Log)

  get Console(): typeof Console

  debug(...data: any[]): void
  log(...data: any[]): void
  info(...data: any[]): void
  warn(...data: any[]): void
  error(...data: any[]): void

  clear(): void

  time(label?: string): void
  timeEnd(label?: string): void
  timeLog(label?: string, ...data: any[]): void

  assert(condition: any, ...data: any[]): void
  count(label?: string): void
  countReset(label?: string): void
  trace(...data: any[]): void
}

declare namespace Console {
  export { Console }
}

export = Console
