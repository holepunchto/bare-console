const test = require('brittle')
const { Console: TinyConsole } = require('./index.js')
const path = require('path')
const fs = require('fs')
const os = require('os')

test('basic log', async function (t) {
  const { nodeConsole, tinyConsole, closeAndCompare } = create(t)

  both(nodeConsole)
  both(tinyConsole)

  function both (logger) {
    logger.log()
    logger.log(undefined)
    logger.log(null)
    logger.log(undefined, null)

    logger.log('hello')
    logger.log('a', 'b', 'c')

    logger.log(NaN)
    logger.log(123)
    logger.log(-123)
    logger.log(1.23)
    logger.log(Infinity)
    logger.log(9007199254740991n)
    logger.log(BigInt('0o377777777777777777'))
    logger.log(1, NaN, 3, Infinity, -4)

    logger.log(true)
    logger.log(false)
    logger.log(true, false, true)

    const fn = () => {}
    logger.log(function () {})
    logger.log(function funcname () {})
    logger.log(() => {})
    logger.log(fn)
    logger.log(function () {}, function funcname () {}, () => {}, fn)

    logger.log([])
    logger.log({})
    logger.log([], {})
  }

  await closeAndCompare()
})

test('very basic error (really assumes that is the same as log)', async function (t) {
  const { nodeConsole, tinyConsole, closeAndCompare } = create(t)

  both(nodeConsole)
  both(tinyConsole)

  function both (logger) {
    logger.error()
    logger.error(undefined)
    logger.error(null)
    logger.error('hello')
    logger.error(123)
    logger.error(true)
    logger.error(function () {})
    logger.error([])
    logger.error({})
  }

  await closeAndCompare()
})

test('native objects', async function (t) {
  const { nodeConsole, tinyConsole, closeAndCompare } = create(t)

  const now = Date.now()

  both(nodeConsole)
  both(tinyConsole)

  function both (logger) {
    logger.log(new String('hello')) // eslint-disable-line no-new-wrappers
    // logger.log(new String("how'dy")) // + this three requires dynamic quotes
    // logger.log(new String('how\'d"y'))
    // logger.log(new String('how\'d"y\`'))
    logger.log(new Number(123)) // eslint-disable-line no-new-wrappers
    logger.log(new Boolean(false)) // eslint-disable-line no-new-wrappers
    logger.log(new Boolean(true)) // eslint-disable-line no-new-wrappers
    logger.log(new Date(now))
  }

  await closeAndCompare()
})

test('native classes', async function (t) {
  const { nodeConsole, tinyConsole, closeAndCompare } = create(t)

  both(nodeConsole)
  both(tinyConsole)

  function both (logger) {
    logger.log(Date)
    logger.log(String)
    logger.log(Number)
    logger.log(Object)
    logger.log(Array)
    logger.log(Function)
    logger.log(Symbol)
    logger.log(Map)
  }

  await closeAndCompare()
})

test('errors', async function (t) {
  const { nodeConsole, tinyConsole, closeAndCompare } = create(t)

  const error = new Error('Something happened')
  const evalError = new EvalError('Something happened', 'example.js', 10)
  const rangeError = new RangeError('Something happened')
  const referenceError = new ReferenceError('Something happened')
  const syntaxError = new SyntaxError('Something happened')
  const typeError = new TypeError('Something happened')
  const uriError = new URIError('Something happened')

  both(nodeConsole)
  both(tinyConsole)

  function both (logger) {
    logger.error(error)
    logger.error(evalError)
    logger.error(rangeError)
    logger.error(referenceError)
    logger.error(syntaxError)
    logger.error(typeError)
    logger.error(uriError)

    // + spacing is different
    // logger.error([error])
    // logger.error({ err: error })
  }

  await closeAndCompare()
})

test('symbols', async function (t) {
  const { nodeConsole, tinyConsole, closeAndCompare } = create(t)

  both(nodeConsole)
  both(tinyConsole)

  function both (logger) {
    logger.log(Symbol.for('hello'))
    logger.log([Symbol.for('hello')])
    logger.log({ sym: Symbol.for('hello') })
  }

  await closeAndCompare()
})

