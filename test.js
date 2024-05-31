const test = require('brittle')
const { Writable } = require('bare-stream')
const Console = require('.')

test('log', (t) => {
  t.plan(1)

  const stdout = new Writable({
    write (data, encoding, cb) {
      t.alike(data, Buffer.from('hello\n'))
      cb(null)
    }
  })

  const stderr = new Writable({
    write () {
      t.fail()
    }
  })

  const console = new Console({ stdout, stderr })

  console.log('hello')
})

test('log with format', (t) => {
  t.plan(1)

  const stdout = new Writable({
    write (data, encoding, cb) {
      t.alike(data, Buffer.from('hello world\n'))
      cb(null)
    }
  })

  const stderr = new Writable({
    write () {
      t.fail()
    }
  })

  const console = new Console({ stdout, stderr })

  console.log('hello %s', 'world')
})

test('warn', (t) => {
  t.plan(1)

  const stdout = new Writable({
    write () {
      t.fail()
    }
  })

  const stderr = new Writable({
    write (data, encoding, cb) {
      t.alike(data, Buffer.from('hello\n'))
      cb(null)
    }
  })

  const console = new Console({ stdout, stderr })

  console.warn('hello')
})

test('error', (t) => {
  t.plan(1)

  const stdout = new Writable({
    write () {
      t.fail()
    }
  })

  const stderr = new Writable({
    write (data, encoding, cb) {
      t.alike(data, Buffer.from('hello\n'))
      cb(null)
    }
  })

  const console = new Console({ stdout, stderr })

  console.error('hello')
})

test('console is bound to its context', (t) => {
  t.plan(2)

  const stdout = new Writable({
    write (data, encoding, cb) {
      t.pass()
      cb(null)
    }
  })

  const stderr = new Writable({
    write (data, encoding, cb) {
      t.pass()
      cb(null)
    }
  })

  const console = new Console({ stdout, stderr, bind: true })

  queueMicrotask(console.log, 42)
  queueMicrotask(console.error, new Error('hello'))
})
