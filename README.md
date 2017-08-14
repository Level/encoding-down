# encoding-down

<img alt="LevelDB Logo" height="100" src="http://leveldb.org/img/logo.svg">

[`AbstractLevelDOWN`](https://github.com/level/abstract-leveldown) wrapper supporting levelup@1 encodings. For motivation, see [this issue](https://github.com/Level/levelup/pull/367).

[![Build Status](https://travis-ci.org/Level/encoding-down.svg?branch=master)](https://travis-ci.org/Level/encoding-down) [![Greenkeeper badge](https://badges.greenkeeper.io/Level/encoding-down.svg)](https://greenkeeper.io/)

## Usage

```js
const levelup = require('levelup')
const leveldown = require('leveldown')
const enc = require('encoding-down')
const db = levelup(enc(leveldown('./db')))
db.put('name', 'encoding-down', function (err) {
  db.get('name', function (err, value) {
    if (!err) console.log('name=', value)
  })
})
```

## API

### `var db = require('encoding-down')(db[, options])`

* `db` `AbstractLevelDOWN` compatible db such as `leveldown`, `memdown` etc
* `options.keyEncoding` (string) defaults to `'utf8'`
* `options.valueEncoding` (string) defaults to `'utf8'`

`options` are passed to [`level-codec`](https://github.com/level/codec), see [supported encodings](https://github.com/Level/codec#encodings) for more information.

## License

MIT
