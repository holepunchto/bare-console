# bare-console

WHATWG debugging console for JavaScript.

```
npm i bare-console
```

## Usage

```js
const Console = require('bare-console')

const console = new Console()

console.log('Hello')
console.error(new Error('Something happened'))

console.time()
for (let i = 0; i < 1000000000; i++) {}
console.timeEnd()

console.trace('Show me')
```

To install `console` as a global, require the `bare-console/global` subpath:

```js
require('bare-console/global')

console.log('Hello')
```

## API

#### `const console = new Console([log])`

Construct a new `Console`. By default, output is written through `bare-logger` (<https://github.com/holepunchto/bare-logger>), or `bare-system-logger` (<https://github.com/holepunchto/bare-system-logger>) on Android.

Pass a custom `log` object to redirect output:

```js
const Console = require('bare-console')
const FileLog = require('bare-file-logger')

const console = new Console(new FileLog('my-logs.txt'))
```

The `log` object implements the methods used by the console operations being called:

```js
log = {
  debug(...data),
  info(...data),
  warn(...data),
  error(...data),
  clear(),
  format(...data)
}
```

A minimal backend only needs the subset it intends to support; for example, `info` is sufficient for `console.log()`.

#### `console.log(...data)`

#### `console.info(...data)`

#### `console.debug(...data)`

#### `console.warn(...data)`

#### `console.error(...data)`

Forward `data` to the corresponding method on the backend. `console.log()` is an alias for `console.info()`.

#### `console.clear()`

Forward to `log.clear()`.

#### `console.time([label])`

Start a timer identified by `label` (default `'default'`). Warns if a timer with the same label is already running.

#### `console.timeLog([label[, ...data]])`

Log the elapsed time for the timer identified by `label` (default `'default'`), along with any additional `data`. Output uses milliseconds for short durations and seconds beyond one second.

#### `console.timeEnd([label])`

Log the elapsed time and remove the timer identified by `label` (default `'default'`).

#### `console.count([label])`

Increment and log the counter identified by `label` (default `'default'`).

#### `console.countReset([label])`

Remove the counter identified by `label` (default `'default'`).

#### `console.trace(...data)`

Log a stack trace prefixed with the formatted `data`.

#### `console.assert(condition, ...data)`

If `condition` is falsy, log `data` prefixed with `'Assertion failed'`. Otherwise do nothing.

#### `console.table(tabularData[, properties])`

Render `tabularData` as a table. Arrays and plain objects use an `(index)` column; `Map` and `Set` use an `(iteration index)` column with `key` and `values` (or `values` only) headers. Pass `properties` to restrict which object keys are shown as columns; the argument is ignored for `Map` and `Set`. Values that aren't tabular (primitives, `null`, functions) fall back to `console.log(tabularData)`.

## License

Apache-2.0
