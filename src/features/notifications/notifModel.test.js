import { describe, expect, it } from 'vitest'
import { unreadCount, visibleNotifs } from './notifModel.js'

const n = (id, extra = {}) => ({ id, toUid: null, ...extra })

describe('visibleNotifs', () => {
  it('returns all global notifs with empty state', () => {
    expect(visibleNotifs([n('a'), n('b')], {}, 'u1')).toHaveLength(2)
  })
  it('filters deleted', () => {
    const state = { deleted: { a: true } }
    expect(visibleNotifs([n('a'), n('b')], state, 'u1').map((x) => x.id)).toEqual(['b'])
  })
  it('filters toUid targeting to other users, keeps own and global', () => {
    const list = [n('a'), n('b', { toUid: 'u1' }), n('c', { toUid: 'u2' })]
    expect(visibleNotifs(list, {}, 'u1').map((x) => x.id)).toEqual(['a', 'b'])
  })
  it('handles undefined state', () => {
    expect(visibleNotifs([n('a')], undefined, 'u1')).toHaveLength(1)
  })
  it('filters array toUid (multi-user targeting) to members only', () => {
    const list = [n('a'), n('b', { toUid: ['u1', 'u3'] }), n('c', { toUid: ['u2', 'u3'] })]
    expect(visibleNotifs(list, {}, 'u1').map((x) => x.id)).toEqual(['a', 'b'])
  })
})

describe('unreadCount', () => {
  it('counts all visible when nothing read', () => {
    expect(unreadCount([n('a'), n('b')], {}, 'u1')).toBe(2)
  })
  it('excludes read', () => {
    expect(unreadCount([n('a'), n('b')], { read: { a: true } }, 'u1')).toBe(1)
  })
  it('excludes deleted even if unread', () => {
    expect(unreadCount([n('a'), n('b')], { deleted: { a: true } }, 'u1')).toBe(1)
  })
  it('zero for empty list', () => {
    expect(unreadCount([], {}, 'u1')).toBe(0)
  })
})
