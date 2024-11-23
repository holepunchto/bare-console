const { formatWithOptions } = require('bare-format')
const hrtime = require('bare-hrtime')

module.exports = exports = class Console {
  constructor(opts = {}) {
    const { stdout, stderr = stdout, colors = stdout.isTTY === true } = opts

    this._stdout = stdout
    this._stderr = stderr
    this._colors = colors
    this._timers = new Map()
    this._counters = new Map()
  }

  // https://console.spec.whatwg.org/#log
  log = (...data) => {
    this._stdout.write(
      formatWithOptions({ colors: this._colors }, ...data) + '\n'
    )
  }

  // https://console.spec.whatwg.org/#debug
  debug = this.log

  // https://console.spec.whatwg.org/#info
  info = this.log

  // https://console.spec.whatwg.org/#error
  error = (...data) => {
    this._stderr.write(
      formatWithOptions({ colors: this._colors }, ...data) + '\n'
    )
  }

  // https://console.spec.whatwg.org/#warn
  warn = this.error

  // https://console.spec.whatwg.org/#time
  time = (label = 'default') => {
    if (this._timers.has(label)) {
      this.warn(`Warning: Label '${label}' already exists for console.time()`)
      return
    }

    this._timers.set(label, hrtime())
  }

  // https://console.spec.whatwg.org/#timelog
  timeLog = (label = 'default', ...data) => {
    const started = this._timers.get(label)

    if (started === undefined) {
      this.warn(`Warning: No such label '${label}' for console.timeEnd()`)
      return
    }

    const elapsed = hrtime(started)
    const ms = elapsed[0] * 1e3 + elapsed[1] / 1e6

    if (ms > 1000) this.log(`${label}: ${(ms / 1000).toFixed(3)}s`, ...data)
    else this.log(`${label}: ${ms.toFixed(3)}ms`, ...data)
  }

  // https://console.spec.whatwg.org/#timeend
  timeEnd = (label = 'default') => {
    this.timeLog(label)

    this._timers.delete(label)
  }

  // https://console.spec.whatwg.org/#count
  count = (label = 'default') => {
    const count = this._counters.get(label) || 1

    this.log(`${label}: ${count}`)

    this._counters.set(label, count + 1)
  }

  // https://console.spec.whatwg.org/#countreset
  countReset = (label = 'default') => {
    this._counters.delete(label)
  }

  // https://console.spec.whatwg.org/#trace
  trace = (...data) => {
    const err = {
      name: 'Trace',
      message: formatWithOptions({ colors: this._colors }, ...data),
      stack: null
    }

    if (Error.captureStackTrace) {
      Error.captureStackTrace(err, this.trace)
    }

    this.error(err.stack)
  }

  // https://console.spec.whatwg.org/#assert
  assert = (condition, ...data) => {
    if (condition) return

    if (data.length === 0) data.push('Assertion failed')
    else if (typeof data[0] !== 'string') data.unshift('Assertion failed')
    else data[0] = `Assertion failed: ${data[0]}`

    this.error(...data)
  }

  // https://console.spec.whatwg.org/#clear
  clear = () => {};

  [Symbol.for('bare.inspect')]() {
    return {
      __proto__: { constructor: Console },

      assert: this.assert,
      clear: this.clear,
      count: this.count,
      countReset: this.countReset,
      debug: this.debug,
      error: this.error,
      info: this.info,
      log: this.log,
      time: this.time,
      timeEnd: this.timeEnd,
      timeLog: this.timeLog,
      trace: this.trace,
      warn: this.warn
    }
  }
}

exports.Console = exports // For Node.js compatibility
