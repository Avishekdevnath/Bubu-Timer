const test = require('node:test')
const assert = require('node:assert')
const { requireString, requireSlot, requireEmail, requirePassword, validateBroadcast, validateEmailMessage, escapeHtml, markdownToHtml } = require('./adminValidation.js')

test('requireString accepts and trims a normal string', () => {
  assert.strictEqual(requireString('  abc  ', 'uid', 200), 'abc')
})

test('requireString rejects empty, non-string, whitespace-only', () => {
  for (const bad of ['', '   ', null, undefined, 42, {}]) {
    assert.throws(() => requireString(bad, 'uid', 200), /uid must be a non-empty string/)
  }
})

test('requireString rejects over-length', () => {
  assert.throws(() => requireString('x'.repeat(201), 'uid', 200), /uid too long/)
})

test('validateBroadcast trims and returns title/body', () => {
  assert.deepStrictEqual(
    validateBroadcast({ title: ' Hi ', body: ' There ' }),
    { title: 'Hi', body: 'There', url: '/home', toUid: null },
  )
})

test('validateBroadcast enforces limits', () => {
  assert.throws(() => validateBroadcast({ title: 'x'.repeat(101), body: 'ok' }), /title too long/)
  assert.throws(() => validateBroadcast({ title: 'ok', body: 'x'.repeat(501) }), /body too long/)
  assert.throws(() => validateBroadcast({ title: '', body: 'ok' }), /title must be a non-empty string/)
})

test('validateBroadcast defaults url to /home', () => {
  assert.strictEqual(validateBroadcast({ title: 'a', body: 'b' }).url, '/home')
  assert.strictEqual(validateBroadcast({ title: 'a', body: 'b', url: '' }).url, '/home')
})

test('validateBroadcast accepts and trims a route url', () => {
  assert.strictEqual(validateBroadcast({ title: 'a', body: 'b', url: ' /buddy ' }).url, '/buddy')
})

