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
  const body = requireString(data?.body, 'body', 20000)
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
    .replace(/~~([^~]+)~~/g, '<s>$1</s>')
    .replace(/(^|[\s>])_([^_]+)_(?=[\s<]|$)/g, '$1<em>$2</em>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:#f5f5f4;padding:1px 5px;border-radius:4px;font-family:monospace;font-size:13px">$1</code>')
}

const HEADING_SIZES = { 1: '20px', 2: '17px', 3: '15px' }

function formatBlock(block) {
  const lines = block.split('\n')

  if (lines.length === 1 && /^(?:---|\*\*\*)$/.test(lines[0].trim())) {
    return '<hr style="border:none;border-top:1px solid #e7e5e4;margin:16px 0">'
  }

  const heading = lines.length === 1 && lines[0].match(/^(#{1,3})\s+(.*)$/)
  if (heading) {
    const level = heading[1].length
    return `<h${level} style="margin:0 0 12px;font-size:${HEADING_SIZES[level]};font-weight:700">${inlineFormat(heading[2])}</h${level}>`
  }

  if (lines.every((l) => /^&gt;\s?/.test(l.trim()))) {
    const inner = lines.map((l) => inlineFormat(l.trim().replace(/^&gt;\s?/, ''))).join('<br>')
    return `<blockquote style="margin:0 0 12px;padding-left:12px;border-left:3px solid #d6d3d1;color:#57534e">${inner}</blockquote>`
  }

  if (lines.every((l) => /^[-*]\s+/.test(l.trim()))) {
    const items = lines.map((l) => `<li>${inlineFormat(l.trim().replace(/^[-*]\s+/, ''))}</li>`).join('')
    return `<ul style="margin:0 0 12px;padding-left:20px">${items}</ul>`
  }

  if (lines.every((l) => /^\d+\.\s+/.test(l.trim()))) {
    const items = lines.map((l) => `<li>${inlineFormat(l.trim().replace(/^\d+\.\s+/, ''))}</li>`).join('')
    return `<ol style="margin:0 0 12px;padding-left:20px">${items}</ol>`
  }

  return `<p style="margin:0 0 12px">${lines.map(inlineFormat).join('<br>')}</p>`
}

// Markdown subset for admin-authored emails: # / ## / ### headings, **bold**,
// *italic*/_italic_, ~~strikethrough~~, `code`, [text](https://url) links,
// "- " bullet lists, "1. " numbered lists, "> " blockquotes, "---" rules,
// blank-line paragraphs. Escapes HTML first so this is safe to use directly
// with untrusted admin input.
function markdownToHtml(text) {
  return escapeHtml(text).split(/\n{2,}/).map(formatBlock).join('')
}

module.exports = { requireString, requireSlot, requireEmail, requirePassword, validateBroadcast, validateEmailMessage, escapeHtml, markdownToHtml }
