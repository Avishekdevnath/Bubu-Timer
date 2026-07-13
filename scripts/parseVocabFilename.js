const NAMED_RE = /^(\d+)\s*[.,]\s*(.+)\.(png|jpe?g)$/i

export function parseVocabFilename(letter, filename) {
  const match = filename.match(NAMED_RE)
  if (!match) return null
  const [, numberStr, wordRaw] = match
  return {
    letter,
    word: wordRaw.trim(),
    filename,
    number: Number(numberStr),
  }
}
