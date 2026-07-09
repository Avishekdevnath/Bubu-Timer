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

function requireEmail(value, name) {
  const trimmed = requireString(value, name, 200)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) throw new Error(`${name} must be a valid email`)
  return trimmed
}

function requirePassword(value) {
  const trimmed = requireString(value, 'password', 200)
  if (trimmed.length < 6) throw new Error('password must be at least 6 characters')
  return trimmed
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

function validateEmailMessage(data) {
  const subject = requireString(data?.subject, 'subject', 200)
  const body = requireString(data?.body, 'body', 5000)
  let toUid = null
  if (data?.toUid != null && String(data.toUid).trim() !== '') {
    toUid = requireString(data.toUid, 'toUid', 200)
  }
  return { subject, body, toUid }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function inlineFormat(str) {
  return str
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" style="color:#0891b2;text-decoration:underline">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s>])_([^_]+)_(?=[\s<]|$)/g, '$1<em>$2</em>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:#f5f5f4;padding:1px 5px;border-radius:4px;font-family:monospace;font-size:13px">$1</code>')
}

// Minimal markdown subset for admin-authored emails: **bold**, *italic*/_italic_,
// `code`, [text](https://url) links, "- " bullet lists, blank-line paragraphs.
// Escapes HTML first so this is safe to use directly with untrusted admin input.
function markdownToHtml(text) {
  const escaped = escapeHtml(text)
  return escaped
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split('\n')
      const isList = lines.length > 0 && lines.every((l) => /^[-*]\s+/.test(l.trim()))
      if (isList) {
        const items = lines.map((l) => `<li>${inlineFormat(l.trim().replace(/^[-*]\s+/, ''))}</li>`).join('')
        return `<ul style="margin:0 0 12px;padding-left:20px">${items}</ul>`
      }
      return `<p style="margin:0 0 12px">${lines.map(inlineFormat).join('<br>')}</p>`
    })
    .join('')
}

module.exports = { requireString, requireSlot, requireEmail, requirePassword, validateBroadcast, validateEmailMessage, escapeHtml, markdownToHtml }
