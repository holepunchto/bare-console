const test = require('brittle')
const Console = require('.')

test('log', (t) => {
  t.plan(1)

  const stdout = {
    write(data) {
      t.alike(data, 'hello\n')
    }
  }

  const stderr = {
    write() {
      t.fail()
    }
  }

  const console = new Console({ stdout, stderr })

  console.log('hello')
})

test('log with format', (t) => {
  t.plan(1)

  const stdout = {
    write(data) {
      t.alike(data, 'hello world\n')
    }
  }

  const stderr = {
    write() {
      t.fail()
    }
  }

  const console = new Console({ stdout, stderr })

  console.log('hello %s', 'world')
})

test('warn', (t) => {
  t.plan(1)

  const stdout = {
    write() {
      t.fail()
    }
  }

  const stderr = {
    write(data) {
      t.alike(data, 'hello\n')
    }
  }

  const console = new Console({ stdout, stderr })

  console.warn('hello')
})

test('error', (t) => {
  t.plan(1)

  const stdout = {
    write() {
      t.fail()
    }
  }

  const stderr = {
    write(data) {
      t.alike(data, 'hello\n')
    }
  }

  const console = new Console({ stdout, stderr })

  console.error('hello')
})

test('assert', (t) => {
  t.plan(1)

  const stdout = {
    write() {
      t.fail()
    }
  }

  const stderr = {
    write(data) {
      t.alike(data, 'Assertion failed: falsy\n')
    }
  }

  const console = new Console({ stdout, stderr })

  console.assert(1, 'truthy')
  console.assert(0, 'falsy')
})

test('bound console methods', (t) => {
  t.plan(2)

  const stdout = {
    write() {
      t.pass()
    }
  }

  const stderr = {
    write() {
      t.pass()
    }
  }

  const { log, error } = new Console({ stdout, stderr })

  log('hello')
  error('world')
})