test('values as keys', async function (t) {
  const { nodeConsole, tinyConsole, closeAndCompare } = create(t)

  both(nodeConsole)
  both(tinyConsole)

  function both (logger) {
    logger.log({ [undefined]: true })
    logger.log({ [null]: true })
    logger.log({ [123]: true }) // eslint-disable-line no-useless-computed-key
    logger.log({ [-123]: true })
    logger.log({ [false]: true })
    logger.log({ [NaN]: true })
    logger.log({ [Infinity]: true })
    logger.log({ [function () {}]: true })
    logger.log({ [() => {}]: true })
    logger.log({ [{}]: true })
    logger.log({ [[]]: true })
    logger.log({ [{ a: 1 }]: true })
    logger.log({ [[1, 2, 3]]: true })
    logger.log({ aa: true, [Symbol.for('bb')]: true, cc: true, [Symbol.for('dd')]: true })

    logger.log({ 'hi': true }) // eslint-disable-line quote-props
    logger.log({ 'h i': true })
    logger.log({ 'h,i': true })

    logger.log({ undefined: true })
    logger.log({ null: true })
    logger.log({ false: true })
    logger.log({ true: true })
    logger.log({ NaN: true })
    logger.log({ Infinity: true })
  }

  await closeAndCompare()
})

test('deep objects', async function (t) {
  const { nodeConsole, tinyConsole, closeAndCompare } = create(t)

  both(nodeConsole)
  both(tinyConsole)

  function both (logger) {
    logger.log({ a: true, b: function () {}, c: { d: 'hi' }, e: [1, { f: 2 }] })

    logger.log({ a: { b: { c: { d: { e: { f: { g: {} } } } } } } })

    logger.log({ a: { b: { c: [{ d: { e: { f: { g: {} } } } }] } } })

    logger.log({ a: { b: { a: {}, b: [], c: '', d: 1 } } })

    logger.log({ a: { a: 1 }, b: [1], c: 'aa', d: 123, e: () => {}, f: NaN })
  }

  await closeAndCompare()
})

test.skip('native Map', async function (t) {
  const { nodeConsole, tinyConsole, closeAndCompare } = create(t)

  both(nodeConsole)
  both(tinyConsole)

  function both (logger) {
    logger.log(new Map())

    const m = new Map()
    m.set('a', 'hello')
    m.set('b', true)
    m.set('c', 123)
    logger.log(m)

    const m2 = new Map()
    m2.set('a', 'hello')
    m2.set('b', ['a', 2, false])
    m2.set('c', [{ number: 123 }])
    m2.set('d', [{ a: { b: { c: { d: true } } } }])
    logger.log(m2)
  }

  await closeAndCompare()
})

test.skip('native Set', async function (t) {
  const { nodeConsole, tinyConsole, closeAndCompare } = create(t)

  both(nodeConsole)
  both(tinyConsole)

  function both (logger) {
    logger.log(new Set())

    const s = new Set(['hello', true, 123])
    logger.log(s)

    const s2 = new Set(['hello', ['a', 2, false], [{ number: 123 }], [{ a: { b: { c: { d: true } } } }]])
    logger.log(s2)
  }

  await closeAndCompare()
})

test.skip('native WeakMap', async function (t) {
  const { nodeConsole, tinyConsole, closeAndCompare } = create(t)

  both(nodeConsole)
  both(tinyConsole)

  function both (logger) {
    logger.log(new WeakMap())

    const m = new WeakMap()
    m.set({}, 'hello')
    m.set({}, true)
    m.set({}, 123)
    logger.log(m)

    const m2 = new WeakMap()
    m2.set({}, 'hello')
    m2.set({}, ['a', 2, false])
    m2.set({}, [{ number: 123 }])
    m2.set({}, [{ a: { b: { c: { d: true } } } }])
    logger.log(m2)
  }

  await closeAndCompare()
})

test.skip('native WeakMap', async function (t) {
  const { nodeConsole, tinyConsole, closeAndCompare } = create(t)

  both(nodeConsole)
  both(tinyConsole)

  function both (logger) {
    logger.log(new WeakSet())

    const s = new WeakSet([{}, {}, {}])
    logger.log(s)

    const s2 = new WeakSet([{}, ['a', 2, false], [{ number: 123 }], [{ a: { b: { c: { d: true } } } }]])
    logger.log(s2)
  }

  await closeAndCompare()
})

