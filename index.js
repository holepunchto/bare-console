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
          const isBuffer = Buffer.isBuffer(arg) && arg.constructor.name === 'Buffer'
          const isInts = !isBuffer && isIntArray(arg)
          const isObject = !(isArray || isInts || isBuffer)
          const brackets = isBuffer ? '<>' : (isInts || isArray ? '[]' : '{}')

          levels++

          if (levels >= 4 && !isObjectEmpty(arg)) {
            let type = isArray ? 'Array' : (typeof arg)
            type = type[0].toUpperCase() + type.slice(1)
            paint.push('value', crayon.cyan('[' + type + ']'), { id })
            levels--
            return paint.width[id]
          }

          if (isInts) paint.push('open', arg.constructor.name + '(' + arg.length + ') ', { id })
          paint.push('open', brackets[0], { id })
          if (isBuffer) paint.push('open', 'Buffer', { id })

          const MAX = isObject ? Infinity : (isBuffer ? 50 : 100)
          let count = 0

          for (const key in arg) {
            const k = isObject ? key : parseInt(key, 10)
            const isNumeric = !isObject && isFinite(k)
            const v = arg[isNumeric ? k : key]

            if (isBuffer && !isNumeric && Object.hasOwn(Object.getPrototypeOf(arg), key)) continue

            if (count++ >= MAX) break

            if (count === 1) {
              paint.push('spacing-start', null, { id, levels, isArray, isInts, isBuffer, arg, k })
            } else {
              paint.push('separator', isBuffer && isNumeric ? '' : ',', { id })
              paint.push('spacing-sep', null, { id, levels, isArray, isInts, isBuffer, arg, k })
            }

            const name = isNumeric ? '' : (generateSingleKey(key) + ': ')
            paint.push('key', name, { id })

            const single = generateSingleValue(v, { levels, stringColor: true, intToHex: isBuffer })
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
            count++

            if (count === 1) {
              paint.push('spacing-start', null, { id, levels })
            } else {
              paint.push('separator', ',')
              paint.push('spacing-sep', null, { id, levels })
            }

            const name = isArray ? '' : ('[' + symbol.toString() + ']: ')
            paint.push('key', name, { id })

            const single = generateSingleValue(arg[symbol], { levels })
            paint.push('value', single, { id })
          }

          if (!isObject && arg.length > MAX) paint.push('more', null, { id, levels, isArray, isInts, isBuffer, arg, left: (arg.length - MAX) })

          if (count > 0) paint.push('spacing-end', null, { id, levels, isArray, isInts, isBuffer, arg })

          if (count === 0 && isBuffer) paint.push('spacing-sep', null, { id, levels, isArray, isInts, isBuffer, arg })

          paint.push('close', brackets[1], { id })

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

    function generateSingleValue (value, { levels = 0, stringColor = false, escape = true, intToHex = false } = {}) {
      if (typeof value === 'undefined') return crayon.blackBright('undefined')
      if (value === null) return crayon.whiteBright(crayon.bold('null'))

      if (typeof value === 'string') return stringColor ? crayon.green(dynamicQuotes(value, { escape })) : dynamicQuotes(value, { escape })
      if (typeof value === 'number') return intToHex ? numberToHex(value) : crayon.yellow(value)
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

      return null
    }
  }
}

function numberToHex (value) {
  return value.toString(16).padStart(2, '0')
}

function isIntArray (value) {
  if (value instanceof Uint8Array || value instanceof Uint16Array || value instanceof Uint32Array) return true
  if (value instanceof Int8Array || value instanceof Int16Array || value instanceof Int32Array) return true
  return false
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
        const type = print.type.replace('spacing-', '')
        const totalWidth = this.width[print.id] ? (this.width[print.id].self + this.width[print.id].child) : this.width.all
        const expand = print.isInts || print.isArray || totalWidth > 60 // + 64? double check after colors fix
        let arrayBreakpoint = 0

        if (print.isInts || print.isArray) {
          const lengths = [7, 9, 13, 17, 23, 29, 37, 45, 53]

          for (let i = lengths.length - 1; i >= 0; i--) {
            if (print.arg.length >= lengths[i]) {
              arrayBreakpoint = 4 + i // Range: 4-12
              break
            }
          }
        }

        if (print.isBuffer) {
          if (type === 'start' || type === 'sep') output += ' '
          continue
        }

        if (print.isInts || print.isArray) {
          const addSpacing = arrayBreakpoint !== 0
          const skipSpacing = type === 'sep' && !(print.k % arrayBreakpoint === 0)

          if (!addSpacing || skipSpacing) {
            output += ' '
            continue
          }
        }

        if (!expand) output += ' '
        else output += '\n' + '  '.repeat(print.levels - (type === 'end' ? 1 : 0))

        continue
      }

      if (print.type === 'more') {
        const addSpacing = !print.isBuffer
        const sep = print.isBuffer ? '' : ','

        output += addSpacing ? (',\n' + '  '.repeat(print.levels)) : (sep + ' ')
        output += '... ' + print.left + ' more ' + (print.isBuffer ? 'byte' : 'item') + (print.left >= 2 ? 's' : '')

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
