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
    logger.log(1, NaN, 3)

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

test.skip('log Error', async function (t) {
  const { nodeConsole, tinyConsole, closeAndCompare } = create(t)

  both(nodeConsole)
  both(tinyConsole)

  function both (logger) {
    logger.error(new Error('Something happened'))

    logger.error({ error: new Error('Something happened') })
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
  }

  await closeAndCompare()
})

test.skip('spacing', async function (t) {
  const { nodeConsole, tinyConsole, closeAndCompare } = create(t)

  both(nodeConsole)
  both(tinyConsole)

  function both (logger) {
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

/*
console2.time()
console2.timeEnd() // default: 0.052ms

console2.time()
for (let i = 0; i < 1000000000; i++) {}
console2.timeEnd() // default: 489.275ms

console2.time()
for (let i = 0; i < 3000000000; i++) {}
console2.timeEnd() // default: 4.596s

return */

// + be aware of object with null prototype
// arg.constructor.name
// Object.getPrototypeOf(arg)
// arg instanceof String, etc

// 'a', 1, 1.0, true, false, null, undefined, {}, [],
// Infinity, NaN, Date, String, Number, Object, Array, function() {}, Symbol,
// new String('hi'), new Number(1), new Boolean(false), new Date()

// new Set([1]), new Map([[1, 1]]), new WeakSet([{ a: 1 }]), new WeakMap([[{ a: 1 }, 1]]),
// new Int8Array([1]), new Int16Array([1]), new Int32Array([1]),

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
    t.alike(logs.nodeStdout, logs.tinyStdout)
    t.alike(logs.nodeStderr, logs.tinyStderr)
  }

  function readLogs () {
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
