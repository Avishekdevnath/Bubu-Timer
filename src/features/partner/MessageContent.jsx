import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Markdown components — minimal styling, inherits text color from bubble (white on dark, stone-800 on light)
const components = {
  p: ({ children }) => <p className="m-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  del: ({ children }) => <del className="opacity-70">{children}</del>,
  code: ({ inline, children }) =>
    inline
      ? <code className="px-1 py-0.5 rounded bg-black/10 font-mono text-[12.5px]">{children}</code>
      : <code className="block px-3 py-2 my-1 rounded-lg bg-black/15 font-mono text-[12.5px] whitespace-pre-wrap overflow-x-auto">{children}</code>,
  pre: ({ children }) => <pre className="m-0">{children}</pre>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:opacity-80">
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="list-disc pl-5 my-1 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 my-1 space-y-0.5">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  blockquote: ({ children }) => <blockquote className="border-l-2 border-current/40 pl-3 italic opacity-90 my-1">{children}</blockquote>,
  h1: ({ children }) => <p className="font-bold text-base mt-1 mb-0.5">{children}</p>,
  h2: ({ children }) => <p className="font-bold text-[15px] mt-1 mb-0.5">{children}</p>,
  h3: ({ children }) => <p className="font-bold text-[14px] mt-1 mb-0.5">{children}</p>,
  hr: () => <hr className="border-current/20 my-2" />,
}

export function MessageContent({ text }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {text}
    </ReactMarkdown>
  )
}
