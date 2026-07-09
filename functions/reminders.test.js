const test = require('node:test')
const assert = require('node:assert')
const { isDueNow, isExpired, isNotStarted } = require('./reminders.js')

test('isDueNow matches exact time', () => {
  assert.strictEqual(isDueNow({ timeHour: 8, timeMinute: 0 }, 8, 0), true)
})

test('isDueNow matches anywhere within the 15-minute bucket', () => {
  assert.strictEqual(isDueNow({ timeHour: 8, timeMinute: 7 }, 8, 0), true)
  assert.strictEqual(isDueNow({ timeHour: 8, timeMinute: 14 }, 8, 0), true)
  assert.strictEqual(isDueNow({ timeHour: 8, timeMinute: 0 }, 8, 3), true)
})

test('isDueNow does not match outside the bucket', () => {
  assert.strictEqual(isDueNow({ timeHour: 8, timeMinute: 15 }, 8, 0), false)
  assert.strictEqual(isDueNow({ timeHour: 8, timeMinute: 45 }, 8, 30), false)
})

test('isDueNow does not match a different hour', () => {
  assert.strictEqual(isDueNow({ timeHour: 9, timeMinute: 0 }, 8, 0), false)
})

test('isExpired: no endDate never expires', () => {
  assert.strictEqual(isExpired({ endDate: null }, '2026-12-31'), false)
})

test('isExpired: expires the day after endDate', () => {
  assert.strictEqual(isExpired({ endDate: '2026-07-09' }, '2026-07-09'), false)
  assert.strictEqual(isExpired({ endDate: '2026-07-09' }, '2026-07-10'), true)
  assert.strictEqual(isExpired({ endDate: '2026-07-09' }, '2026-07-08'), false)
})

test('isNotStarted: no startDate always started', () => {
  assert.strictEqual(isNotStarted({ startDate: null }, '2026-07-09'), false)
})

test('isNotStarted: true before startDate, false on and after', () => {
  assert.strictEqual(isNotStarted({ startDate: '2026-07-10' }, '2026-07-09'), true)
  assert.strictEqual(isNotStarted({ startDate: '2026-07-10' }, '2026-07-10'), false)
  assert.strictEqual(isNotStarted({ startDate: '2026-07-10' }, '2026-07-11'), false)
})
