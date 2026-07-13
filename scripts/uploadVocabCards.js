import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import admin from 'firebase-admin'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SOURCE_DIR = path.join(__dirname, '..', '..', 'vocab-photo-cards', 'Word Smart Combined Small')
const MANIFEST_PATH = path.join(__dirname, '..', 'src', 'features', 'vocab', 'vocabManifest.json')
const BUCKET = 'bubu-study-timer.firebasestorage.app'
const CACHE_CONTROL = 'public, max-age=2592000'

const keyPath = process.argv[2]
if (!keyPath) {
  console.error('Usage: node scripts/uploadVocabCards.js <path-to-service-account-key.json>')
  process.exit(1)
}

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(fs.readFileSync(keyPath, 'utf8'))),
  storageBucket: BUCKET,
})

const bucket = admin.storage().bucket()

function sourceFileFor(entry) {
  // manifest path is "vocab-cards/<Letter>/<filename>" — strip the "vocab-cards/" prefix
  // and letter to rebuild the on-disk source path (which uses the original folder name).
  const [, letter, ...rest] = entry.path.split('/')
  return path.join(SOURCE_DIR, letter, rest.join('/'))
}

async function needsUpload(destPath, localSize) {
  const file = bucket.file(destPath)
  const [exists] = await file.exists()
  if (!exists) return true
  const [meta] = await file.getMetadata()
  return Number(meta.size) !== localSize
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'))
  let uploaded = 0
  let skipped = 0
  let failed = 0

  for (const entry of manifest) {
    const sourceFile = sourceFileFor(entry)
    try {
      const localSize = fs.statSync(sourceFile).size
      if (!(await needsUpload(entry.path, localSize))) {
        skipped++
        continue
      }
      await bucket.upload(sourceFile, {
        destination: entry.path,
        metadata: { cacheControl: CACHE_CONTROL },
      })
      uploaded++
      if (uploaded % 100 === 0) console.log(`Uploaded ${uploaded}...`)
    } catch (err) {
      failed++
      console.error(`FAILED ${entry.path}:`, err.message)
    }
  }

  console.log(`Done. Uploaded ${uploaded}, skipped (already present) ${skipped}, failed ${failed}, total ${manifest.length}.`)
  if (failed > 0) process.exit(1)
}

main()
