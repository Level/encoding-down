# encoding-down

> [`abstract-leveldown`](https://github.com/level/abstract-leveldown) wrapper supporting levelup@1 encodings. For motivation, see [this issue](https://github.com/Level/levelup/pull/367).

[![level badge][level-badge]](https://github.com/level/awesome)
[![npm](https://img.shields.io/npm/v/encoding-down.svg)](https://www.npmjs.com/package/encoding-down)
[![Travis](https://travis-ci.org/Level/encoding-down.svg?branch=master)](https://travis-ci.org/Level/encoding-down)
[![david](https://david-dm.org/Level/encoding-down.svg)](https://david-dm.org/level/encoding-down)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![npm](https://img.shields.io/npm/dm/encoding-down.svg)](https://www.npmjs.com/package/encoding-down)

## Usage

```js
const levelup = require('levelup')
const leveldown = require('leveldown')
const encode = require('encoding-down')

const db = levelup(encode(leveldown('./db')))
db.put('name', 'encoding-down', function (err) {
  db.get('name', function (err, value) {
    if (!err) console.log('name=', value)
  })
})
```

## API

### `const db = require('encoding-down')(db[, options])`

* `db` `abstract-leveldown` compatible db such as `leveldown`, `memdown`, `level-js` etc
* `options.keyEncoding` (string) defaults to `'utf8'`
* `options.valueEncoding` (string) defaults to `'utf8'`

`options` are passed to [`level-codec`](https://github.com/level/codec), see [supported encodings](https://github.com/Level/codec#encodings) for more information.

## License

MIT

[level-badge]: http://leveldb.org/img/badge.svg
