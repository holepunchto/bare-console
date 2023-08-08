const test = require('brittle')
const { Writable } = require('streamx')
const Console = require('.')

test('log', (t) => {
  t.plan(1)

  const stdout = new Writable({
    write (data, cb) {
      t.is(data, 'hello\n')
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

test('error', (t) => {
  t.plan(1)

  const stdout = new Writable({
    write () {
      t.fail()
    }
  })

  const stderr = new Writable({
    write (data, cb) {
      t.is(data, 'hello\n')
      cb(null)
    }
  })

  const console = new Console({ stdout, stderr })

  console.error('hello')
})

test('console is bound to its context', (t) => {
  t.plan(2)

  const stdout = new Writable({
    write (data, cb) {
      t.pass()
      cb(null)
    }
  })

  const stderr = new Writable({
    write (data, cb) {
      t.pass()
      cb(null)
    }
  })

  const console = new Console({ stdout, stderr, bind: true })

  process.nextTick(console.log, 42)
  process.nextTick(console.error, new Error('hello'))
})
