# @pearjs/console

Simple debugging console

```
npm i @pearjs/console
```

## Usage
```javascript
const console = require('@pearjs/console')

console.log('Hello')
console.error(new Error('Something happened'))

console.time()
for (let i = 0; i < 1000000000; i++) {}
console.timeEnd()

console.trace('Show me')
```

## License

MIT
