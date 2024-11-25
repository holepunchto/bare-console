const Log = require('bare-logger')
const hrtime = require('bare-hrtime')

module.exports = exports = class Console {
  constructor(log = new Log()) {
    const timers = new Map()
    const counters = new Map()

    // https://console.spec.whatwg.org/#debug
    this.debug = function debug(...data) {
      log.debug(...data)
    }

    // https://console.spec.whatwg.org/#info
    this.info = function info(...data) {
      log.info(...data)
    }

    // https://console.spec.whatwg.org/#warn
    this.warn = function warn(...data) {
      log.warn(...data)
    }

    // https://console.spec.whatwg.org/#error
    this.error = function error(...data) {
      log.error(...data)
    }

    // https://console.spec.whatwg.org/#log
    this.log = this.info

    // https://console.spec.whatwg.org/#clear
    this.clear = function clear() {
      log.clear()
    }

    // https://console.spec.whatwg.org/#time
    this.time = function time(label = 'default') {
      if (timers.has(label)) {
        this.warn(`Warning: Label '${label}' already exists for console.time()`)
        return
      }

      timers.set(label, hrtime())
    }

    // https://console.spec.whatwg.org/#timelog
    this.timeLog = function timeLog(label = 'default', ...data) {
      const started = timers.get(label)

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
    this.timeEnd = function timeEnd(label = 'default') {
      this.timeLog(label)

      timers.delete(label)
    }

    // https://console.spec.whatwg.org/#count
    this.count = function count(label = 'default') {
      const count = counters.get(label) || 1

      this.log(`${label}: ${count}`)

      counters.set(label, count + 1)
    }

    // https://console.spec.whatwg.org/#countreset
    this.countReset = function countReset(label = 'default') {
      counters.delete(label)
    }

    // https://console.spec.whatwg.org/#trace
    this.trace = function trace(...data) {
      const err = {
        name: 'Trace',
        message: log.format(...data),
        stack: null
      }

      if (Error.captureStackTrace) {
        Error.captureStackTrace(err, this.trace)
      }

      this.error(err.stack)
    }

    // https://console.spec.whatwg.org/#assert
    this.assert = function assert(condition, ...data) {
      if (condition) return

      if (data.length === 0) data.push('Assertion failed')
      else if (typeof data[0] !== 'string') data.unshift('Assertion failed')
      else data[0] = `Assertion failed: ${data[0]}`

      this.error(...data)
    }
  }

  // For Node.js compatibility
  get Console() {
    return Console
  }
}

exports.Console = exports // For Node.js compatibility
