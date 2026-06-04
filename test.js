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

test('table with array of objects', (t) => {
  t.plan(1)

  const log = {
    format(spec, value) {
      return String(value)
    },
    info(data) {
      t.is(
        data,
        '┌─────────┬───┬───┐\n' +
          '│ (index) │ a │ b │\n' +
          '├─────────┼───┼───┤\n' +
          '│ 0       │ 1 │ 2 │\n' +
          '│ 1       │ x │ y │\n' +
          '└─────────┴───┴───┘'
      )
    }
  }

  const console = new Console(log)

  console.table([
    { a: 1, b: 2 },
    { a: 'x', b: 'y' }
  ])
})

test('table with properties filter', (t) => {
  t.plan(1)

  const log = {
    format(spec, value) {
      return String(value)
    },
    info(data) {
      t.is(
        data,
        '┌─────────┬───┐\n' +
          '│ (index) │ a │\n' +
          '├─────────┼───┤\n' +
          '│ 0       │ 1 │\n' +
          '│ 1       │ 3 │\n' +
          '└─────────┴───┘'
      )
    }
  }

  const console = new Console(log)

  console.table(
    [
      { a: 1, b: 2 },
      { a: 3, b: 4 }
    ],
    ['a']
  )
})

test('table with object', (t) => {
  t.plan(1)

  const log = {
    format(spec, value) {
      return String(value)
    },
    info(data) {
      t.is(
        data,
        '┌─────────┬───┐\n' +
          '│ (index) │ x │\n' +
          '├─────────┼───┤\n' +
          '│ a       │ 1 │\n' +
          '│ b       │ 2 │\n' +
          '└─────────┴───┘'
      )
    }
  }

  const console = new Console(log)

  console.table({ a: { x: 1 }, b: { x: 2 } })
})

test('table with mixed object and primitive rows', (t) => {
  t.plan(1)

  const log = {
    format(spec, value) {
      if (typeof value === 'string') return "'" + value + "'"
      return String(value)
    },
    info(data) {
      t.is(
        data,
        '┌─────────┬───┬───┬────────┐\n' +
          '│ (index) │ a │ b │ values │\n' +
          '├─────────┼───┼───┼────────┤\n' +
          '│ 0       │ 1 │ 2 │        │\n' +
          "│ 1       │   │   │ 'x'    │\n" +
          '└─────────┴───┴───┴────────┘'
      )
    }
  }

  const console = new Console(log)

  console.table([{ a: 1, b: 2 }, 'x'])
})

test('table with empty array renders header only', (t) => {
  t.plan(1)

  const log = {
    info(data) {
      t.is(data, '┌─────────┐\n' + '│ (index) │\n' + '├─────────┤\n' + '└─────────┘')
    }
  }

  const console = new Console(log)

  console.table([])
})

test('table strips ANSI codes when measuring width', (t) => {
  t.plan(1)

  const log = {
    format(spec, value) {
      return '\x1b[33m' + String(value) + '\x1b[39m'
    },
    info(data) {
      t.is(
        data,
        '┌─────────┬───┐\n' +
          '│ (index) │ a │\n' +
          '├─────────┼───┤\n' +
          '│ 0       │ \x1b[33m1\x1b[39m │\n' +
          '│ 1       │ \x1b[33m2\x1b[39m │\n' +
          '└─────────┴───┘'
      )
    }
  }

  const console = new Console(log)

  console.table([{ a: 1 }, { a: 2 }])
})

test('table with Map renders key and values columns', (t) => {
  t.plan(1)

  const log = {
    format(spec, value) {
      if (typeof value === 'string') return "'" + value + "'"
      return String(value)
    },
    info(data) {
      t.is(
        data,
        '┌───────────────────┬─────┬────────┐\n' +
          '│ (iteration index) │ key │ values │\n' +
          '├───────────────────┼─────┼────────┤\n' +
          "│ 0                 │ 'a' │ 1      │\n" +
          "│ 1                 │ 'b' │ 2      │\n" +
          '└───────────────────┴─────┴────────┘'
      )
    }
  }

  const console = new Console(log)

  console.table(
    new Map([
      ['a', 1],
      ['b', 2]
    ])
  )
})

test('table with Set renders values column only', (t) => {
  t.plan(1)

  const log = {
    format(spec, value) {
      if (typeof value === 'string') return "'" + value + "'"
      return String(value)
    },
    info(data) {
      t.is(
        data,
        '┌───────────────────┬────────┐\n' +
          '│ (iteration index) │ values │\n' +
          '├───────────────────┼────────┤\n' +
          "│ 0                 │ 'x'    │\n" +
          "│ 1                 │ 'y'    │\n" +
          '└───────────────────┴────────┘'
      )
    }
  }

  const console = new Console(log)

  console.table(new Set(['x', 'y']))
})

test('table with empty Map renders header only', (t) => {
  t.plan(1)

  const log = {
    format(spec, value) {
      return String(value)
    },
    info(data) {
      t.is(
        data,
        '┌───────────────────┬─────┬────────┐\n' +
          '│ (iteration index) │ key │ values │\n' +
          '├───────────────────┼─────┼────────┤\n' +
          '└───────────────────┴─────┴────────┘'
      )
    }
  }

  const console = new Console(log)

  console.table(new Map())
})

