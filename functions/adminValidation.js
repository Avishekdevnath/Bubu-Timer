function requireString(value, name, maxLen) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${name} must be a non-empty string`)
  }
  const trimmed = value.trim()
  if (trimmed.length > maxLen) {
    throw new Error(`${name} too long (max ${maxLen})`)
  }
  return trimmed
}

function requireSlot(value) {
  if (value !== 'A' && value !== 'B') throw new Error('slot must be A or B')
  return value
}

function validateBroadcast(data) {
  const title = requireString(data?.title, 'title', 100)
  const body = requireString(data?.body, 'body', 500)
  let url = '/home'
  if (data?.url != null && String(data.url).trim() !== '') {
    url = requireString(data.url, 'url', 200)
    if (!url.startsWith('/')) throw new Error('url must start with /')
  }
  let toUid = null
  if (data?.toUid != null && String(data.toUid).trim() !== '') {
    toUid = requireString(data.toUid, 'toUid', 200)
  }
  return { title, body, url, toUid }
}

module.exports = { requireString, requireSlot, validateBroadcast }
