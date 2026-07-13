import { describe, expect, it } from 'vitest'
import { buildSyncableState, mergeCloudIntoLocal, SYNCED_FIELDS } from './cloudSync.js'

describe('cloudSync vocabFavorites', () => {
  it('includes vocabFavorites in the synced fields', () => {
    expect(SYNCED_FIELDS).toContain('vocabFavorites')
  })

  it('carries vocabFavorites into the syncable payload', () => {
    const state = { vocabFavorites: ['A/Abase'], subjects: [] }
    expect(buildSyncableState(state).vocabFavorites).toEqual(['A/Abase'])
  })

  it('merges vocabFavorites from a cloud payload into local state', () => {
    const local = { vocabFavorites: [] }
    const merged = mergeCloudIntoLocal(local, { state: { vocabFavorites: ['B/Bacchanal'] } })
    expect(merged.vocabFavorites).toEqual(['B/Bacchanal'])
  })
})
