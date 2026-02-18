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

### Change backend

Any object that implements the log functions can be used as the backend for `Console`:

```js
const Console = require('bare-console')
const FileLog = require('bare-file-logger')

const log = new FileLog('my-logs.txt')
const console = new Console(log)

console.log('Hello')
console.error(new Error('Something happened'))

console.time()
for (let i = 0; i < 1000000000; i++) {}
console.timeEnd()

console.trace('Show me')
```

## License

Apache-2.0
