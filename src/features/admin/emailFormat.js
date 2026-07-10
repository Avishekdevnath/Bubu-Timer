// Client-side mirror of functions/adminValidation.js's markdownToHtml, used
// only to render a live preview in the compose modals. Must stay in sync
// with the server copy — that one is the source of truth for what actually
// gets emailed; this one only has to look the same.

export function escapeHtml(str) {
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

export function markdownToHtml(text) {
  return escapeHtml(text).split(/\n{2,}/).map(formatBlock).join('')
}