test.skip('native Int8Array, Int16Array, and Int32Array', async function (t) {
  for (const length of [0, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024]) {
    t.test('length ' + length, async function (t) {
      const { nodeConsole, tinyConsole, closeAndCompare } = create(t)

      both(nodeConsole)
      both(tinyConsole)

      function both (logger) {
        const arr = new Array(length).fill(1)
        logger.log(new Int8Array(arr))
        logger.log(new Int16Array(arr))
        logger.log(new Int32Array(arr))
      }

      await closeAndCompare()
    })
  }
})

test.skip('native Uint8Array, Uint16Array, and Uint32Array', async function (t) {
  for (const length of [0, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024]) {
    t.test('length ' + length, async function (t) {
      const { nodeConsole, tinyConsole, closeAndCompare } = create(t)

      both(nodeConsole)
      both(tinyConsole)

      function both (logger) {
        const arr = new Array(length).fill(1)
        logger.log(new Uint8Array(arr))
        logger.log(new Uint16Array(arr))
        logger.log(new Uint32Array(arr))
      }

      await closeAndCompare()
    })
  }
})

test('array but has a key value', async function (t) {
  const { nodeConsole, tinyConsole, closeAndCompare } = create(t)

  both(nodeConsole)
  both(tinyConsole)

  function both (logger) {
    const arr = [1, 2, 3]
    arr.kv = 'hi'
    logger.log(arr)

    const arr2 = [1, 2, 3]
    arr2.kv = { prop: 'hi' }
    logger.log(arr2)
  }

  await closeAndCompare()
})

test.skip('circular references', async function (t) {
  const { nodeConsole, tinyConsole, closeAndCompare } = create(t)

  both(nodeConsole)
  both(tinyConsole)

  function both (logger) {
    const obj = { root: null }
    obj.root = obj
    logger.log(obj)

    const obj2 = [{ root: null }]
    obj2.root = obj2
    logger.log(obj2)

    const obj3 = { sub: { root: null, sub2: { obj, obj2 } } }
    obj3.sub.root = obj3
    logger.log(obj3)

    const obj4 = [{ root: null }]
    obj4[0].root = obj4
    logger.log(obj4)

    const o = {}
    const obj5 = { a: o, b: o }
    logger.log(obj5)

    const obj6 = [o, o]
    logger.log(obj6)

    const obj7 = [o, obj, o]
    obj7.obj = obj
    logger.log(obj7)
  }

  await closeAndCompare()
})

test.skip('promises', async function (t) {
  const { nodeConsole, tinyConsole, closeAndCompare } = create(t)

  both(nodeConsole)
  both(tinyConsole)

  function both (logger) {
    const resolved = Promise.resolve('hi')
    logger.log(resolved)
  }

  await closeAndCompare()
})

test('regular expressions', async function (t) {
  const { nodeConsole, tinyConsole, closeAndCompare } = create(t)

  both(nodeConsole)
  both(tinyConsole)

  function both (logger) {
    const regex = new RegExp('ab' + 'c', 'i')
    logger.log(regex)
  }

  await closeAndCompare()
})

test.skip('spacing', async function (t) {
  const { nodeConsole, tinyConsole, closeAndCompare } = create(t)

  both(nodeConsole)
  both(tinyConsole)

  function both (logger) {
    logger.log({ b: { a: { a: 1 }, b: [1], c: 'aa', d: 123, e: () => {}, f: NaN } })

    logger.log({ a: { b: { a: { a: 1 }, b: [1], c: 'aa', d: 123, e: () => {}, f: NaN } } })
  }

  await closeAndCompare()
})

test.skip('trace', async function (t) {
  const { nodeConsole, tinyConsole, closeAndCompare } = create(t)

  both(nodeConsole)
  both(tinyConsole)

  function both (logger) {
    logger.trace('Show me')
    logger.trace('Show me', 'a', 'b')
  }

  await closeAndCompare()
})

test.skip('trace with multiple args', async function (t) {
  const { nodeConsole, tinyConsole, closeAndCompare } = create(t)

  both(nodeConsole)
  both(tinyConsole)

  function both (logger) {
    logger.trace('Show me', 'a', 'b')
  }

  await closeAndCompare()
})

test.skip('basic times', async function (t) {
  const { nodeConsole, tinyConsole, closeAndCompare } = create(t)

  both(nodeConsole)
  both(tinyConsole)

  function both (logger) {
    logger.time()
    logger.timeEnd()
  }

  await closeAndCompare()
})

