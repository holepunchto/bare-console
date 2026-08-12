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

See the [`bare-console` reference](https://docs.pears.com/reference/bare/modules/bare-console).

## License

Apache-2.0
