import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import sharp from 'sharp'
import { createWorker } from 'tesseract.js'
import { parseVocabFilename } from './parseVocabFilename.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const SOURCE_DIR = path.join(__dirname, '..', '..', 'vocab-photo-cards', 'Word Smart Combined Small')
const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'features', 'vocab', 'vocabManifest.json')
const IMAGE_RE = /\.(png|jpe?g)$/i

function cleanOcrWord(rawText) {
  const firstLine = (rawText.split('\n')[0] || '').replace(/[^A-Za-z]/g, '').trim()
  if (!firstLine) return null
  return firstLine[0].toUpperCase() + firstLine.slice(1).toLowerCase()
}

async function ocrTitle(worker, filePath) {
  const meta = await sharp(filePath).metadata()
  const cropHeight = Math.round(meta.height * 0.22)
  const cropped = await sharp(filePath)
    .extract({ left: 0, top: 0, width: meta.width, height: cropHeight })
    .toBuffer()
  const { data } = await worker.recognize(cropped)
  return cleanOcrWord(data.text)
}

function sortEntries(entries) {
  return entries.slice().sort((a, b) => {
    if (a.letter !== b.letter) return a.letter.localeCompare(b.letter)
    const an = a.number ?? Infinity
    const bn = b.number ?? Infinity
    if (an !== bn) return an - bn
    return a.filename.localeCompare(b.filename)
  })
}

async function main() {
  const letters = fs.readdirSync(SOURCE_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()

  const named = []
  const untitled = []

  for (const letter of letters) {
    const dir = path.join(SOURCE_DIR, letter)
    const files = fs.readdirSync(dir).filter((f) => IMAGE_RE.test(f))
    for (const filename of files) {
      const parsed = parseVocabFilename(letter, filename)
      if (parsed) named.push(parsed)
      else untitled.push({ letter, filename })
    }
  }

  console.log(`Found ${named.length} named cards, ${untitled.length} untitled cards needing OCR.`)

  const ocrResults = []
  if (untitled.length) {
    const worker = await createWorker('eng')
    for (const { letter, filename } of untitled) {
      const filePath = path.join(SOURCE_DIR, letter, filename)
      const word = await ocrTitle(worker, filePath)
      console.log(`OCR ${letter}/${filename} -> ${word ?? '(unreadable)'}`)
      if (word) ocrResults.push({ letter, word, filename, number: null })
    }
    await worker.terminate()
  }

  const skipped = untitled.length - ocrResults.length
  if (skipped > 0) {
    console.warn(`${skipped} untitled card(s) could not be OCR'd and were skipped — review manually.`)
  }

  const allEntries = sortEntries([...named, ...ocrResults])
  const manifest = allEntries.map(({ letter, word, filename }) => ({
    letter,
    word,
    path: `vocab-cards/${letter}/${filename}`,
  }))

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(manifest, null, 2) + '\n')
  console.log(`Wrote ${manifest.length} entries to ${OUTPUT_PATH}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
