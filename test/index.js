'use strict'

const test = require('tape')
const encdown = require('..')
const suite = require('abstract-leveldown/test')
const memdown = require('memdown')
const Buffer = require('buffer').Buffer
const hasOwnProperty = Object.prototype.hasOwnProperty
const noop = function () {}

const testCommon = suite.common({
  test: test,
  factory: function () {
    return encdown(memdown())
  },

  encodings: true,

  // Unsupported features
  createIfMissing: false,
  errorIfExists: false,

  // Opt-in to new tests
  clear: true,
  getMany: true
})

// Test abstract-leveldown compliance
suite(testCommon)

// Custom tests
test('opens and closes the underlying db', function (t) {
  const _db = {
    open: function (opts, cb) {
      t.pass('open called')
      setImmediate(cb)
    },
    close: function (cb) {
      t.pass('close called')
      setImmediate(cb)
    }
  }
  const db = encdown(_db)
  db.open(function (err) {
    t.error(err, 'no error')
    db.close(function (err) {
      t.error(err, 'no error')
      t.end()
    })
  })
})

test('encodings default to utf8', function (t) {
  const db = encdown(memdown())
  t.ok(db.db, '.db should be set')
  t.ok(db.codec, '.codec should be set')
  t.deepEqual(db.codec.opts, {
    keyEncoding: 'utf8',
    valueEncoding: 'utf8'
  }, 'correct defaults')
  t.end()
})

test('default utf8 encoding stringifies numbers', function (t) {
  t.plan(3)

  const db = encdown({
    put: function (key, value, callback) {
      t.is(key, '1')
      t.is(value, '2')
    },
    batch: function (ops, options, callback) {
      t.same(ops, [{ type: 'put', key: '3', value: '4' }])
    }
  })

  db.put(1, 2, noop)
  db.batch([{ type: 'put', key: 3, value: 4 }], noop)
})

test('test safe decode in get', function (t) {
  const memdb = memdown()
  const db = encdown(memdb, { valueEncoding: 'utf8' })
  db.put('foo', 'this {} is [] not : json', function (err) {
    t.error(err, 'no error')
    const db2 = encdown(memdb, { valueEncoding: 'json' })
    db2.get('foo', function (err, value) {
      t.equals('EncodingError', err.name)
      memdb.close(t.end.bind(t))
    })
  })
})

test('can decode from string to json', function (t) {
  const memdb = memdown()
  const db = encdown(memdb, { valueEncoding: 'utf8' })
  const data = { thisis: 'json' }
  db.put('foo', JSON.stringify(data), function (err) {
    t.error(err, 'no error')
    const db2 = encdown(memdb, { valueEncoding: 'json' })
    db2.get('foo', function (err, value) {
      t.error(err, 'no error')
      t.deepEqual(value, data, 'JSON.parse')
      memdb.close(t.end.bind(t))
    })
  })
})

test('can decode from json to string', function (t) {
  const memdb = memdown()
  const db = encdown(memdb, { valueEncoding: 'json' })
  const data = { thisis: 'json' }
  db.put('foo', data, function (err) {
    t.error(err, 'no error')
    const db2 = encdown(memdb, { valueEncoding: 'utf8' })
    db2.get('foo', function (err, value) {
      t.error(err, 'no error')
      t.deepEqual(value, JSON.stringify(data), 'JSON.stringify')
      memdb.close(t.end.bind(t))
    })
  })
})

test('binary encoding, using batch', function (t) {
  const data = [
    {
      type: 'put',
      key: Buffer.from([1, 2, 3]),
      value: Buffer.from([4, 5, 6])
    },
    {
      type: 'put',
      key: Buffer.from([7, 8, 9]),
      value: Buffer.from([10, 11, 12])
    }
  ]
  const db = encdown(memdown(), {
    keyEncoding: 'binary',
    valueEncoding: 'binary'
  })
  db.batch(data, function (err) {
    t.error(err, 'no error')
    db.get(data[0].key, function (err, value) {
      t.error(err, 'no error')
      t.deepEqual(value, data[0].value)
      db.get(data[1].key, function (err, value) {
        t.error(err, 'no error')
        t.deepEqual(value, data[1].value)
        db.close(t.end.bind(t))
      })
    })
  })
})

