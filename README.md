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

## License

Apache-2.0
