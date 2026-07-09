const test = require('node:test')
const assert = require('node:assert')
const { requireString, requireSlot, requireEmail, requirePassword, validateBroadcast } = require('./adminValidation.js')

test('requireString accepts and trims a normal string', () => {
  assert.strictEqual(requireString('  abc  ', 'uid', 200), 'abc')
})

test('requireString rejects empty, non-string, whitespace-only', () => {
  for (const bad of ['', '   ', null, undefined, 42, {}]) {
    assert.throws(() => requireString(bad, 'uid', 200), /uid must be a non-empty string/)
  }
})

test('requireString rejects over-length', () => {
  assert.throws(() => requireString('x'.repeat(201), 'uid', 200), /uid too long/)
})

test('validateBroadcast trims and returns title/body', () => {
  assert.deepStrictEqual(
    validateBroadcast({ title: ' Hi ', body: ' There ' }),
    { title: 'Hi', body: 'There', url: '/home', toUid: null },
  )
})

test('validateBroadcast enforces limits', () => {
  assert.throws(() => validateBroadcast({ title: 'x'.repeat(101), body: 'ok' }), /title too long/)
  assert.throws(() => validateBroadcast({ title: 'ok', body: 'x'.repeat(501) }), /body too long/)
  assert.throws(() => validateBroadcast({ title: '', body: 'ok' }), /title must be a non-empty string/)
})

test('validateBroadcast defaults url to /home', () => {
  assert.strictEqual(validateBroadcast({ title: 'a', body: 'b' }).url, '/home')
  assert.strictEqual(validateBroadcast({ title: 'a', body: 'b', url: '' }).url, '/home')
})

test('validateBroadcast accepts and trims a route url', () => {
  assert.strictEqual(validateBroadcast({ title: 'a', body: 'b', url: ' /buddy ' }).url, '/buddy')
})

test('validateBroadcast rejects bad urls', () => {
  assert.throws(() => validateBroadcast({ title: 'a', body: 'b', url: 'https://evil.com' }), /url must start with \//)
  assert.throws(() => validateBroadcast({ title: 'a', body: 'b', url: '/' + 'x'.repeat(200) }), /url too long/)
})

test('requireSlot accepts A or B', () => {
  assert.strictEqual(requireSlot('A'), 'A')
  assert.strictEqual(requireSlot('B'), 'B')
})

test('requireSlot rejects anything else', () => {
  for (const bad of ['', 'C', null, undefined, 'a', 'AB']) {
    assert.throws(() => requireSlot(bad), /slot must be A or B/)
  }
})

test('validateBroadcast defaults toUid to null', () => {
  assert.strictEqual(validateBroadcast({ title: 'a', body: 'b' }).toUid, null)
  assert.strictEqual(validateBroadcast({ title: 'a', body: 'b', toUid: '' }).toUid, null)
})

test('validateBroadcast trims and returns a valid toUid', () => {
  assert.strictEqual(validateBroadcast({ title: 'a', body: 'b', toUid: ' uid123 ' }).toUid, 'uid123')
})

test('requireEmail accepts and trims a valid email', () => {
  assert.strictEqual(requireEmail(' a@b.com ', 'email'), 'a@b.com')
})

test('requireEmail rejects malformed or empty', () => {
  for (const bad of ['', 'notanemail', 'a@b', '@b.com', null]) {
    assert.throws(() => requireEmail(bad, 'email'), /email must be/)
  }
})

test('requirePassword accepts 6+ chars', () => {
  assert.strictEqual(requirePassword('abcdef'), 'abcdef')
})

test('requirePassword rejects short or empty', () => {
  assert.throws(() => requirePassword('abc'), /at least 6 characters/)
  assert.throws(() => requirePassword(''), /password must be/)
})