test('default encoding retrieves a string from underlying store', function (t) {
  t.plan(1)

  const down = {
    get: function (key, options, cb) {
      t.is(options.asBuffer, false, '.asBuffer is false')
    }
  }

  const db = encdown(down)

  db.get('key', noop)
})

test('custom value encoding that retrieves a string from underlying store', function (t) {
  t.plan(1)

  const down = {
    get: function (key, options, cb) {
      t.is(options.asBuffer, false, '.asBuffer is false')
    }
  }

  const db = encdown(down, {
    valueEncoding: {
      buffer: false
    }
  })

  db.get('key', noop)
})

test('get() forwards error from underlying store', function (t) {
  t.plan(1)

  const down = {
    get: function (key, options, cb) {
      process.nextTick(cb, new Error('error from store'))
    }
  }

  encdown(down).get('key', function (err) {
    t.is(err.message, 'error from store')
  })
})

test('getMany() skips decoding not-found values', function (t) {
  t.plan(6)

  const valueEncoding = {
    encode: JSON.stringify,
    decode (value) {
      t.is(value, JSON.stringify(data))
      return JSON.parse(value)
    },
    buffer: false,
    type: 'test'
  }

  const data = { beep: 'boop' }
  const db = encdown(memdown(), { valueEncoding })

  db.open(function (err) {
    t.error(err, 'no open() error')

    db.put('foo', data, function (err) {
      t.error(err, 'no put() error')

      db.getMany(['foo', 'bar'], function (err, values) {
        t.error(err, 'no getMany() error')
        t.same(values, [data, undefined])

        db.close(t.error.bind(t))
      })
    })
  })
})

test('getMany() forwards decode error', function (t) {
  const valueEncoding = {
    encode: (v) => v,
    decode: (v) => { throw new Error('decode error') },
    buffer: false,
    type: 'test'
  }

  const db = encdown(memdown(), { valueEncoding })

  db.open(function (err) {
    t.error(err, 'no open() error')

    db.put('foo', 'bar', function (err) {
      t.error(err, 'no put() error')

      db.getMany(['foo'], function (err, values) {
        t.is(err && err.message, 'decode error')
        t.is(values, undefined)

        db.close(t.end.bind(t))
      })
    })
  })
})

test('_del() encodes key', function (t) {
  t.plan(1)

  const down = {
    del: function (key, options, cb) {
      t.is(key, '2')
    }
  }

  encdown(down).del(2, noop)
})

test('chainedBatch.put() encodes key and value', function (t) {
  t.plan(2)

  const down = {
    batch: function () {
      return {
        put: function (key, value) {
          t.is(key, '1')
          t.is(value, '2')
        }
      }
    }
  }

  encdown(down).batch().put(1, 2)
})

test('chainedBatch.put() takes custom encoding', function (t) {
  t.plan(4)

  const expectedKeys = ['"a"', 'a']
  const expectedValues = ['"b"', 'b']

  const down = {
    batch: function () {
      return {
        put: function (key, value) {
          t.is(key, expectedKeys.shift())
          t.is(value, expectedValues.shift())
        }
      }
    }
  }

  encdown(down).batch()
    .put('a', 'b', { keyEncoding: 'json', valueEncoding: 'json' })
    .put('a', 'b')
})

test('chainedBatch.del() encodes key', function (t) {
  t.plan(1)

  const down = {
    batch: function () {
      return {
        del: function (key) {
          t.is(key, '1')
        }
      }
    }
  }

  encdown(down).batch().del(1)
})

test('chainedBatch.del() takes custom encoding', function (t) {
  t.plan(2)

  const expectedKeys = ['"a"', 'a']

  const down = {
    batch: function () {
      return {
        del: function (key) {
          t.is(key, expectedKeys.shift())
        }
      }
    }
  }

  encdown(down).batch()
    .del('a', { keyEncoding: 'json' })
    .del('a')
})

test('chainedBatch.clear() is forwarded to underlying store', function (t) {
  t.plan(1)

  const down = {
    batch: function () {
      return {
        clear: function () {
          t.pass('called')
        }
      }
    }
  }

  encdown(down).batch().clear()
})

