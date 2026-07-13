import { describe, expect, it } from 'vitest'
import { lettersWithCards, cardsForLetter, favoriteKey, favoritedCards, cardUrl, toggleFavorite } from './vocabModel.js'

const manifest = [
  { letter: 'A', word: 'Abase', path: 'vocab-cards/A/01. Abase.png' },
  { letter: 'A', word: 'Abate', path: 'vocab-cards/A/2.png' },
  { letter: 'B', word: 'Bacchanal', path: 'vocab-cards/B/104. Bacchanal.png' },
]

describe('vocabModel', () => {
  it('lists letters present in the manifest, sorted', () => {
    expect(lettersWithCards(manifest)).toEqual(['A', 'B'])
  })

  it('filters cards by letter', () => {
    expect(cardsForLetter(manifest, 'A')).toHaveLength(2)
    expect(cardsForLetter(manifest, 'Z')).toEqual([])
  })

  it('builds a stable favorite key from letter+word', () => {
    expect(favoriteKey(manifest[0])).toBe('A/Abase')
  })

  it('returns only favorited cards, in manifest order', () => {
    const favs = favoritedCards(manifest, ['B/Bacchanal', 'A/Abate'])
    expect(favs.map((c) => c.word)).toEqual(['Abate', 'Bacchanal'])
  })

  it('returns no favorites when the list is empty', () => {
    expect(favoritedCards(manifest, [])).toEqual([])
  })

  it('builds a public Firebase Storage download URL', () => {
    const url = cardUrl('vocab-cards/A/01. Abase.png', 'bubu-study-timer.firebasestorage.app')
    expect(url).toBe(
      'https://firebasestorage.googleapis.com/v0/b/bubu-study-timer.firebasestorage.app/o/vocab-cards%2FA%2F01.%20Abase.png?alt=media',
    )
  })

  it('toggles a favorite key on and off', () => {
    const added = toggleFavorite([], 'A/Abase')
    expect(added).toEqual(['A/Abase'])
    const removed = toggleFavorite(added, 'A/Abase')
    expect(removed).toEqual([])
  })
})
