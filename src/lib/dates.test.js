import { describe, expect, it } from 'vitest'
import { minutesToClock12h } from './dates.js'

describe('minutesToClock12h', () => {
  it('formats midnight', () => expect(minutesToClock12h(0)).toBe('12:00 AM'))
  it('formats 11:30 PM', () => expect(minutesToClock12h(23 * 60 + 30)).toBe('11:30 PM'))
  it('formats noon', () => expect(minutesToClock12h(12 * 60)).toBe('12:00 PM'))
  it('formats 9:05 AM', () => expect(minutesToClock12h(9 * 60 + 5)).toBe('9:05 AM'))
})
