import { describe, expect, it } from 'vitest'
import { filterUsers, sortUsers, usersToCsv } from './userStats.js'

describe('filterUsers', () => {
  const users = [
    { uid: '1', displayName: 'Alice Smith', email: 'alice@x.com' },
    { uid: '2', displayName: 'Bob Jones', email: 'bob@y.com' },
  ]
  it('empty query returns all', () => {
    expect(filterUsers(users, '')).toHaveLength(2)
  })
  it('filters by displayName, case-insensitive', () => {
    expect(filterUsers(users, 'alice').map((u) => u.uid)).toEqual(['1'])
  })
  it('filters by email, case-insensitive', () => {
    expect(filterUsers(users, 'BOB@Y').map((u) => u.uid)).toEqual(['2'])
  })
  it('no match returns empty array', () => {
    expect(filterUsers(users, 'zzz')).toHaveLength(0)
  })
})

describe('sortUsers', () => {
  const users = [
    { uid: '1', displayName: 'Bob', subjectsCount: 5, tokenCount: 1, lastSignInTime: '2026-01-02' },
    { uid: '2', displayName: 'Alice', subjectsCount: 2, tokenCount: 3, lastSignInTime: '2026-01-01' },
  ]
  it('sorts by name ascending', () => {
    expect(sortUsers(users, 'name', 'asc').map((u) => u.uid)).toEqual(['2', '1'])
  })
  it('sorts by name descending', () => {
    expect(sortUsers(users, 'name', 'desc').map((u) => u.uid)).toEqual(['1', '2'])
  })
  it('sorts by subjects ascending', () => {
    expect(sortUsers(users, 'subjects', 'asc').map((u) => u.uid)).toEqual(['2', '1'])
  })
  it('sorts by devices descending', () => {
    expect(sortUsers(users, 'devices', 'desc').map((u) => u.uid)).toEqual(['2', '1'])
  })
  it('sorts by lastSignIn descending (most recent first)', () => {
    expect(sortUsers(users, 'lastSignIn', 'desc').map((u) => u.uid)).toEqual(['1', '2'])
  })
  it('unknown key returns original order', () => {
    expect(sortUsers(users, 'bogus', 'asc').map((u) => u.uid)).toEqual(['1', '2'])
  })
})

describe('usersToCsv', () => {
  it('builds a header row plus one row per user', () => {
    const users = [
      { uid: '1', displayName: 'Alice', email: 'alice@x.com', subjectsCount: 2, planDays: 3, tokenCount: 1, disabled: false, lastSignInTime: '2026-01-01' },
    ]
    const csv = usersToCsv(users)
    const lines = csv.split('\n')
    expect(lines[0]).toBe('Name,Email,Subjects,Plan Days,Devices,Disabled,Last Sign-in')
    expect(lines[1]).toBe('Alice,alice@x.com,2,3,1,No,2026-01-01')
  })
  it('escapes commas and quotes in a field', () => {
    const users = [
      { uid: '1', displayName: 'Smith, "Al"', email: 'a@x.com', subjectsCount: 0, planDays: 0, tokenCount: 0, disabled: true, lastSignInTime: '' },
    ]
    const lines = usersToCsv(users).split('\n')
    expect(lines[1]).toBe('"Smith, ""Al""",a@x.com,0,0,0,Yes,')
  })
  it('handles empty user list (header only)', () => {
    expect(usersToCsv([]).split('\n')).toHaveLength(1)
  })
})
