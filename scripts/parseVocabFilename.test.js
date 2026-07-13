import { describe, expect, it } from 'vitest'
import { parseVocabFilename } from './parseVocabFilename.js'

describe('parseVocabFilename', () => {
  it('parses the standard "NN. Word.png" format', () => {
    expect(parseVocabFilename('I', '446. Irrevocable.png')).toEqual({
      letter: 'I',
      word: 'Irrevocable',
      filename: '446. Irrevocable.png',
      number: 446,
    })
  })

  it('handles a space before the period', () => {
    expect(parseVocabFilename('C', '195 . Compatible.png')).toEqual({
      letter: 'C',
      word: 'Compatible',
      filename: '195 . Compatible.png',
      number: 195,
    })
  })

  it('handles a comma delimiter', () => {
    expect(parseVocabFilename('C', '214, Congeal.png')).toEqual({
      letter: 'C',
      word: 'Congeal',
      filename: '214, Congeal.png',
      number: 214,
    })
  })

  it('handles no space after the period', () => {
    expect(parseVocabFilename('C', '228.Culminate.png')).toEqual({
      letter: 'C',
      word: 'Culminate',
      filename: '228.Culminate.png',
      number: 228,
    })
  })

  it('handles .jpeg extension case-insensitively', () => {
    expect(parseVocabFilename('A', '05. Abomination.JPEG')).toEqual({
      letter: 'A',
      word: 'Abomination',
      filename: '05. Abomination.JPEG',
      number: 5,
    })
  })

  it('returns null for bare-numbered files with no word text', () => {
    expect(parseVocabFilename('A', '2.png')).toBeNull()
    expect(parseVocabFilename('A', '10.png')).toBeNull()
    expect(parseVocabFilename('A', '1.jpeg')).toBeNull()
  })

  it('returns null for non-image files', () => {
    expect(parseVocabFilename('A', '01. Abase.txt')).toBeNull()
  })
})
