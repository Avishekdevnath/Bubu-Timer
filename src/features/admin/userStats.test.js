import { describe, expect, it } from 'vitest'
import { filterUsers, sortUsers } from './userStats.js'

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