test('validateBroadcast rejects bad urls', () => {
  assert.throws(() => validateBroadcast({ title: 'a', body: 'b', url: 'https://evil.com' }), /url must start with \//)
  assert.throws(() => validateBroadcast({ title: 'a', body: 'b', url: '/' + 'x'.repeat(200) }), /url too long/)
})

test('requireSlot accepts A or B', () => {
  assert.strictEqual(requireSlot('A'), 'A')
  assert.strictEqual(requireSlot('B'), 'B')
})

test('requireSlot rejects anything else', () => {
  for (const bad of ['', 'C', null, undefined, 'a', 'AB']) {
    assert.throws(() => requireSlot(bad), /slot must be A or B/)
  }
})

test('validateBroadcast defaults toUid to null', () => {
  assert.strictEqual(validateBroadcast({ title: 'a', body: 'b' }).toUid, null)
  assert.strictEqual(validateBroadcast({ title: 'a', body: 'b', toUid: '' }).toUid, null)
})

test('validateBroadcast trims and returns a valid toUid', () => {
  assert.strictEqual(validateBroadcast({ title: 'a', body: 'b', toUid: ' uid123 ' }).toUid, 'uid123')
})

test('requireEmail accepts and trims a valid email', () => {
  assert.strictEqual(requireEmail(' a@b.com ', 'email'), 'a@b.com')
})

test('requireEmail rejects malformed or empty', () => {
  for (const bad of ['', 'notanemail', 'a@b', '@b.com', null]) {
    assert.throws(() => requireEmail(bad, 'email'), /email must be/)
  }
})

test('requirePassword accepts 6+ chars', () => {
  assert.strictEqual(requirePassword('abcdef'), 'abcdef')
})

test('requirePassword rejects short or empty', () => {
  assert.throws(() => requirePassword('abc'), /at least 6 characters/)
  assert.throws(() => requirePassword(''), /password must be/)
})

test('validateEmailMessage trims and returns subject/body', () => {
  assert.deepStrictEqual(
    validateEmailMessage({ subject: ' Hi ', body: ' There ' }),
    { subject: 'Hi', body: 'There', toUid: null },
  )
})

test('validateEmailMessage enforces limits', () => {
  assert.throws(() => validateEmailMessage({ subject: 'x'.repeat(201), body: 'ok' }), /subject too long/)
  assert.throws(() => validateEmailMessage({ subject: 'ok', body: 'x'.repeat(20001) }), /body too long/)
  assert.throws(() => validateEmailMessage({ subject: '', body: 'ok' }), /subject must be a non-empty string/)
})

test('validateEmailMessage allows a long, richly formatted body', () => {
  assert.strictEqual(validateEmailMessage({ subject: 'ok', body: 'x'.repeat(20000) }).body.length, 20000)
})

test('validateEmailMessage defaults toUid to null, accepts a valid one', () => {
  assert.strictEqual(validateEmailMessage({ subject: 'a', body: 'b' }).toUid, null)
  assert.strictEqual(validateEmailMessage({ subject: 'a', body: 'b', toUid: '' }).toUid, null)
  assert.strictEqual(validateEmailMessage({ subject: 'a', body: 'b', toUid: ' uid123 ' }).toUid, 'uid123')
})

test('escapeHtml escapes the five reserved characters', () => {
  assert.strictEqual(escapeHtml(`<b>"a" & 'b'</b>`), '&lt;b&gt;&quot;a&quot; &amp; &#39;b&#39;&lt;/b&gt;')
})

test('escapeHtml leaves plain text unchanged', () => {
  assert.strictEqual(escapeHtml('hello world 123'), 'hello world 123')
})

test('markdownToHtml wraps plain text in a paragraph', () => {
  assert.strictEqual(markdownToHtml('hello world'), '<p style="margin:0 0 12px">hello world</p>')
})

test('markdownToHtml preserves emoji unchanged', () => {
  assert.strictEqual(markdownToHtml('Hi 👋 there 🎉'), '<p style="margin:0 0 12px">Hi 👋 there 🎉</p>')
})

test('markdownToHtml converts **bold**', () => {
  assert.strictEqual(markdownToHtml('hello **world**'), '<p style="margin:0 0 12px">hello <strong>world</strong></p>')
})

test('markdownToHtml converts *italic* and _italic_', () => {
  assert.strictEqual(markdownToHtml('hi *there*'), '<p style="margin:0 0 12px">hi <em>there</em></p>')
  assert.strictEqual(markdownToHtml('hi _there_'), '<p style="margin:0 0 12px">hi <em>there</em></p>')
})

test('markdownToHtml converts `inline code`', () => {
  assert.strictEqual(
    markdownToHtml('run `npm test`'),
    '<p style="margin:0 0 12px">run <code style="background:#f5f5f4;padding:1px 5px;border-radius:4px;font-family:monospace;font-size:13px">npm test</code></p>',
  )
})

test('markdownToHtml converts [text](https://url) links, ignores non-http schemes', () => {
  assert.strictEqual(
    markdownToHtml('[Bubu](https://bubu-study-timer.web.app)'),
    '<p style="margin:0 0 12px"><a href="https://bubu-study-timer.web.app" style="color:#0891b2;text-decoration:underline">Bubu</a></p>',
  )
  assert.strictEqual(
    markdownToHtml('[bad](javascript:alert(1))'),
    '<p style="margin:0 0 12px">[bad](javascript:alert(1))</p>',
  )
})

test('markdownToHtml converts a bullet list block', () => {
  assert.strictEqual(
    markdownToHtml('- one\n- two'),
    '<ul style="margin:0 0 12px;padding-left:20px"><li>one</li><li>two</li></ul>',
  )
})

test('markdownToHtml splits blank-line-separated paragraphs, keeps single newlines as <br>', () => {
  assert.strictEqual(
    markdownToHtml('line one\nline two\n\nsecond paragraph'),
    '<p style="margin:0 0 12px">line one<br>line two</p><p style="margin:0 0 12px">second paragraph</p>',
  )
})

test('markdownToHtml escapes raw HTML before formatting', () => {
  assert.strictEqual(
    markdownToHtml('<script>alert(1)</script> **bold**'),
    '<p style="margin:0 0 12px">&lt;script&gt;alert(1)&lt;/script&gt; <strong>bold</strong></p>',
  )
})

test('markdownToHtml converts ~~strikethrough~~', () => {
  assert.strictEqual(markdownToHtml('~~gone~~'), '<p style="margin:0 0 12px"><s>gone</s></p>')
})

test('markdownToHtml converts # / ## / ### headings', () => {
  assert.strictEqual(markdownToHtml('# Big'), '<h1 style="margin:0 0 12px;font-size:20px;font-weight:700">Big</h1>')
  assert.strictEqual(markdownToHtml('## Medium'), '<h2 style="margin:0 0 12px;font-size:17px;font-weight:700">Medium</h2>')
  assert.strictEqual(markdownToHtml('### Small'), '<h3 style="margin:0 0 12px;font-size:15px;font-weight:700">Small</h3>')
})

test('markdownToHtml converts a numbered list block', () => {
  assert.strictEqual(
    markdownToHtml('1. one\n2. two'),
    '<ol style="margin:0 0 12px;padding-left:20px"><li>one</li><li>two</li></ol>',
  )
})

test('markdownToHtml converts a blockquote block', () => {
  assert.strictEqual(
    markdownToHtml('> quoted line one\n> quoted line two'),
    '<blockquote style="margin:0 0 12px;padding-left:12px;border-left:3px solid #d6d3d1;color:#57534e">quoted line one<br>quoted line two</blockquote>',
  )
})

test('markdownToHtml converts a horizontal rule', () => {
  assert.strictEqual(markdownToHtml('---'), '<hr style="border:none;border-top:1px solid #e7e5e4;margin:16px 0">')
})
