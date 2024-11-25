const test = require('brittle')
const Console = require('.')

test('log', (t) => {
  t.plan(1)

  const log = {
    info(data) {
      t.is(data, 'hello')
    }
  }

  const console = new Console(log)

  console.log('hello')
})

test('warn', (t) => {
  t.plan(1)

  const log = {
    warn(data) {
      t.is(data, 'hello')
    }
  }

  const console = new Console(log)

  console.warn('hello')
})

test('error', (t) => {
  t.plan(1)

  const log = {
    error(data) {
      t.is(data, 'hello')
    }
  }

  const console = new Console(log)

  console.error('hello')
})

test('trace', (t) => {
  t.plan(2)

  const log = {
    format(data) {
      t.is(data, 'hello')
      return data
    },
    error(data) {
      t.comment(data)
      t.pass()
    }
  }

  const console = new Console(log)

  console.trace('hello')
})

test('time', (t) => {
  t.plan(2)

  const log = {
    info(data) {
      t.comment(data)
      t.pass()
    }
  }

  const console = new Console(log)

  console.time('label')
  console.timeLog('label', 'hello')
  console.timeEnd('label')
})

test('count', (t) => {
  t.plan(2)

  const log = {
    info(data) {
      t.comment(data)
      t.pass()
    }
  }

  const console = new Console(log)

  console.count('label')
  console.count('label')
  console.countReset('label')
})

test('assert', (t) => {
  t.plan(1)

  const log = {
    error(data) {
      t.is(data, 'Assertion failed: falsy')
    }
  }

  const console = new Console(log)

  console.assert(1, 'truthy')
  console.assert(0, 'falsy')
})

test('bound console methods', (t) => {
  t.plan(2)

  const log = {
    info(data) {
      t.is(data, 'info')
    },
    error(data) {
      t.is(data, 'error')
    }
  }

  const console = new Console(log)

  console.log.call(null, 'info')
  console.error.call(null, 'error')
})
