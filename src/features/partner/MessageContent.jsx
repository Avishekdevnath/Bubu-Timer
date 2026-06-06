// Lightweight markdown renderer — replaces react-markdown + remark-gfm (~90KB gzipped saved)

const INLINE_RE = /\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|~~(.+?)~~|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)|(https?:\/\/\S+)/g

function parseInline(text) {
  const nodes = []
  let last = 0
  let k = 0
  for (const m of text.matchAll(INLINE_RE)) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    if (m[1]) nodes.push(<strong key={k++} className="font-semibold"><em className="italic">{m[1]}</em></strong>)
    else if (m[2]) nodes.push(<strong key={k++} className="font-semibold">{m[2]}</strong>)
    else if (m[3]) nodes.push(<em key={k++} className="italic">{m[3]}</em>)
    else if (m[4]) nodes.push(<del key={k++} className="opacity-70">{m[4]}</del>)
    else if (m[5]) nodes.push(<code key={k++} className="px-1 py-0.5 rounded bg-black/10 font-mono text-[12.5px]">{m[5]}</code>)
    else if (m[6]) nodes.push(<a key={k++} href={m[7]} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:opacity-80">{m[6]}</a>)
    else if (m[8]) nodes.push(<a key={k++} href={m[8]} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:opacity-80">{m[8]}</a>)
    last = m.index + m[0].length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes.length ? nodes : [text]
}

function parseBlocks(text) {
  const lines = text.split('\n')
  const blocks = []
  let i = 0
  let k = 0

  while (i < lines.length) {
    const line = lines[i]

    // Fenced code block
    if (line.startsWith('```')) {
      const code = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) { code.push(lines[i]); i++ }
      blocks.push(
        <pre key={k++} className="m-0">
          <code className="block px-3 py-2 my-1 rounded-lg bg-black/15 font-mono text-[12.5px] whitespace-pre-wrap overflow-x-auto">
            {code.join('\n')}
          </code>
        </pre>
      )
      i++; continue
    }

    // Heading
    const hm = line.match(/^(#{1,3})\s+(.+)/)
    if (hm) {
      const lvl = hm[1].length
      const cls = lvl === 1 ? 'font-bold text-base mt-1 mb-0.5' : lvl === 2 ? 'font-bold text-[15px] mt-1 mb-0.5' : 'font-bold text-[14px] mt-1 mb-0.5'
      blocks.push(<p key={k++} className={cls}>{parseInline(hm[2])}</p>)
      i++; continue
    }

    // HR
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      blocks.push(<hr key={k++} className="border-current/20 my-2" />)
      i++; continue
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const ql = []
      while (i < lines.length && lines[i].startsWith('> ')) { ql.push(lines[i].slice(2)); i++ }
      blocks.push(<blockquote key={k++} className="border-l-2 border-current/40 pl-3 italic opacity-90 my-1">{parseInline(ql.join('\n'))}</blockquote>)
      continue
    }

    // Unordered list
    if (/^[-*+] /.test(line)) {
      const items = []
      while (i < lines.length && /^[-*+] /.test(lines[i])) {
        items.push(<li key={items.length}>{parseInline(lines[i].slice(2))}</li>)
        i++
      }
      blocks.push(<ul key={k++} className="list-disc pl-5 my-1 space-y-0.5">{items}</ul>)
      continue
    }

    // Ordered list
    if (/^\d+\. /.test(line)) {
      const items = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(<li key={items.length}>{parseInline(lines[i].replace(/^\d+\. /, ''))}</li>)
        i++
      }
      blocks.push(<ol key={k++} className="list-decimal pl-5 my-1 space-y-0.5">{items}</ol>)
      continue
    }

    // Empty line
    if (!line.trim()) { i++; continue }

    // Paragraph — collect until block-level marker
    const paraLines = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith('```') &&
      !/^#{1,3} /.test(lines[i]) &&
      !lines[i].startsWith('> ') &&
      !/^[-*+] /.test(lines[i]) &&
      !/^\d+\. /.test(lines[i]) &&
      !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim())
    ) { paraLines.push(lines[i]); i++ }

    if (paraLines.length) {
      blocks.push(<p key={k++} className="m-0">{parseInline(paraLines.join('\n'))}</p>)
    }
  }

  return blocks
}

export function MessageContent({ text }) {
  return <>{parseBlocks(text)}</>
}
