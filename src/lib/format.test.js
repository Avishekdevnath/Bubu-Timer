import { describe, expect, it } from 'vitest'
import { formatClock, formatStudyMinutes, pad } from './format.js'

describe('format helpers', () => {
  it('pads numbers to two digits', () => {
    expect(pad(4)).toBe('04')
    expect(pad(14)).toBe('14')
  })

  it('formats seconds as MM:SS', () => {
    expect(formatClock(0)).toBe('00:00')
    expect(formatClock(65)).toBe('01:05')
    expect(formatClock(-5)).toBe('00:00')
  })

  it('formats study minutes compactly', () => {
    expect(formatStudyMinutes(45)).toBe('45m')
    expect(formatStudyMinutes(125)).toBe('2h5m')
  })
})
