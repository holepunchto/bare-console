const { Crayon } = require('tiny-crayon')

class Console {
  constructor (opts = {}) {
    const { isTTY } = adaptStream(opts.stdout || opts.stderr)
    this.colors = typeof opts.colors === 'boolean' ? opts.colors : isTTY
    this.crayon = new Crayon({ isTTY: this.colors })

    this.log = this._print.bind(this, adaptStream(opts.stdout))
    this.error = this._print.bind(this, adaptStream(opts.stderr))

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
    const { crayon } = this
    const paint = new Paint()
    let identifier = 0

    for (let i = 0; i < args.length; i++) {
      const arg = args[i]

      const single = generateSingleValue(arg, { escape: false })
      if (single !== null) {
        paint.push('value', single)
      } else if (typeof arg === 'object') {
        let levels = 0

        iterateObject(arg)

        function iterateObject (arg, backward = new WeakSet(), forward = new WeakSet(), add = true) {
          if (add) backward.add(arg)
          else forward.add(arg)

          const id = identifier++
          const isArray = Array.isArray(arg)

          levels++

          if (levels >= 4 && !isObjectEmpty(arg)) {
            let type = isArray ? 'Array' : (typeof arg)
            type = type[0].toUpperCase() + type.slice(1)
            paint.push('value', crayon.cyan('[' + type + ']'), { id })
            levels--
            return paint.width[id]
          }

          paint.push('open', isArray ? '[' : '{', { id })

          let first = true

          for (const key in arg) {
            if (first) {
              paint.push('spacing-start', null, { id, levels })
            } else {
              paint.push('separator', ',', { id })
              paint.push('spacing-sep', null, { id, levels })
            }
            first = false

            const k = isArray ? parseInt(key, 10) : key
            const isNumeric = isArray && isFinite(k)
            const v = arg[isNumeric ? k : key]

            const name = isNumeric ? '' : (generateSingleKey(key) + ': ')
            paint.push('key', name, { id })

            const single = generateSingleValue(v, { levels, stringColor: true })
            if (single !== null) {
              paint.push('value', single, { id })
            } else if (typeof v === 'object') {
              if (backward.has(v) || (!add && forward.has(v))) {
                paint.push('value', crayon.cyan('[Circular]'), { id })
                continue
              }

              const subWidth = iterateObject(v, backward, forward, false)
              paint.width[id].child += subWidth.self + subWidth.child // + double check after colors fix
            } else {
              throw new Error('Argument not supported (' + (typeof v) + '): ' + v)
            }
          }

          const symbols = Object.getOwnPropertySymbols(arg)

          for (const symbol of symbols) {
            if (first) {
              paint.push('spacing-start', null, { id, levels })
            } else {
              paint.push('separator', ',')
              paint.push('spacing-sep', null, { id, levels })
            }
            first = false

            const name = isArray ? '' : ('[' + symbol.toString() + ']: ')
            paint.push('key', name, { id })

            const single = generateSingleValue(arg[symbol], { levels })
            paint.push('value', single, { id })
          }

          if (!first) paint.push('spacing-end', null, { id, levels })
          paint.push('close', isArray ? ']' : '}', { id })

          levels--

          return paint.width[id]
        }
      } else {
        throw new Error('Argument not supported (' + (typeof arg) + '): ' + arg)
      }

      if (i + 1 !== args.length) paint.push('space', ' ')
    }

    paint.push('break-line', '\n')

    stream.write(paint.done())

    function generateSingleKey (key) {
      if (key === '') return crayon.green("''")

      const names = ['undefined', 'null', 'true', 'false', 'NaN', 'Infinity']
      if (names.indexOf(key) > -1) return key

      if (isKindOfAlphaNumeric(key) && !isFinite(key)) return key

      return crayon.green("'" + key + "'")
    }

    function generateSingleValue (value, { levels = 0, stringColor = false, escape = true } = {}) {
      if (typeof value === 'undefined') return crayon.blackBright('undefined')
      if (value === null) return crayon.whiteBright(crayon.bold('null'))

      if (typeof value === 'string') return stringColor ? crayon.green(dynamicQuotes(value, { escape })) : dynamicQuotes(value, { escape })
      if (typeof value === 'number') return crayon.yellow(value)
      if (typeof value === 'boolean') return crayon.yellow(value)
      if (typeof value === 'function') return crayon.cyan(value.name ? '[Function: ' + value.name + ']' : '[Function (anonymous)]')
      if (typeof value === 'symbol') return crayon.green(value.toString())
      if (typeof value === 'bigint') return value.toString() + 'n' // + edge case: typeof Object(1n) === 'object'

      if (value instanceof Promise) return 'Promise'
      if (value instanceof RegExp) return value.toString()

      // + AggregateError?
      if (value instanceof Error) return value.stack // This includes EvalError, RangeError, ReferenceError, SyntaxError, TypeError, URIError
      if (value instanceof String) return '[String: ' + dynamicQuotes(value.toString()) + ']'
      if (value instanceof Number) return '[Number: ' + value.toString() + ']'
      if (value instanceof Boolean) return '[Boolean: ' + value.toString() + ']'
      if (value instanceof Date) return value.toISOString()

      if (value instanceof Map) return 'Map(' + value.size + ') {' + (value.size ? ' ... ' : '') + '}'
      if (value instanceof Set) return 'Set(' + value.size + ') {' + (value.size ? ' ... ' : '') + '}'

      if (value instanceof WeakMap) return 'WeakMap { <items unknown> }'
      if (value instanceof WeakSet) return 'WeakSet { <items unknown> }'

      if (value instanceof Int8Array) return 'Int8Array(' + value.length + ') ' + outputArray(value, { crayon, levels })
      if (value instanceof Int16Array) return 'Int16Array(' + value.length + ') ' + outputArray(value, { crayon, levels })
      if (value instanceof Int32Array) return 'Int32Array(' + value.length + ') ' + outputArray(value, { crayon, levels })

      if (value instanceof Uint8Array) return 'Uint8Array(' + value.length + ') ' + outputArray(value, { crayon, levels })
      if (value instanceof Uint16Array) return 'Uint16Array(' + value.length + ') ' + outputArray(value, { crayon, levels })
      if (value instanceof Uint32Array) return 'Uint32Array(' + value.length + ') ' + outputArray(value, { crayon, levels })

      return null
    }
  }
}

