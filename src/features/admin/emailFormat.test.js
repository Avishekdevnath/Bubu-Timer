import { describe, expect, it } from 'vitest'
import { escapeHtml, markdownToHtml } from './emailFormat.js'

describe('escapeHtml', () => {
  it('escapes the five reserved characters', () => {
    expect(escapeHtml(`<b>"a" & 'b'</b>`)).toBe('&lt;b&gt;&quot;a&quot; &amp; &#39;b&#39;&lt;/b&gt;')
  })

  it('leaves plain text unchanged', () => {
    expect(escapeHtml('hello world 123')).toBe('hello world 123')
  })
})

describe('markdownToHtml', () => {
  it('wraps plain text in a paragraph', () => {
    expect(markdownToHtml('hello world')).toBe('<p style="margin:0 0 12px">hello world</p>')
  })

  it('preserves emoji unchanged', () => {
    expect(markdownToHtml('Hi 👋 there 🎉')).toBe('<p style="margin:0 0 12px">Hi 👋 there 🎉</p>')
  })

  it('converts **bold**', () => {
    expect(markdownToHtml('hello **world**')).toBe('<p style="margin:0 0 12px">hello <strong>world</strong></p>')
  })

  it('converts *italic* and _italic_', () => {
    expect(markdownToHtml('hi *there*')).toBe('<p style="margin:0 0 12px">hi <em>there</em></p>')
    expect(markdownToHtml('hi _there_')).toBe('<p style="margin:0 0 12px">hi <em>there</em></p>')
  })

  it('converts ~~strikethrough~~', () => {
    expect(markdownToHtml('~~gone~~')).toBe('<p style="margin:0 0 12px"><s>gone</s></p>')
  })

  it('converts `inline code`', () => {
    expect(markdownToHtml('run `npm test`')).toBe(
      '<p style="margin:0 0 12px">run <code style="background:#f5f5f4;padding:1px 5px;border-radius:4px;font-family:monospace;font-size:13px">npm test</code></p>',
    )
  })

  it('converts [text](https://url) links, ignores non-http schemes', () => {
    expect(markdownToHtml('[Bubu](https://bubu-study-timer.web.app)')).toBe(
      '<p style="margin:0 0 12px"><a href="https://bubu-study-timer.web.app" style="color:#0891b2;text-decoration:underline">Bubu</a></p>',
    )
    expect(markdownToHtml('[bad](javascript:alert(1))')).toBe('<p style="margin:0 0 12px">[bad](javascript:alert(1))</p>')
  })

  it('converts # / ## / ### headings', () => {
    expect(markdownToHtml('# Big')).toBe('<h1 style="margin:0 0 12px;font-size:20px;font-weight:700">Big</h1>')
    expect(markdownToHtml('## Medium')).toBe('<h2 style="margin:0 0 12px;font-size:17px;font-weight:700">Medium</h2>')
    expect(markdownToHtml('### Small')).toBe('<h3 style="margin:0 0 12px;font-size:15px;font-weight:700">Small</h3>')
  })

  it('converts a bullet list block', () => {
    expect(markdownToHtml('- one\n- two')).toBe('<ul style="margin:0 0 12px;padding-left:20px"><li>one</li><li>two</li></ul>')
  })

  it('converts a numbered list block', () => {
    expect(markdownToHtml('1. one\n2. two')).toBe('<ol style="margin:0 0 12px;padding-left:20px"><li>one</li><li>two</li></ol>')
  })

  it('converts a blockquote block', () => {
    expect(markdownToHtml('> quoted line one\n> quoted line two')).toBe(
      '<blockquote style="margin:0 0 12px;padding-left:12px;border-left:3px solid #d6d3d1;color:#57534e">quoted line one<br>quoted line two</blockquote>',
    )
  })

  it('converts a horizontal rule', () => {
    expect(markdownToHtml('---')).toBe('<hr style="border:none;border-top:1px solid #e7e5e4;margin:16px 0">')
  })

  it('splits blank-line-separated paragraphs, keeps single newlines as <br>', () => {
    expect(markdownToHtml('line one\nline two\n\nsecond paragraph')).toBe(
      '<p style="margin:0 0 12px">line one<br>line two</p><p style="margin:0 0 12px">second paragraph</p>',
    )
  })

  it('escapes raw HTML before formatting', () => {
    expect(markdownToHtml('<script>alert(1)</script> **bold**')).toBe(
      '<p style="margin:0 0 12px">&lt;script&gt;alert(1)&lt;/script&gt; <strong>bold</strong></p>',
    )
  })
})