test('chainedBatch.write() is forwarded to underlying store', function (t) {
  t.plan(1)

  const down = {
    batch: function () {
      return {
        write: function () {
          t.pass('called')
        }
      }
    }
  }

  encdown(down).batch().write(noop)
})

test('custom value encoding that retrieves a buffer from underlying store', function (t) {
  t.plan(1)

  const down = {
    get: function (key, options, cb) {
      t.is(options.asBuffer, true, '.asBuffer is true')
    }
  }

  const db = encdown(down, {
    valueEncoding: {
      buffer: true
    }
  })

  db.get('key', noop)
})

test('.keyAsBuffer and .valueAsBuffer defaults to false', function (t) {
  t.plan(2)

  const down = {
    iterator: function (options) {
      t.is(options.keyAsBuffer, false)
      t.is(options.valueAsBuffer, false)
    }
  }

  encdown(down).iterator()
})

test('.keyAsBuffer and .valueAsBuffer as buffers if encoding says so', function (t) {
  t.plan(2)

  const down = {
    iterator: function (options) {
      t.is(options.keyAsBuffer, true)
      t.is(options.valueAsBuffer, true)
    }
  }

  const db = encdown(down, {
    keyEncoding: {
      buffer: true
    },
    valueEncoding: {
      buffer: true
    }
  })

  db.iterator()
})

test('.keyAsBuffer and .valueAsBuffer as strings if encoding says so', function (t) {
  t.plan(2)

  const down = {
    iterator: function (options) {
      t.is(options.keyAsBuffer, false)
      t.is(options.valueAsBuffer, false)
    }
  }

  const db = encdown(down, {
    keyEncoding: {
      buffer: false
    },
    valueEncoding: {
      buffer: false
    }
  })

  db.iterator()
})

test('iterator options.keys and options.values default to true', function (t) {
  t.plan(2)

  const down = {
    iterator: function (options) {
      t.is(options.keys, true)
      t.is(options.values, true)
    }
  }

  encdown(down).iterator()
})

test('iterator skips keys if options.keys is false', function (t) {
  t.plan(4)

  const down = {
    iterator: function (options) {
      t.is(options.keys, false)

      return {
        next: function (callback) {
          callback(null, '', 'value')
        }
      }
    }
  }

  const keyEncoding = {
    decode: function (key) {
      t.fail('should not be called')
    }
  }

  const db = encdown(down, { keyEncoding })
  const it = db.iterator({ keys: false })

  it.next(function (err, key, value) {
    t.ifError(err, 'no next error')
    t.is(key, undefined, 'normalized key to undefined')
    t.is(value, 'value', 'got value')
  })
})

test('iterator skips values if options.values is false', function (t) {
  t.plan(4)

  const down = {
    iterator: function (options) {
      t.is(options.values, false)

      return {
        next: function (callback) {
          callback(null, 'key', '')
        }
      }
    }
  }

  const valueEncoding = {
    decode: function (value) {
      t.fail('should not be called')
    }
  }

  const db = encdown(down, { valueEncoding })
  const it = db.iterator({ values: false })

  it.next(function (err, key, value) {
    t.ifError(err, 'no next error')
    t.is(key, 'key', 'got key')
    t.is(value, undefined, 'normalized value to undefined')
  })
})

test('iterator encodes range options', function (t) {
  t.plan(5)

  const keyEncoding = {
    encode: function (key) {
      return 'encoded_' + key
    },
    buffer: false
  }

  const db = encdown({
    iterator: function (options) {
      t.is(options.gt, 'encoded_3')
      t.is(options.gte, 'encoded_4')
      t.is(options.lt, 'encoded_5')
      t.is(options.lte, 'encoded_6')
      t.is(options.foo, 7)
    }
  }, { keyEncoding })

  db.iterator({ gt: 3, gte: 4, lt: 5, lte: 6, foo: 7 })
})

test('iterator does not strip nullish range options', function (t) {
  t.plan(12)

  encdown({
    iterator: function (options) {
      t.is(options.gt, null)
      t.is(options.gte, null)
      t.is(options.lt, null)
      t.is(options.lte, null)
    }
  }).iterator({
    gt: null,
    gte: null,
    lt: null,
    lte: null
  })

  encdown({
    iterator: function (options) {
      t.ok(hasOwnProperty.call(options, 'gt'))
      t.ok(hasOwnProperty.call(options, 'gte'))
      t.ok(hasOwnProperty.call(options, 'lt'))
      t.ok(hasOwnProperty.call(options, 'lte'))

      t.is(options.gt, undefined)
      t.is(options.gte, undefined)
      t.is(options.lt, undefined)
      t.is(options.lte, undefined)
    }
  }).iterator({
    gt: undefined,
    gte: undefined,
    lt: undefined,
    lte: undefined
  })
})

