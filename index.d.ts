import Log from 'bare-logger'

interface Console {
  /** The `Console` constructor, exposed for Node.js compatibility. */
  readonly Console: ConsoleConstructor

  /**
   * @param data - Values to log.
   */
  debug(...data: unknown[]): void
  /**
   * @param data - Values to log.
   */
  log(...data: unknown[]): void
  /**
   * @param data - Values to log.
   */
  info(...data: unknown[]): void
  /**
   * @param data - Values to log.
   */
  warn(...data: unknown[]): void
  /**
   * @param data - Values to log.
   */
  error(...data: unknown[]): void

  /** Forward to `log.clear()`. */
  clear(): void

  /**
   * @param label - The label identifying the timer or counter (default `'default'`).
   */
  time(label?: string): void
  /**
   * @param label - The label identifying the timer or counter (default `'default'`).
   */
  timeEnd(label?: string): void
  /**
   * @param label - The label identifying the timer (default `'default'`).
   * @param data - Additional values logged after the elapsed time.
   */
  timeLog(label?: string, ...data: unknown[]): void

  /**
   * @param condition - The value tested for truthiness; when falsy, `data` is logged.
   * @param data - Values logged after the `'Assertion failed'` prefix when `condition` is falsy.
   */
  assert(condition: unknown, ...data: unknown[]): void
  /**
   * @param label - The label identifying the timer or counter (default `'default'`).
   */
  count(label?: string): void
  /**
   * @param label - The label identifying the timer or counter (default `'default'`).
   */
  countReset(label?: string): void
  /**
   * @param data - Values formatted and prefixed onto the stack trace.
   */
  trace(...data: unknown[]): void
  /**
   * @param tabularData - The data to render as a table.
   * @param properties - Object keys to include as columns; ignored for `Map` and `Set`.
   */
  table(tabularData: unknown, properties?: readonly string[]): void
}

declare class Console {
  /**
   * Construct a new `Console`.
   * @param log - The logging backend to write through. Defaults to a `bare-logger` instance, or
   * `bare-system-logger` on Android.
   */
  constructor(log?: Log)
}

type ConsoleConstructor = typeof Console

declare namespace Console {
  export { Console }
}

export = Console
