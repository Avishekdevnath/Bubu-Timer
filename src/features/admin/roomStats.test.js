import { describe, expect, it } from 'vitest'
import { filterRooms, messagesToday, roomTimestamps } from './roomStats.js'

describe('messagesToday', () => {
  it('counts only messages from today across all rooms', () => {
    const now = Date.now()
    const midnight = new Date(now)
    midnight.setHours(0, 0, 0, 0)
    const midnightMs = midnight.getTime()
    const rooms = {
      R1: { chat: { a: { ts: midnightMs + 1000 }, b: { ts: midnightMs - 1000 } } },
      R2: { chat: { c: { ts: midnightMs + 5000 } } },
    }
    expect(messagesToday(rooms, now)).toBe(2)
  })
  it('returns 0 for no rooms or no messages', () => {
    expect(messagesToday({}, Date.now())).toBe(0)
    expect(messagesToday({ R1: {} }, Date.now())).toBe(0)
  })
})

describe('roomTimestamps', () => {
  it('created = earliest joinedAt, lastActive = latest of chat/updatedAt', () => {
    const room = {
      A: { joinedAt: 100, updatedAt: 300 },
      B: { joinedAt: 200, updatedAt: 500 },
      chat: { m1: { ts: 400 } },
    }
    expect(roomTimestamps(room)).toEqual({ created: 100, lastActive: 500 })
  })
  it('handles missing slots and empty chat', () => {
    expect(roomTimestamps({})).toEqual({ created: 0, lastActive: 0 })
  })
})

describe('filterRooms', () => {
  const rooms = {
    ABC123: { A: { name: 'Alice' }, B: { name: 'Bob' } },
    XYZ999: { A: { name: 'Carol' } },
  }
  it('empty query returns all entries', () => {
    expect(filterRooms(rooms, '')).toHaveLength(2)
  })
  it('filters by room code, case-insensitive', () => {
    expect(filterRooms(rooms, 'abc').map(([code]) => code)).toEqual(['ABC123'])
  })
  it('filters by member name, case-insensitive', () => {
    expect(filterRooms(rooms, 'carol').map(([code]) => code)).toEqual(['XYZ999'])
  })
})