test('table aligns CJK wide characters', (t) => {
  t.plan(1)

  const log = {
    format(spec, value) {
      return String(value)
    },
    info(data) {
      t.is(
        data,
        '┌─────────┬──────┐\n' +
          '│ (index) │ x    │\n' +
          '├─────────┼──────┤\n' +
          '│ 0       │ 日本 │\n' +
          '│ 1       │ abcd │\n' +
          '└─────────┴──────┘'
      )
    }
  }

  const console = new Console(log)

  console.table([{ x: '日本' }, { x: 'abcd' }])
})

test('table aligns emoji as width 2', (t) => {
  t.plan(1)

  const log = {
    format(spec, value) {
      return String(value)
    },
    info(data) {
      t.is(
        data,
        '┌─────────┬────┐\n' +
          '│ (index) │ x  │\n' +
          '├─────────┼────┤\n' +
          '│ 0       │ 🎉 │\n' +
          '│ 1       │ ab │\n' +
          '└─────────┴────┘'
      )
    }
  }

  const console = new Console(log)

  console.table([{ x: '🎉' }, { x: 'ab' }])
})

test('table treats combining marks as zero width', (t) => {
  t.plan(1)

  const log = {
    format(spec, value) {
      return String(value)
    },
    info(data) {
      t.is(
        data,
        '┌─────────┬────┐\n' +
          '│ (index) │ x  │\n' +
          '├─────────┼────┤\n' +
          '│ 0       │ á  │\n' +
          '│ 1       │ ab │\n' +
          '└─────────┴────┘'
      )
    }
  }

  const console = new Console(log)

  console.table([{ x: 'á' }, { x: 'ab' }])
})

test('table aligns modern emoji as width 2', (t) => {
  t.plan(1)

  const log = {
    format(spec, value) {
      return String(value)
    },
    info(data) {
      t.is(
        data,
        '┌─────────┬────┐\n' +
          '│ (index) │ x  │\n' +
          '├─────────┼────┤\n' +
          '│ 0       │ 🚀 │\n' +
          '│ 1       │ 🤔 │\n' +
          '│ 2       │ 🪐 │\n' +
          '│ 3       │ ab │\n' +
          '└─────────┴────┘'
      )
    }
  }

  const console = new Console(log)

  console.table([{ x: '🚀' }, { x: '🤔' }, { x: '🪐' }, { x: 'ab' }])
})

test('table escapes lone CR in cells', (t) => {
  t.plan(1)

  const log = {
    format(spec, value) {
      return String(value)
    },
    info(data) {
      t.is(
        data,
        '┌─────────┬──────┐\n' +
          '│ (index) │ x    │\n' +
          '├─────────┼──────┤\n' +
          '│ 0       │ a\\nb │\n' +
          '│ 1       │ cd   │\n' +
          '└─────────┴──────┘'
      )
    }
  }

  const console = new Console(log)

  console.table([{ x: 'a\rb' }, { x: 'cd' }])
})

test('table strips non-SGR ANSI when measuring width', (t) => {
  t.plan(1)

  const log = {
    format(spec, value) {
      return '\x1b[2J' + String(value)
    },
    info(data) {
      t.is(
        data,
        '┌─────────┬───┐\n' +
          '│ (index) │ x │\n' +
          '├─────────┼───┤\n' +
          '│ 0       │ \x1b[2J1 │\n' +
          '│ 1       │ \x1b[2J2 │\n' +
          '└─────────┴───┘'
      )
    }
  }

  const console = new Console(log)

  console.table([{ x: 1 }, { x: 2 }])
})

test('table treats non-emoji surrogate pair as one column', (t) => {
  t.plan(1)

  const log = {
    format(spec, value) {
      return String(value)
    },
    info(data) {
      t.is(
        data,
        '┌─────────┬────┐\n' +
          '│ (index) │ x  │\n' +
          '├─────────┼────┤\n' +
          '│ 0       │ 𝕏  │\n' +
          '│ 1       │ ab │\n' +
          '└─────────┴────┘'
      )
    }
  }

  const console = new Console(log)

  console.table([{ x: '𝕏' }, { x: 'ab' }])
})

test('table with primitives falls back to log', (t) => {
  t.plan(1)

  const log = {
    info(data) {
      t.is(data, 'hello')
    }
  }

  const console = new Console(log)

  console.table('hello')
})

test('table with null falls back to log', (t) => {
  t.plan(1)

  const log = {
    info(data) {
      t.is(data, null)
    }
  }

  const console = new Console(log)

  console.table(null)
})

test('table escapes newlines in formatted cells', (t) => {
  t.plan(1)

  const log = {
    format(spec, value) {
      if (typeof value === 'string') return "'" + value + "'"
      return String(value)
    },
    info(data) {
      t.is(
        data,
        '┌─────────┬────────────────┐\n' +
          '│ (index) │ x              │\n' +
          '├─────────┼────────────────┤\n' +
          "│ 0       │ 'line1\\nline2' │\n" +
          '└─────────┴────────────────┘'
      )
    }
  }

  const console = new Console(log)

  console.table([{ x: 'line1\nline2' }])
})

test('table with non-array properties throws', async (t) => {
  t.plan(1)

  const console = new Console({ info() {} })

  await t.exception.all(() => console.table([{ a: 1 }], 'a'), /must be an array/)
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
