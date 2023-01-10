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
    const { crayon } = this
    const prints = []
    let width = { all: 0 }
    let identifier = 0

    const buffering = (type, chunk = null, opts = null) => {
      // + decouple colors from chunk, otherwise width is wrong
      // console.log('buffering', type, { id: opts ? opts.id : undefined })

      if (typeof chunk === 'string') {
        width.all += chunk.length

        if (opts && opts.id !== undefined) {
          if (!width[opts.id]) width[opts.id] = { self: 0, child: 0 }
          width[opts.id].self += chunk.length
        }
      }

      prints.push({ type, chunk, ...opts })
    }

    const compute = (prints, spacingDepth = 0) => {
      let output = ''

      for (const print of prints) {
        // raw
        if (['open', 'close', 'key', 'value', 'separator', 'space', 'break-line'].indexOf(print.type) > -1) {
          output += print.chunk
          continue
        }

        // dynamic
        if (print.type === 'spacing-start' || print.type === 'spacing-sep' || print.type === 'spacing-end') {
          const expand = (width[print.id] !== undefined ? width[print.id].self + width[print.id].child : width.all) > 60 // + 64?
          // console.log(print, { expand }, width[print.id])

          if (!expand/* || print.id >= spacingDepth */) {
            output += ' '
            continue
          }

          if (print.type === 'spacing-start') {
            output += '\n' + '  '.repeat(print.levels2)
            continue
          } else if (print.type === 'spacing-sep') {
            output += '\n' + '  '.repeat(print.levels2)
            continue
          } else if (print.type === 'spacing-end') {
            output += '\n' + '  '.repeat(print.levels2 > 0 ? print.levels2 - 1 : 0)
            continue
          }
        }

        throw new Error('Invalid print: ' + JSON.stringify(print))
      }

      return output
    }

    for (let i = 0; i < args.length; i++) {
      const arg = args[i]

      const single = generateSingleValue(arg)
      if (single !== null) {
        buffering('value', single)
      } else if (typeof arg === 'object') {
        const depth = getObjectDepth(arg, 10)
        let levels = 0
        let levels2 = 0

        iterateObject(arg)

        function iterateObject (arg, backward = new WeakSet(), forward = new WeakSet(), add = true) {
          if (add) backward.add(arg)
          else forward.add(arg)

          const id = identifier++
          const isArray = Array.isArray(arg)

          levels2++

          if (levels2 /*++levels*/ >= 4 && !isObjectEmpty(arg)) {
            let type = isArray ? 'Array' : (typeof arg)
            type = type[0].toUpperCase() + type.slice(1)
            buffering('value', crayon.cyan('[' + type + ']'), { id })
            levels2--
            return width[id]
          }

          buffering('open', isArray ? '[' : '{', { id })

          let first = true

          for (const key in arg) {
            if (first) {
              buffering('spacing-start', null, { id, levels2, depth })
            } else {
              buffering('separator', ',', { id })
              buffering('spacing-sep', null, { id, levels2, depth })
            }
            first = false

            const k = isArray ? parseInt(key, 10) : key
            const isNumeric = isArray && isFinite(k)
            const v = arg[isNumeric ? k : key]

            const name = isNumeric ? '' : (generateSingleKey(key) + ': ')
            buffering('key', name, { id })

            const single = generateSingleValue(v, { stringColor: true })
            if (single !== null) {
              buffering('value', single, { id })
            } else if (typeof v === 'object') {
              if (backward.has(v) || (!add && forward.has(v))) {
                buffering('value', crayon.cyan('[Circular]'), { id })
                continue
              }

              const subWidth = iterateObject(v, backward, forward, false)
              width[id].child += subWidth.self + subWidth.child
              // console.log({ subWidth, width: width[id] })
            } else {
              throw new Error('Argument not supported (' + (typeof v) + '): ' + v)
            }
          }

          const symbols = Object.getOwnPropertySymbols(arg)

          for (const symbol of symbols) {
            if (first) {
              buffering('spacing-start', null, { id, levels2, depth })
            } else {
              buffering('separator', ',')
              buffering('spacing-sep', null, { id, levels2, depth })
            }
            first = false

            const name = isArray ? '' : ('[' + symbol.toString() + ']: ')
            buffering('key', name, { id })

            const single = generateSingleValue(arg[symbol])
            buffering('value', single, { id })
          }

          if (!first) buffering('spacing-end', null, { id, levels2, depth })
          buffering('close', isArray ? ']' : '}', { id })

          levels = 0
          levels2--

          return width[id]
        }
      } else {
        throw new Error('Argument not supported (' + (typeof arg) + '): ' + arg)
      }

      if (i + 1 !== args.length) buffering('space', ' ')
    }

    buffering('break-line', '\n')

    // + optimize!
    /* let output = null
    for (let i = 0; i < 4; i++) {
      output = compute(prints, i)
      const longestLine = output.split('\n').reduce((a, b) => a.length > b.length ? a : b)
      if (longestLine.length < 60) break
    }
    stream.write(output) */
    const output = compute(prints)
    stream.write(output)

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

      if (value instanceof Promise) return 'Promise'
      if (value instanceof RegExp) return value.toString()

      // + AggregateError?
      if (value instanceof Error) return value.stack // This includes EvalError, RangeError, ReferenceError, SyntaxError, TypeError, URIError
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

      if (value instanceof Uint8Array) return 'Uint8Array(' + value.length + ') ' + outputArray(value)
      if (value instanceof Uint16Array) return 'Uint16Array(' + value.length + ') ' + outputArray(value)
      if (value instanceof Uint32Array) return 'Uint32Array(' + value.length + ') ' + outputArray(value)

      return null
    }
  }
}

function outputArray (arr) {
  if (arr.length === 0) return '[]'

  const max = arr.length > 64 ? 64 : arr.length // + Node is 100 + dynamic spacing depending on 16, 32, etc
  const addSpaces = arr.length > 16

  let first = true
  let output = '['

  for (let i = 0; i < max; i++) {
    if (first) output += addSpaces ? '\n  ' : ' '
    else output += addSpaces ? ',' + (i % 16 === 0 ? '\n  ' : ' ') : ', '
    first = false

    output += arr[i]
  }

  if (arr.length > 64) {
    const left = arr.length - 64

    output += addSpaces ? ',\n  ' : ', '
    output += '... ' + left + ' more item' + (left >= 2 ? 's' : '')
  }

  if (!first) output += addSpaces ? '\n' : ' '

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

function getObjectDepth (obj, maxDepth = Infinity) {
  const refs = new WeakSet()
  const stack = [obj]
  let depth = 1

  while (stack.length) {
    const o = stack.pop()

    for (const k in o) {
      if (typeof o[k] !== 'object') continue // || !o.hasOwnProperty(k)
      if (refs.has(o[k])) continue
      if (++depth >= maxDepth) return depth

      if (o[k] !== null) {
        refs.add(o[k])
        stack.push(o[k])
      }
    }
  }

  return depth
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
