const inspect = require('bare-inspect')

module.exports = class Console {
  constructor (opts = {}) {
    this._stdout = adaptStream(opts.stdout)
    this._stderr = adaptStream(opts.stderr)

    this._colors = opts.colors === true
    this._timers = new Map()
  }

  log (...args) {
    let out = ''
    let first = true

    for (const arg of args) {
      if (first) first = false
      else out += ' '

      out += typeof arg === 'string' ? arg : inspect(arg, { colors: this._colors })
    }

    this._stdout.write(out + '\n')
  }

  error (...args) {
    let out = ''
    let first = true

    for (const arg of args) {
      if (first) first = false
      else out += ' '

      out += typeof arg === 'string' ? arg : inspect(arg, { colors: this._colors })
    }

    this._stderr.write(out + '\n')
  }

  time (label = 'default') {
    if (this._timers.has(label)) {
      this.error('Warning: Label \'' + label + '\' already exists for console.time()')
      return
    }

    this._timers.set(label, process.hrtime())
  }

  timeEnd (label = 'default') {
    const started = this._timers.get(label)

    if (!started) {
      this.error('Warning: No such label \'' + label + '\' for console.timeEnd()')
      return
    }

    const d = process.hrtime(started)
    const ms = d[0] * 1e3 + d[1] / 1e6
    this._timers.delete(label)

    if (ms > 1000) this.log(label + ': ' + (ms / 1000).toFixed(3) + 's')
    else this.log(label + ': ' + ms.toFixed(3) + 'ms')
  }

  trace (...messages) {
    const { stack } = new Error()

    const first = stack.indexOf('\n')
    const second = stack.indexOf('\n', first + 1)
    const start = second > -1 ? second : 0

    this.error('Trace: ' + messages.join(' ') + stack.slice(start))
  }
}

function adaptStream (stream) {
  return typeof stream === 'function' ? { write: stream } : stream
}