function dynamicQuotes (str, opts = {}) {
  if (opts.escape === false) return str

  if (str.indexOf("'") === -1) return "'" + escapeString(str) + "'"
  if (str.indexOf('"') === -1) return '"' + escapeString(str) + '"'
  if (str.indexOf('`') === -1) return '`' + escapeString(str) + '`'

  return "'" + escapeString(str, true) + "'"
}

function escapeString (str, singled = false) {
  str = str
    .replace(/[\\]/g, '\\\\')
    .replace(/[/]/g, '\\/')
    .replace(/[\b]/g, '\\b')
    .replace(/[\f]/g, '\\f')
    .replace(/[\n]/g, '\\n')
    .replace(/[\r]/g, '\\r')
    .replace(/[\t]/g, '\\t')

  if (singled) str = str.replace(/[']/g, '\\\'')

  return str
}

function outputArray (arr, { crayon, levels = 0 }) {
  if (arr.length === 0) return '[]'

  const max = arr.length > 64 ? 64 : arr.length // + Node is 100 + dynamic spacing depending on 16, 32, etc
  const addSpaces = arr.length > 16

  let first = true
  let output = '['

  for (let i = 0; i < max; i++) {
    if (first) output += addSpaces ? ('\n' + '  '.repeat(1 + levels)) : ' '
    else output += addSpaces ? ',' + (i % 16 === 0 ? ('\n' + '  '.repeat(1 + levels)) : ' ') : ', '
    first = false

    output += crayon.yellow(arr[i])
  }

  if (arr.length > 64) {
    const left = arr.length - 64

    output += addSpaces ? (',\n' + '  '.repeat(1 + levels)) : ', '
    output += '... ' + left + ' more item' + (left >= 2 ? 's' : '')
  }

  if (!first) output += addSpaces ? ('\n' + '  '.repeat(levels)) : ' '

  output += ']'

  return output
}

function adaptStream (stream) {
  // pearjs
  if (typeof stream === 'function') {
    return { isTTY: true, write: stream }
  }
  return stream
}

class Paint {
  constructor () {
    this.prints = []
    this.width = { all: 0 }
  }

  push (type, chunk = null, opts = null) {
    if (typeof chunk === 'string') {
      this.width.all += chunk.length // + if colors were decoupled from chunk then width would be correct

      if (opts && opts.id !== undefined) {
        if (!this.width[opts.id]) this.width[opts.id] = { self: 0, child: 0 }
        this.width[opts.id].self += chunk.length
      }
    }

    this.prints.push({ type, chunk, ...opts })
  }

  done () {
    let output = ''

    for (const print of this.prints) {
      // raw
      if (['open', 'close', 'key', 'value', 'separator', 'space', 'break-line'].indexOf(print.type) > -1) {
        output += print.chunk
        continue
      }

      // dynamic
      if (print.type === 'spacing-start' || print.type === 'spacing-sep' || print.type === 'spacing-end') {
        const totalWidth = this.width[print.id] ? (this.width[print.id].self + this.width[print.id].child) : this.width.all
        const expand = totalWidth > 60 // + 64? double check after colors fix

        if (!expand) output += ' '
        else if (print.type === 'spacing-start') output += '\n' + '  '.repeat(print.levels)
        else if (print.type === 'spacing-sep') output += '\n' + '  '.repeat(print.levels)
        else if (print.type === 'spacing-end') output += '\n' + '  '.repeat(print.levels - 1)

        continue
      }

      throw new Error('Invalid print: ' + JSON.stringify(print))
    }

    return output
  }
}

function isObjectEmpty (obj) {
  for (const k in obj) return false // eslint-disable-line no-unreachable-loop
  return true
}

function isKindOfAlphaNumeric (str) {
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i)

    // first char, and numeric (0-9)
    if (i === 0 && (code > 47 && code < 58)) return false

    if (!(code > 47 && code < 58) && // numeric (0-9)
        !(code > 64 && code < 91) && // upper alpha (A-Z)
        !(code > 96 && code < 123) && // lower alpha (a-z)
        !(code === 95)) { // underscore (_)
      return false
    }
  }

  return true
}

module.exports = Console
