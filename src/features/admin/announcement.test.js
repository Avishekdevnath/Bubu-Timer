import { describe, expect, it } from 'vitest'
import { shouldShowAnnouncement } from './announcement.js'

describe('shouldShowAnnouncement', () => {
  it('hides when doc missing or inactive or empty text', () => {
    expect(shouldShowAnnouncement(null, 0)).toBe(false)
    expect(shouldShowAnnouncement({ text: 'hi', active: false, updatedAt: 5 }, 0)).toBe(false)
    expect(shouldShowAnnouncement({ text: '  ', active: true, updatedAt: 5 }, 0)).toBe(false)
  })

  it('shows active announcement not yet dismissed', () => {
    expect(shouldShowAnnouncement({ text: 'hi', active: true, updatedAt: 5 }, 0)).toBe(true)
  })

  it('hides after dismissal of same version, reshows newer version', () => {
    expect(shouldShowAnnouncement({ text: 'hi', active: true, updatedAt: 5 }, 5)).toBe(false)
    expect(shouldShowAnnouncement({ text: 'hi', active: true, updatedAt: 9 }, 5)).toBe(true)
  })
})
