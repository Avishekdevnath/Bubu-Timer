const test = require('node:test')
const assert = require('node:assert')
const { requireString, validateBroadcast } = require('./adminValidation.js')

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
    { title: 'Hi', body: 'There' },
  )
})

test('validateBroadcast enforces limits', () => {
  assert.throws(() => validateBroadcast({ title: 'x'.repeat(101), body: 'ok' }), /title too long/)
  assert.throws(() => validateBroadcast({ title: 'ok', body: 'x'.repeat(501) }), /body too long/)
  assert.throws(() => validateBroadcast({ title: '', body: 'ok' }), /title must be a non-empty string/)
})