test.skip('times with custom label', async function (t) {
  const { nodeConsole, tinyConsole, closeAndCompare } = create(t)

  both(nodeConsole)
  both(tinyConsole)

  function both (logger) {
    logger.time('custom')
    logger.timeEnd('custom')
  }

  await closeAndCompare()
})

test.skip('times with different format', async function (t) {
  const { nodeConsole, tinyConsole, closeAndCompare } = create(t)

  both(nodeConsole)
  both(tinyConsole)

  function both (logger) {
    logger.time('millis')
    logger.timeEnd('millis')

    logger.time('seconds')
    const stop = Date.now() + 1500
    while (Date.now() < stop) {} // eslint-disable-line no-empty
    logger.timeEnd('seconds')
  }

  await closeAndCompare()
})

// + be aware of object with null prototype
// arg.constructor.name
// Object.getPrototypeOf(arg)
// arg instanceof String, etc

// { [Symbol.for('a')]: 'b' }

// + Symbol.for('hi')
// Object.create(null, { x: { value: 'x', enumerable: false }, y: { value: 'y', enumerable: true } })

// const arr = [1, 2, 3]; arr.kv = true; console.log(arr)

// nodeConsole.log([undefined, null, NaN, 'hello', 123, true])
// nodeConsole.log(["how'dy", 'how\'d"y', 'how\'d"y\`'])
// nodeConsole.log(new Array(16).fill('a'))
// console.log(new Map)

function create (t) {
  const tmpdir = createTmpDir(t)

  // + it should be a stream with isTTY so it also compares colors!

  const nodeWriteStreams = {
    stdout: fs.createWriteStream(path.join(tmpdir, 'node-stdout.log')),
    stderr: fs.createWriteStream(path.join(tmpdir, 'node-stderr.log'))
  }

  const tinyWriteStreams = {
    stdout: fs.createWriteStream(path.join(tmpdir, 'tiny-stdout.log')),
    stderr: fs.createWriteStream(path.join(tmpdir, 'tiny-stderr.log'))
  }

  const nodeConsole = new console.Console(nodeWriteStreams)
  const tinyConsole = new TinyConsole(tinyWriteStreams)

  return { tmpdir, nodeConsole, tinyConsole, close, readLogs, closeAndCompare }

  async function closeAndCompare () {
    await close()

    const logs = readLogs()
    t.alike(logs.tinyStdout, logs.nodeStdout, logs.tinyStdout.length === 0 && logs.nodeStdout.length === 0 ? '(stdout buffers are empty)' : '')
    t.alike(logs.tinyStderr, logs.nodeStderr, logs.tinyStderr.length === 0 && logs.nodeStderr.length === 0 ? '(stderr buffers are empty)' : '')
  }

  function readLogs () {
    // + remove utf8!

    const nodeStdout = fs.readFileSync(path.join(tmpdir, 'node-stdout.log'), 'utf8')
    const nodeStderr = fs.readFileSync(path.join(tmpdir, 'node-stderr.log'), 'utf8')

    const tinyStdout = fs.readFileSync(path.join(tmpdir, 'tiny-stdout.log'), 'utf8')
    const tinyStderr = fs.readFileSync(path.join(tmpdir, 'tiny-stderr.log'), 'utf8')

    return { nodeStdout, nodeStderr, tinyStdout, tinyStderr }
  }

  function close () {
    return new Promise(resolve => {
      nodeWriteStreams.stdout.end()
      nodeWriteStreams.stderr.end()

      tinyWriteStreams.stdout.end()
      tinyWriteStreams.stderr.end()

      nodeWriteStreams.stdout.once('close', done)
      nodeWriteStreams.stderr.once('close', done)

      tinyWriteStreams.stdout.once('close', done)
      tinyWriteStreams.stderr.once('close', done)

      let count = 0

      function done () {
        if (++count === 4) {
          resolve()
        }
      }
    })
  }
}

function createTmpDir (t) {
  const tmpdir = path.join(os.tmpdir(), 'tiny-console-test-')
  const dir = fs.mkdtempSync(tmpdir)
  t.teardown(() => fs.rmSync(dir, { recursive: true }))
  return dir
}
