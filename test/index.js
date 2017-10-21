var test = require('tape')
var encdown = require('..')
var memdown = require('memdown')
var Buffer = require('safe-buffer').Buffer
var noop = function () {}

test('opens and closes the underlying db', function (t) {
  var _db = {
    open: function (opts, cb) {
      t.pass('open called')
      setImmediate(cb)
    },
    close: function (cb) {
      t.pass('close called')
      setImmediate(cb)
    }
  }
  var db = encdown(_db)
  db.open(function (err) {
    t.error(err, 'no error')
    db.close(function (err) {
      t.error(err, 'no error')
      t.end()
    })
  })
})

test('encodings defaults to utf8', function (t) {
  var db = encdown(memdown())
  t.ok(db.db, '.db should be set')
  t.ok(db.codec, '.codec should be set')
  t.deepEqual(db.codec.opts, {
    keyEncoding: 'utf8',
    valueEncoding: 'utf8'
  }, 'correct defaults')
  t.end()
})

test('test safe decode in get', function (t) {
  var memdb = memdown()
  var db = encdown(memdb, { valueEncoding: 'utf8' })
  db.put('foo', 'this {} is [] not : json', function (err) {
    t.error(err, 'no error')
    var db2 = encdown(memdb, { valueEncoding: 'json' })
    db2.get('foo', function (err, value) {
      t.equals('EncodingError', err.name)
      memdb.close(t.end.bind(t))
    })
  })
})

test('can decode from string to json', function (t) {
  var memdb = memdown()
  var db = encdown(memdb, { valueEncoding: 'utf8' })
  var data = { thisis: 'json' }
  db.put('foo', JSON.stringify(data), function (err) {
    t.error(err, 'no error')
    var db2 = encdown(memdb, { valueEncoding: 'json' })
    db2.get('foo', function (err, value) {
      t.error(err, 'no error')
      t.deepEqual(value, data, 'JSON.parse')
      memdb.close(t.end.bind(t))
    })
  })
})

test('can decode from json to string', function (t) {
  var memdb = memdown()
  var db = encdown(memdb, { valueEncoding: 'json' })
  var data = { thisis: 'json' }
  db.put('foo', data, function (err) {
    t.error(err, 'no error')
    var db2 = encdown(memdb, { valueEncoding: 'utf8' })
    db2.get('foo', function (err, value) {
      t.error(err, 'no error')
      t.deepEqual(value, JSON.stringify(data), 'JSON.stringify')
      memdb.close(t.end.bind(t))
    })
  })
})

test('binary encoding, using batch', function (t) {
  var data = [
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
  var db = encdown(memdown(), {
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

  var down = {
    get: function (key, options, cb) {
      t.is(options.asBuffer, false, '.asBuffer is false')
    }
  }

  var db = encdown(down)

  db.get('key', noop)
})

test('custom value encoding that retrieves a string from underlying store', function (t) {
  t.plan(1)

  var down = {
    get: function (key, options, cb) {
      t.is(options.asBuffer, false, '.asBuffer is false')
    }
  }

  var db = encdown(down, {
    valueEncoding: {
      buffer: false
    }
  })

  db.get('key', noop)
})

test('custom value encoding that retrieves a buffer from underlying store', function (t) {
  t.plan(1)

  var down = {
    get: function (key, options, cb) {
      t.is(options.asBuffer, true, '.asBuffer is true')
    }
  }

  var db = encdown(down, {
    valueEncoding: {
      buffer: true
    }
  })

  db.get('key', noop)
})

test('.keyAsBuffer and .valueAsBuffer defaults to false', function (t) {
  t.plan(2)

  var down = {
    iterator: function (options) {
      t.is(options.keyAsBuffer, false)
      t.is(options.valueAsBuffer, false)
    }
  }

  encdown(down).iterator()
})

test('.keyAsBuffer and .valueAsBuffer as buffers if encoding says so', function (t) {
  t.plan(2)

  var down = {
    iterator: function (options) {
      t.is(options.keyAsBuffer, true)
      t.is(options.valueAsBuffer, true)
    }
  }

  var db = encdown(down, {
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

  var down = {
    iterator: function (options) {
      t.is(options.keyAsBuffer, false)
      t.is(options.valueAsBuffer, false)
    }
  }

  var db = encdown(down, {
    keyEncoding: {
      buffer: false
    },
    valueEncoding: {
      buffer: false
    }
  })

  db.iterator()
})