test('iterator does not add nullish range options', function (t) {
  t.plan(4)

  encdown({
    iterator: function (options) {
      t.notOk(hasOwnProperty.call(options, 'gt'))
      t.notOk(hasOwnProperty.call(options, 'gte'))
      t.notOk(hasOwnProperty.call(options, 'lt'))
      t.notOk(hasOwnProperty.call(options, 'lte'))
    }
  }).iterator({})
})

test('iterator forwards next() error from underlying iterator', function (t) {
  t.plan(1)

  const down = {
    iterator: function () {
      return {
        next: function (callback) {
          process.nextTick(callback, new Error('from underlying iterator'))
        }
      }
    }
  }

  const db = encdown(down)
  const it = db.iterator()

  it.next(function (err, key, value) {
    t.is(err.message, 'from underlying iterator')
  })
})

test('iterator forwards end() to underlying iterator', function (t) {
  t.plan(2)

  const down = {
    iterator: function () {
      return {
        end: function (callback) {
          t.pass('called')
          process.nextTick(callback)
        }
      }
    }
  }

  const db = encdown(down)
  const it = db.iterator()

  it.end(function () {
    t.pass('called')
  })
})

test('iterator catches decoding error from keyEncoding', function (t) {
  t.plan(5)

  const down = {
    iterator: function () {
      return {
        next: function (callback) {
          process.nextTick(callback, null, 'key', 'value')
        }
      }
    }
  }

  const db = encdown(down, {
    keyEncoding: {
      decode: function (key) {
        t.is(key, 'key')
        throw new Error('from codec')
      }
    }
  })

  db.iterator().next(function (err, key, value) {
    t.is(err.message, 'from codec')
    t.is(err.name, 'EncodingError')
    t.is(key, undefined)
    t.is(value, undefined)
  })
})

test('iterator catches decoding error from valueEncoding', function (t) {
  t.plan(5)

  const down = {
    iterator: function () {
      return {
        next: function (callback) {
          process.nextTick(callback, null, 'key', 'value')
        }
      }
    }
  }

  const db = encdown(down, {
    valueEncoding: {
      decode: function (value) {
        t.is(value, 'value')
        throw new Error('from codec')
      }
    }
  })

  db.iterator().next(function (err, key, value) {
    t.is(err.message, 'from codec')
    t.is(err.name, 'EncodingError')
    t.is(key, undefined)
    t.is(value, undefined)
  })
})

test('proxies approximateSize() if it exists', function (t) {
  t.is(typeof encdown({ approximateSize: noop }).approximateSize, 'function')
  t.ok(encdown({ approximateSize: noop }).supports.additionalMethods.approximateSize)
  t.is(encdown({}).approximateSize, undefined)
  t.notOk(encdown({}).supports.additionalMethods.approximateSize)
  t.end()
})

test('proxies compactRange() if it exists', function (t) {
  t.is(typeof encdown({ compactRange: noop }).compactRange, 'function')
  t.ok(encdown({ compactRange: noop }).supports.additionalMethods.compactRange)
  t.is(encdown({}).compactRange, undefined)
  t.notOk(encdown({}).supports.additionalMethods.compactRange)
  t.end()
})

test('encodes start and end of approximateSize()', function (t) {
  const db = encdown({
    approximateSize: function (start, end) {
      t.is(start, '1')
      t.is(end, '2')
      t.end()
    }
  })

  db.approximateSize(1, 2, noop)
})

test('encodes start and end of compactRange()', function (t) {
  const db = encdown({
    compactRange: function (start, end) {
      t.is(start, '1')
      t.is(end, '2')
      t.end()
    }
  })

  db.compactRange(1, 2, noop)
})

