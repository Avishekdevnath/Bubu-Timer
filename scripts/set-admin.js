// Usage: GOOGLE_APPLICATION_CREDENTIALS=path/to/key.json node scripts/set-admin.js user@email.com
// Grants { admin: true } custom claim. Run once per admin account.
// Borrows firebase-admin from functions/ — resolve modules as if from that folder.
import { createRequire } from 'node:module'
const require = createRequire(new URL('../functions/package.json', import.meta.url))
const { initializeApp, applicationDefault } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')

const email = process.argv[2]
if (!email) {
  console.error('Usage: node scripts/set-admin.js <email>')
  process.exit(1)
}
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS to your service-account key path first.')
  process.exit(1)
}

initializeApp({ credential: applicationDefault() })

const user = await getAuth().getUserByEmail(email)
await getAuth().setCustomUserClaims(user.uid, { ...(user.customClaims || {}), admin: true })
console.log(`admin:true set for ${email} (uid ${user.uid}). Sign out/in in the app to refresh the token.`)
