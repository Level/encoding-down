# encoding-down

> An [`abstract-leveldown`] implementation that wraps another store to encode keys and values.

[![level badge][level-badge]](https://github.com/level/awesome)
[![npm](https://img.shields.io/npm/v/encoding-down.svg)](https://www.npmjs.com/package/encoding-down)
[![Travis](https://travis-ci.org/Level/encoding-down.svg?branch=master)](https://travis-ci.org/Level/encoding-down)
[![david](https://david-dm.org/Level/encoding-down.svg)](https://david-dm.org/level/encoding-down)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![npm](https://img.shields.io/npm/dm/encoding-down.svg)](https://www.npmjs.com/package/encoding-down)

## Introduction

Stores like [`leveldown`] can only store strings and Buffers. For a richer set of data types you can wrap such a store with `encoding-down`. It allows you to specify an *encoding* to use for keys and values independently. This not only widens the range of input types, but also limits the range of output types. The encoding is applied to all read and write operations: it encodes writes and decodes reads.

Many encodings are builtin courtesy of [`level-codec`]. The default encoding is `utf8` which ensures you'll always get back a string. You can also provide a custom encoding like `bytewise` - or your own!

## Builtin encodings

| Name     | Input                        | Stored as         | Output
|:---------|:-----------------------------|:------------------|:------
| `utf8`   | String or Buffer             | String or Buffer  | String
| `json`   | Any JSON type                | JSON string       | Input
| `binary` | Buffer, string or byte array | Buffer            | As stored
| `hex`<br>`ascii`<br>`base64`<br>`ucs2`<br>`utf16le`<br>`utf-16le` | String or Buffer | Buffer | String
| `none` a.k.a. `id`  | Any type (bypass encoding)   | Input\*            | As stored

<sup>\*</sup> Stores may have their own type coercion. Whether type information is preserved depends on the [`abstract-leveldown`] implementation as well as the underlying storage (`LevelDB`, `IndexedDB`, etc).

## Usage

Without any options, `encoding-down` defaults to the `utf8` encoding.

```js
const levelup = require('levelup')
const leveldown = require('leveldown')
const encode = require('encoding-down')

const db = levelup(encode(leveldown('./db')))

db.put('example', Buffer.from('encoding-down'), function (err) {
  db.get('example', function (err, value) {
    console.log(typeof value, value) // string encoding-down
  })
})
```

Can we store objects? Yes!

```js
const db = levelup(encode(leveldown('./db'), { valueEncoding: 'json' }))

db.put('example', { awesome: true }, function (err) {
  db.get('example', function (err, value) {
    console.log(typeof value, value) // object { awesome: true }
  })
})
```

How about storing Buffers, but getting back a hex-encoded string?

```js
const db = levelup(encode(leveldown('./db'), { valueEncoding: 'hex' }))

db.put('example', Buffer.from([0, 255]), function (err) {
  db.get('example', function (err, value) {
    console.log(typeof value, value) // string 00ff
  })
})
```

What if we previously stored binary data?

```js
const db = levelup(encode(leveldown('./db'), { valueEncoding: 'binary' }))

db.put('example', Buffer.from([0, 255]), function (err) {
  db.get('example', function (err, value) {
    console.log(typeof value, value) // object <Buffer 2e 20>
  })

  // Override the encoding for this operation
  db.get('example', { valueEncoding: 'base64' }, function (err, value) {
    console.log(typeof value, value) // string AP8=
  })
})
```

And what about keys?

```js
const db1 = levelup(encode(leveldown('./db1'), { keyEncoding: 'json' }))

db1.put({ awesome: true }, 'example', function (err) {
  db1.get({ awesome: true }, function (err, value) {
    console.log(value) // example
  })
})

const db2 = levelup(encode(leveldown('./db2'), { keyEncoding: 'binary' }))

db2.put(Buffer.from([0, 255]), 'example', function (err) {
  db2.get('00ff', { keyEncoding: 'hex' }, function (err, value) {
    console.log(value) // example
  })
})
```

## Usage with [`level`]

The [`level`] module conveniently bundles `encoding-down` and passes its `options` to `encoding-down`. This means you can simply do:

```js
const level = require('level')
const db = level('./db', { valueEncoding: 'json' })

db.put('example', { awesome: true }, function (err) {
  db.get('example', function (err, value) {
    console.log(typeof value, value) // object { awesome: true }
  })
})
```

## API

### `const db = require('encoding-down')(db[, options])`

* `db` must be an [`abstract-leveldown`] compliant store
* `options.keyEncoding` (string or object) defaults to `'utf8'`
* `options.valueEncoding` (string or object) defaults to `'utf8'`

`options` are passed to [`level-codec`](https://github.com/level/codec).

## Custom encoding

*todo*.

## License

MIT

[level-badge]: http://leveldb.org/img/badge.svg
[`abstract-leveldown`]: https://github.com/level/abstract-leveldown
[`leveldown`]: https://github.com/level/leveldown
[`level`]: https://github.com/level/level
[`level-codec`]: https://github.com/level/level-codec
