const { Crayon } = require('tiny-crayon')
const crayon = new Crayon({ isTTY: true })

class Console {
  constructor (opts = {}) {
    this.log = this._print.bind(this, opts.stdout || process._stdout || process.stdout)
    this.error = this._print.bind(this, opts.stderr || process._stderr || process.stderr)

    this.timers = new Map()
  }

  /*
  0.052ms
  489.275ms
  4.596s
  */

  time (label = 'default') {
    // + should not throw
    if (this.timers.has(label)) throw new Error('Label \'' + label + '\' already exists for console.time()')
    this.timers.set(label, Date.now()) // + nano
  }

  timeEnd (label = 'default') {
    // + should not throw
    if (!this.timers.has(label)) throw new Error('No such label \'' + label + '\' for console.timeEnd()')

    const t = this.timers.get(label)
    this.timers.delete(label)

    const formatted = Date.now() - t
    this.log(label + ': ' + formatted + 'ms')
  }

  trace (...messages) {
    let { stack } = new Error(messages.join(' '))
    const lines = stack.split('\n')
    lines.splice(1, 1)
    stack = lines.join('\n')
    this.error(stack.replace('Error:', 'Trace:'))
  }

  _print (stream, ...args) {
    if (typeof stream === 'function') stream = { write: stream } // +

    /* if (args.length === 0) {
      stream.write('\n')
      return
    } */

    for (let i = 0; i < args.length; i++) {
      const arg = args[i]
      // console.log('args', i, arg)

      if (typeof arg === 'undefined') stream.write(crayon.blackBright('undefined'))
      else if (arg === null) stream.write(crayon.whiteBright(crayon.bold('null')))
      else if (typeof arg === 'string') stream.write(arg)
      else if (typeof arg === 'number') stream.write(crayon.yellow(arg))
      else if (typeof arg === 'boolean') stream.write(crayon.yellow(arg))
      else if (typeof arg === 'function') stream.write(crayon.cyan(arg.name ? '[Function: ' + arg.name + ']' : '[Function (anonymous)]'))
      else if (typeof arg === 'object') {
        // + maybe consider buffering output and write all at once, or just cork/uncork?

        const depth = getObjectDepth(arg)
        let levels = 0

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

// Simplified from https://github.com/crowelch/object-depth
// + should be non recursive
// + should be able to stop at a max depth like 5 to avoid unnecessarily keep going
function getObjectDepth (obj) {
  return iterate(obj)

  function iterate (o) {
    for (const k in o) {
      if (/* o.hasOwnProperty(k) && */ typeof o[k] === 'object') {
        return 1 + iterate(o[k])
      }
    }
    return 1
  }
}

function isObjectEmpty (obj) {
  for (let k in obj) return false
  return true
}

module.exports = new Console()

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
