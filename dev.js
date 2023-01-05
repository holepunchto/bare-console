const console2 = require('./index.js')

console.trace('Show me')
console.trace('Show me', 'aa', 'bb')

console2.trace('Show me')
console2.trace('Show me', 'aa', 'bb')

return

console2.time()
console2.timeEnd() // default: 0.052ms

console2.time()
for (let i = 0; i < 1000000000; i++) {}
console2.timeEnd() // default: 489.275ms

console2.time()
for (let i = 0; i < 3000000000; i++) {}
console2.timeEnd() // default: 4.596s

return

const fn = () => {}
const obj = { b: true, fn: function () {}, c: { d: 'hi' }, e: [1, { f: 2 }] }
const obj2 = { a: { b: { c: { d: { e: { f: { g: {} } } } } } } }
const obj3 = { a: { b: { c: [{ d: { e: { f: { g: {} } } } }] } } }
const obj4 = { a: { b: { a: {}, b: [], c: '', d: 1 } } } 
const obj5 = { a: { b: { a: { a:1 }, b: [1], c: 'aa', d: 123, e: () => {}, f: NaN } } } 

// + be aware of object with null prototype
// arg.constructor.name
// Object.getPrototypeOf(arg)
// arg instanceof String, etc

// 'a', 1, 1.0, true, false, null, undefined, {}, [],
// Infinity, NaN, Date, String, Number, Object, Array, function() {}, Symbol,
// new String('hi'), new Number(1), new Boolean(false), new Date()

// new Set([1]), new Map([[1, 1]]), new WeakSet([{ a: 1 }]), new WeakMap([[{ a: 1 }, 1]]),
// new Int8Array([1]), new Int16Array([1]), new Int32Array([1]),

// { [Symbol.for('a')]: 'b' }

// + Symbol.for('hi')
// Object.create(null, { x: { value: 'x', enumerable: false }, y: { value: 'y', enumerable: true } })

// const arr = [1, 2, 3]; arr.kv = true; console.log(arr)

console.log('[console]')
console.log(undefined)
console.log(null)
console.log(NaN)
console.log('hello')
console.log(123)
console.log(true)
console.log('a', 'b', 'c')
console.log(function () {})
console.log(function funcname () {})
console.log(() => {})
console.log(fn)
// console.log(new Map)
console.log([])
console.log([undefined, null, NaN, 'hello', 123, true])
console.log(["how'dy", 'how\'d"y', 'how\'d"y\`'])
console.log(new Array(16).fill('a'))
console.log({})
console.log(obj)
console.log(obj2)
console.log(obj3)
console.log(obj4)
console.log(obj5)
console.log('[console]')

console.log()

console.log('[tiny-console]')
console2.log(undefined)
console2.log(null)
console2.log(NaN)
console2.log('hello')
console2.log(123)
console2.log(true)
console2.log('a', 'b', 'c')
console2.log(function () {}) // + [Function (anonymous)]
console2.log(function funcname () {}) // + [Function: funcname]
console2.log(() => {}) // + [Function (anonymous)]
console2.log(fn) // + [Function: fn]
// console2.log(new Map)
console2.log([])
console2.log([undefined, null, NaN, 'hello', 123, true])
console2.log(["how'dy", 'how\'d"y', 'how\'d"y\`'])
console2.log(new Array(16).fill('a'))
console2.log({})
console2.log(obj)
console2.log(obj2)
console2.log(obj3)
console2.log(obj4)
console2.log(obj5)
console.log('[tiny-console]')
