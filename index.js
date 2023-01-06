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
    const started = this.times.get(label)

    if (!started) {
      this.error('Warning: No such label \'' + label + '\' for console.timeEnd()')
      return
    }

    const d = process.hrtime(started)
    const ms = d[0] * 1e3 + d[1] / 1e6
    this.times.delete(label)

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

  // + clear () {}

  _print (stream, ...args) {
    // + buffer output?
    const { crayon } = this

    for (let i = 0; i < args.length; i++) {
      const arg = args[i]

      const single = generateSingleValue(arg)
      if (single !== null) {
        stream.write(single)
      } else if (typeof arg === 'object') {
        const depth = getObjectDepth(arg)
        const isDeep = depth >= 999 // + 3 // spacing temporarily disabled
        let levels = 0

        iterateObject(arg)

        function iterateObject (arg) {
          const spacingStart = isDeep ? '  '.repeat(levels + 1) : ''
          const spacingEnd = isDeep ? '  '.repeat(levels) : ''
          const isArray = Array.isArray(arg)

          if (++levels >= 4 && !isObjectEmpty(arg)) {
            let type = isArray ? 'Array' : (typeof arg)
            type = type[0].toUpperCase() + type.slice(1)
            stream.write(crayon.cyan('[' + type + ']'))
            return
          }

          stream.write(isArray ? '[' : '{')

          let first = true

          for (const key in arg) {
            const k = isArray ? parseInt(key, 10) : key

            if (first) stream.write(isDeep ? '\n' + spacingStart : ' ')
            else stream.write(isDeep ? ',\n' + spacingStart : ', ')
            first = false

            const isNumeric = isFinite(k)
            const name = isArray && isNumeric ? '' : (generateSingleKey(key) + ': ')
            stream.write(name)

            const single = generateSingleValue(arg[k], { stringColor: true })
            if (single !== null) {
              stream.write(single)
            } else if (typeof arg[k] === 'object') {
              iterateObject(arg[k])
            } else {
              throw new Error('Argument not supported (' + (typeof arg[k]) + '): ' + arg[k])
            }
          }

          const symbols = Object.getOwnPropertySymbols(arg)

          for (const symbol of symbols) {
            if (first) stream.write(isDeep ? '\n' + spacingStart : ' ')
            else stream.write(isDeep ? ',\n' + spacingStart : ', ')
            first = false

            const name = isArray ? '' : ('[' + symbol.toString() + ']: ')
            stream.write(name)

            const single = generateSingleValue(arg[symbol])
            stream.write(single)
          }

          if (!first) stream.write(isDeep ? '\n' + spacingEnd : ' ')

          stream.write(isArray ? ']' : '}')

          levels = 0
        }
      } else {
        throw new Error('Argument not supported (' + (typeof arg) + '): ' + arg)
      }

      if (i + 1 !== args.length) stream.write(' ')
    }

    stream.write('\n')

    function generateSingleKey (key) {
      if (key === '') return crayon.green("''")

      const names = ['undefined', 'null', 'true', 'false', 'NaN', 'Infinity']
      if (names.indexOf(key) > -1) return key

      if (isAlphaNumeric(key) && !isFinite(key)) return key

      return crayon.green("'" + key + "'")
    }

    function generateSingleValue (value, { stringColor = false } = {}) {
      if (typeof value === 'undefined') return crayon.blackBright('undefined')
      if (value === null) return crayon.whiteBright(crayon.bold('null'))

      if (typeof value === 'string') return stringColor ? crayon.green("'" + value + "'") : value // + dynamic quotes?
      if (typeof value === 'number') return crayon.yellow(value)
      if (typeof value === 'boolean') return crayon.yellow(value)
      if (typeof value === 'function') return crayon.cyan(value.name ? '[Function: ' + value.name + ']' : '[Function (anonymous)]')
      if (typeof value === 'symbol') return crayon.green(value.toString())

      if (value instanceof Error) return value.stack
      if (value instanceof String) return "[String: '" + value.toString() + "']" // + dynamic quotes
      if (value instanceof Number) return '[Number: ' + value.toString() + ']'
      if (value instanceof Boolean) return '[Boolean: ' + value.toString() + ']'
      if (value instanceof Date) return value.toISOString()

      if (value instanceof Map) return 'Map(' + value.size + ') {' + (value.size ? ' ... ' : '') + '}'
      if (value instanceof Set) return 'Set(' + value.size + ') {' + (value.size ? ' ... ' : '') + '}'

      if (value instanceof WeakMap) return 'WeakMap { <items unknown> }'
      if (value instanceof WeakSet) return 'WeakSet { <items unknown> }'

      if (value instanceof Int8Array) return 'Int8Array(' + value.length + ') ' + outputArray(value)
      if (value instanceof Int16Array) return 'Int16Array(' + value.length + ') ' + outputArray(value)
      if (value instanceof Int32Array) return 'Int32Array(' + value.length + ') ' + outputArray(value)

      return null
    }
  }
}

function outputArray (arr) {
  if (arr.length === 0) return '[]'

  const max = arr.length > 64 ? 64 : arr.length // + Node is 100 + dynamic spacing depending on 16, 32, etc
  let output = '[ '

  for (let i = 0; i < max; i++) {
    output += arr[i] + ', '
  }

  if (arr.length <= 64) {
    output = output.slice(0, output.length - 2) // remove comma
  } else {
    const left = arr.length - 64
    output += '... ' + left + ' more item' + (left >= 2 ? 's' : '')
  }

  output += ' ]'

  return output
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
function getObjectDepth (obj) {
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
}

function isObjectEmpty (obj) {
  for (const k in obj) return false // eslint-disable-line no-unreachable-loop
  return true
}

// from stackoverflow obvs!
function isAlphaNumeric (str) {
  let code, i, len

  for (i = 0, len = str.length; i < len; i++) {
    code = str.charCodeAt(i)
    if (!(code > 47 && code < 58) && // numeric (0-9)
        !(code > 64 && code < 91) && // upper alpha (A-Z)
        !(code > 96 && code < 123)) { // lower alpha (a-z)
      return false
    }
  }

  return true
}

module.exports = new Console()
module.exports.Console = Console
