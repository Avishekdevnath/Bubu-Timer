import { describe, expect, it } from 'vitest'
import { shouldShowAnnouncement } from './announcement.js'

const ann = (extra = {}) => ({ text: 'hi', active: true, notifId: 'n1', ...extra })

describe('shouldShowAnnouncement', () => {
  it('hides when doc missing, inactive, empty text, or no notifId', () => {
    expect(shouldShowAnnouncement(null, {})).toBe(false)
    expect(shouldShowAnnouncement(ann({ active: false }), {})).toBe(false)
    expect(shouldShowAnnouncement(ann({ text: '  ' }), {})).toBe(false)
    expect(shouldShowAnnouncement(ann({ notifId: undefined }), {})).toBe(false)
  })
  it('shows active announcement not yet read', () => {
    expect(shouldShowAnnouncement(ann(), {})).toBe(true)
    expect(shouldShowAnnouncement(ann(), undefined)).toBe(true)
  })
  it('hides after its notifId is read; new notifId reshows', () => {
    expect(shouldShowAnnouncement(ann(), { n1: true })).toBe(false)
    expect(shouldShowAnnouncement(ann({ notifId: 'n2' }), { n1: true })).toBe(true)
  })
})
