const { Crayon } = require('tiny-crayon')

class Console {
  constructor (opts = {}) {
    const { isTTY } = adaptStream(opts.stdout || process._stdout || process.stdout)
    this.crayon = new Crayon({ isTTY })

    this.log = this._print.bind(this, adaptStream(opts.stdout || process._stdout || process.stdout))
    this.error = this._print.bind(this, adaptStream(opts.stderr || process._stderr || process.stderr))

    this.times = new Map()
  }

  time (label = 'default') {
    if (this.times.has(label)) {
      this.error('Warning: Label \'' + label + '\' already exists for console.time()')
      return
    }

    this.times.set(label, process.hrtime())
  }

  timeEnd (label = 'default') {
    if (!this.times.has(label)) {
      this.error('Warning: No such label \'' + label + '\' for console.timeEnd()')
      return
    }

    const started = this.times.get(label)
    const d = process.hrtime(started)
    this.times.delete(label)

    const ms = d[0] * 1e3 + d[1] / 1e6
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

  _print (stream, ...args) {
    /* if (args.length === 0) {
      stream.write('\n')
      return
    } */

    for (let i = 0; i < args.length; i++) {
      const arg = args[i]
      // console.log('args', i, arg)

      if (typeof arg === 'undefined') stream.write(this.crayon.blackBright('undefined'))
      else if (arg === null) stream.write(this.crayon.whiteBright(this.crayon.bold('null')))
      else if (typeof arg === 'string') stream.write(arg)
      else if (typeof arg === 'number') stream.write(this.crayon.yellow(arg))
      else if (typeof arg === 'boolean') stream.write(this.crayon.yellow(arg))
      else if (typeof arg === 'function') stream.write(this.crayon.cyan(arg.name ? '[Function: ' + arg.name + ']' : '[Function (anonymous)]'))
      else if (arg instanceof Error) stream.write(arg.stack)
      else if (typeof arg === 'object') {
        // + maybe consider buffering output and write all at once, or just cork/uncork?

        // const depth = getObjectDepth(arg)
        let levels = 0

        const { crayon } = this
        iterateObject(arg)

        function iterateObject (arg) {
          const isArray = Array.isArray(arg)

          if (++levels >= 4 && !isObjectEmpty(arg)) {
            let type = Array.isArray(arg) ? 'Array' : (typeof arg)
            type = type[0].toUpperCase() + type.slice(1)
            stream.write(crayon.cyan('[' + type + ']'))
            return
          }

          stream.write(isArray ? '[' : '{')

          let first = true

          for (let k in arg) {
            if (first) stream.write(' ')
            else stream.write(', ')
            first = false

            if (isArray) k = parseInt(k, 10)

            const name = isFinite(k) ? '' : (k + ': ')
            stream.write(name)

            // + obvs should reuse types somehow! so just basic support for now
            if (typeof arg[k] === 'undefined') stream.write(crayon.blackBright('undefined'))
            else if (arg[k] === null) stream.write(crayon.whiteBright(crayon.bold('null')))
            else if (typeof arg[k] === 'string') stream.write(crayon.green("'" + arg[k] + "'"))
            else if (typeof arg[k] === 'number') stream.write(crayon.yellow(arg[k]))
            else if (typeof arg[k] === 'boolean') stream.write(crayon.yellow(arg[k]))
            else if (typeof arg[k] === 'function') stream.write(crayon.cyan(arg[k].name ? '[Function: ' + arg[k].name + ']' : '[Function (anonymous)]'))
            else if (arg[k] instanceof Error) stream.write(arg[k].stack)
            else if (typeof arg[k] === 'object') iterateObject(arg[k])
            else {
              stream.write('*not-supported-yet:' + (typeof arg[k]) + '-' + arg[k] + '*')
            }
          }

          if (!first) stream.write(' ')

          stream.write(isArray ? ']' : '}')

          levels = 0
        }
      } else {
        throw new Error('Argument not supported (' + (typeof arg) + '): ' + arg)
      }

      if (i + 1 !== args.length) stream.write(' ')
    }

    stream.write('\n')
  }
}

function adaptStream (stream) {
  // pearjs
  if (typeof stream === 'function') {
    return { isTTY: true, write: stream }
  }
  return stream
}

// + should be non recursive
// + should be able to stop at a max depth like 5 to avoid unnecessarily keep going
/* function getObjectDepth (obj) {
  return iterate(obj)

  function iterate (o) {
    for (const k in o) {
      //  o.hasOwnProperty(k) &&
      if (typeof o[k] === 'object') {
        return 1 + iterate(o[k])
      }
    }
    return 1
  }
} */

function isObjectEmpty (obj) {
  for (const k in obj) return false // eslint-disable-line no-unreachable-loop
  return true
}

module.exports = new Console()
module.exports.Console = Console

/*
Object [console] {
  log: [Function: log],
  warn: [Function: warn],
  dir: [Function: dir],
  time: [Function: time],
  timeEnd: [Function: timeEnd],
  timeLog: [Function: timeLog],
  trace: [Function: trace],
  assert: [Function: assert],
  clear: [Function: clear],
  count: [Function: count],
  countReset: [Function: countReset],
  group: [Function: group],
  groupEnd: [Function: groupEnd],
  table: [Function: table],
  debug: [Function: debug],
  info: [Function: info],
  dirxml: [Function: dirxml],
  error: [Function: error],
  groupCollapsed: [Function: groupCollapsed],
  Console: [Function: Console],
  profile: [Function: profile],
  profileEnd: [Function: profileEnd],
  timeStamp: [Function: timeStamp],
  context: [Function: context]
}
*/
