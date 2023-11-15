const inspect = require('bare-inspect')
const hrtime = require('bare-hrtime')

module.exports = class Console {
  constructor (opts = {}) {
    this._stdout = adaptStream(opts.stdout)
    this._stderr = adaptStream(opts.stderr)

    this._colors = opts.colors === true
    this._timers = new Map()

    if (opts.bind) {
      this.log = this.log.bind(this)
      this.error = this.error.bind(this)
      this.time = this.time.bind(this)
      this.timeEnd = this.timeEnd.bind(this)
      this.trace = this.trace.bind(this)
    }
  }

  log (...args) {
    this._stdout.write(formatArgs(args, { colors: this._colors }) + '\n')
  }

  error (...args) {
    this._stderr.write(formatArgs(args, { colors: this._colors }) + '\n')
  }

  time (label = 'default') {
    if (this._timers.has(label)) {
      this.error('Warning: Label \'' + label + '\' already exists for console.time()')
      return
    }

    this._timers.set(label, hrtime())
  }

  timeEnd (label = 'default') {
    const started = this._timers.get(label)

    if (!started) {
      this.error('Warning: No such label \'' + label + '\' for console.timeEnd()')
      return
    }

    const d = hrtime(started)
    const ms = d[0] * 1e3 + d[1] / 1e6
    this._timers.delete(label)

    if (ms > 1000) this.log(label + ': ' + (ms / 1000).toFixed(3) + 's')
    else this.log(label + ': ' + ms.toFixed(3) + 'ms')
  }

  trace (...args) {
    const err = { name: 'Trace', message: formatArgs(args, { colors: this._colors }) }
    Error.captureStackTrace(err, this.trace)
    this.error(err.stack)
  }
}

function adaptStream (stream) {
  return typeof stream === 'function' ? { write: stream } : stream
}

function formatArgs (args, opts) {
  let out = ''
  let first = true

  for (const arg of args) {
    if (first) first = false
    else out += ' '

    out += typeof arg === 'string' ? arg : inspect(arg, opts)
  }

  return out
}
