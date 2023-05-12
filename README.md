# bare-console

Simple debugging console for JavaScript.

```
npm i bare-console
```

## Usage

```javascript
const Console = require('bare-console')
const console = new Console({ stdout: process.stdout, stderr: process.stderr })

console.log('Hello')
console.error(new Error('Something happened'))

console.time()
for (let i = 0; i < 1000000000; i++) {}
console.timeEnd()

console.trace('Show me')
```

## License

Apache-2.0