test('encodes start and end of approximateSize() with custom encoding', function (t) {
  const db = encdown({
    approximateSize: function (start, end) {
      t.is(start, '"a"')
      t.is(end, '"b"')
      t.end()
    }
  })

  db.approximateSize('a', 'b', { keyEncoding: 'json' }, noop)
})

test('encodes start and end of compactRange() with custom encoding', function (t) {
  const db = encdown({
    compactRange: function (start, end) {
      t.is(start, '"a"')
      t.is(end, '"b"')
      t.end()
    }
  })

  db.compactRange('a', 'b', { keyEncoding: 'json' }, noop)
})

test('encodes seek target', function (t) {
  t.plan(1)

  const db = encdown({
    iterator: function () {
      return {
        seek: function (target) {
          t.is(target, '123', 'encoded number')
        }
      }
    }
  }, { keyEncoding: 'json' })

  db.iterator().seek(123)
})

test('encodes seek target with custom encoding', function (t) {
  t.plan(1)

  const targets = []
  const db = encdown({
    iterator: function () {
      return {
        seek: function (target) {
          targets.push(target)
        }
      }
    }
  })

  db.iterator().seek('a')
  db.iterator({ keyEncoding: 'json' }).seek('a')

  t.same(targets, ['a', '"a"'], 'encoded targets')
})

test('encodes nullish seek target', function (t) {
  t.plan(1)

  const targets = []
  const db = encdown({
    iterator: function () {
      return {
        seek: function (target) {
          targets.push(target)
        }
      }
    }
  }, { keyEncoding: { encode: String } })

  // Unlike keys, nullish targets should not be rejected;
  // assume that the encoding gives these types meaning.
  db.iterator().seek(null)
  db.iterator().seek(undefined)

  t.same(targets, ['null', 'undefined'], 'encoded')
})

test('clear() forwards default options', function (t) {
  t.plan(3)

  const down = {
    clear: function (options, callback) {
      t.is(options.reverse, false)
      t.is(options.limit, -1)
      t.is(callback, noop)
    }
  }

  encdown(down).clear(noop)
})

test('clear() forwards error from underlying store', function (t) {
  t.plan(1)

  const down = {
    clear: function (options, cb) {
      process.nextTick(cb, new Error('error from store'))
    }
  }

  encdown(down).clear(function (err) {
    t.is(err.message, 'error from store')
  })
})

test('clear() encodes range options', function (t) {
  t.plan(5)

  const keyEncoding = {
    encode: function (key) {
      return 'encoded_' + key
    },
    buffer: false
  }

  const db = encdown({
    clear: function (options) {
      t.is(options.gt, 'encoded_1')
      t.is(options.gte, 'encoded_2')
      t.is(options.lt, 'encoded_3')
      t.is(options.lte, 'encoded_4')
      t.is(options.foo, 5)
    }
  }, { keyEncoding })

  db.clear({ gt: 1, gte: 2, lt: 3, lte: 4, foo: 5 }, noop)
})

test('clear() does not strip nullish range options', function (t) {
  t.plan(12)

  encdown({
    clear: function (options) {
      t.is(options.gt, null)
      t.is(options.gte, null)
      t.is(options.lt, null)
      t.is(options.lte, null)
    }
  }).clear({
    gt: null,
    gte: null,
    lt: null,
    lte: null
  }, noop)

  encdown({
    clear: function (options) {
      t.ok(hasOwnProperty.call(options, 'gt'))
      t.ok(hasOwnProperty.call(options, 'gte'))
      t.ok(hasOwnProperty.call(options, 'lt'))
      t.ok(hasOwnProperty.call(options, 'lte'))

      t.is(options.gt, undefined)
      t.is(options.gte, undefined)
      t.is(options.lt, undefined)
      t.is(options.lte, undefined)
    }
  }).clear({
    gt: undefined,
    gte: undefined,
    lt: undefined,
    lte: undefined
  }, noop)
})

test('clear() does not add nullish range options', function (t) {
  t.plan(4)

  encdown({
    clear: function (options) {
      t.notOk(hasOwnProperty.call(options, 'gt'))
      t.notOk(hasOwnProperty.call(options, 'gte'))
      t.notOk(hasOwnProperty.call(options, 'lt'))
      t.notOk(hasOwnProperty.call(options, 'lte'))
    }
  }).clear({}, noop)
})
