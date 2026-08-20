import type { ReactNode } from 'react'

/** Lightweight markdown → React (no extra deps). Covers headings, lists, code, links, images, paragraphs. */
export function BlogMarkdown({ markdown }: { markdown: string }) {
  if (!markdown?.trim()) return null
  const blocks = splitBlocks(markdown.trim())

  return (
    <div className="blog-prose space-y-5 text-[17px] sm:text-[18px] leading-[1.65] tracking-[-0.01em]">
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </div>
  )
}

type Block =
  | { type: 'h'; level: number; text: string }
  | { type: 'p'; text: string }
  | { type: 'img'; alt: string; src: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'code'; lang: string; code: string }
  | { type: 'quote'; text: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'hr' }

function isTableRow(line: string) {
  const t = line.trim()
  return t.startsWith('|') && t.endsWith('|') && t.includes('|')
}

function isTableSep(line: string) {
  return /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?$/.test(line.trim())
}

function parseTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map(c => c.trim())
}

function stripTags(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

function parseHtmlTable(html: string): Extract<Block, { type: 'table' }> | null {
  const rows = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(m => {
    const cells = [...m[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(c =>
      stripTags(c[1]),
    )
    return cells
  })
  if (!rows.length) return null
  const headers = rows[0]
  return { type: 'table', headers, rows: rows.slice(1) }
}

function splitBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n/g, '\n').split('\n')
  const out: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (!line.trim()) {
      i++
      continue
    }

    if (/^---+$/.test(line.trim())) {
      out.push({ type: 'hr' })
      i++
      continue
    }

    if (isTableRow(line) && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const headers = parseTableRow(line)
      i += 2
      const rows: string[][] = []
      while (i < lines.length && isTableRow(lines[i]) && !isTableSep(lines[i])) {
        rows.push(parseTableRow(lines[i]))
        i++
      }
      out.push({ type: 'table', headers, rows })
      continue
    }

    // Notion enhanced markdown returns tables as HTML
    if (/^<table\b/i.test(line.trim())) {
      const html: string[] = [line]
      i++
      while (i < lines.length && !/<\/table>/i.test(lines[i])) {
        html.push(lines[i])
        i++
      }
      if (i < lines.length) {
        html.push(lines[i])
        i++
      }
      const parsed = parseHtmlTable(html.join('\n'))
      if (parsed) out.push(parsed)
      continue
    }

    const fence = line.match(/^```(\w*)/)
    if (fence) {
      const lang = fence[1] || ''
      const code: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        code.push(lines[i])
        i++
      }
      i++
      out.push({ type: 'code', lang, code: code.join('\n') })
      continue
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/)
    if (heading) {
      out.push({ type: 'h', level: heading[1].length, text: heading[2].trim() })
      i++
      continue
    }

    if (line.startsWith('> ')) {
      const parts: string[] = []
      while (i < lines.length && lines[i].startsWith('> ')) {
        parts.push(lines[i].slice(2))
        i++
      }
      out.push({ type: 'quote', text: parts.join(' ') })
      continue
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ''))
        i++
      }
      out.push({ type: 'ul', items })
      continue
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''))
        i++
      }
      out.push({ type: 'ol', items })
      continue
    }

    const imageOnly = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
    if (imageOnly) {
      out.push({ type: 'img', alt: imageOnly[1], src: imageOnly[2] })
      i++
      continue
    }

    const parts: string[] = [line]
    i++
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^#{1,4}\s/.test(lines[i]) &&
      !/^```/.test(lines[i]) &&
      !/^[-*]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i]) &&
      !/^> /.test(lines[i]) &&
      !/^---+$/.test(lines[i].trim()) &&
      !(isTableRow(lines[i]) && i + 1 < lines.length && isTableSep(lines[i + 1]))
    ) {
      parts.push(lines[i])
      i++
    }
    out.push({ type: 'p', text: parts.join(' ') })
  }

  return out
}

function Block({ block }: { block: Block }) {
  switch (block.type) {
    case 'h': {
      const cls =
        block.level === 1
          ? 'text-[1.65rem] sm:text-[1.85rem] font-semibold tracking-[-0.03em] mt-10 mb-3'
          : block.level === 2
            ? 'text-[1.35rem] sm:text-[1.5rem] font-semibold tracking-[-0.025em] mt-10 mb-3'
            : 'text-[1.15rem] sm:text-[1.25rem] font-semibold tracking-[-0.02em] mt-8 mb-2'
      const Tag = (`h${Math.min(block.level + 1, 4)}` as 'h2')
      return <Tag className={cls}>{inline(block.text)}</Tag>
    }
    case 'p':
      return <p>{inline(block.text)}</p>
    case 'img':
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={block.src}
          alt={block.alt}
          className="my-8 w-full rounded-2xl border border-border/40 object-cover shadow-sm aspect-[16/10]"
          loading="lazy"
        />
      )
    case 'ul':
      return (
        <ul className="list-disc pl-5 space-y-1.5">
          {block.items.map((item, i) => (
            <li key={i}>{inline(item)}</li>
          ))}
        </ul>
      )
    case 'ol':
      return (
        <ol className="list-decimal pl-5 space-y-1.5">
          {block.items.map((item, i) => (
            <li key={i}>{inline(item)}</li>
          ))}
        </ol>
      )
    case 'code':
      return (
        <pre className="overflow-x-auto rounded-xl border border-border/60 bg-muted/40 p-4 text-[13px] font-mono leading-relaxed">
          <code>{block.code}</code>
        </pre>
      )
    case 'quote':
      return (
        <blockquote className="border-l-2 border-foreground/30 pl-4 text-muted-foreground italic">
          {inline(block.text)}
        </blockquote>
      )
    case 'table':
      return (
        <div className="my-6 overflow-x-auto rounded-xl border border-border/60">
          <table className="w-full text-sm text-left border-collapse min-w-[520px]">
            <thead className="bg-muted/40">
              <tr>
                {block.headers.map((h, i) => (
                  <th
                    key={i}
                    className="px-3.5 py-2.5 font-medium tracking-tight border-b border-border/60"
                  >
                    {inline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri} className="odd:bg-background even:bg-muted/20">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3.5 py-2.5 border-b border-border/40 align-top">
                      {inline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'hr':
      return <hr className="border-border/50 my-8" />
    default:
      return null
  }
}

function inline(text: string): ReactNode {
  const nodes: ReactNode[] = []
  const re =
    /(!\[([^\]]*)\]\(([^)]+)\))|(\[([^\]]+)\]\(([^)]+)\))|(`([^`]+)`)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)/g
  let last = 0
  let m: RegExpExecArray | null
  let key = 0

  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    if (m[1]) {
      nodes.push(
        // eslint-disable-next-line @next/next/no-img-element
        <img key={key++} src={m[3]} alt={m[2]} className="w-full rounded-xl my-4" />,
      )
    } else if (m[4]) {
      nodes.push(
        <a
          key={key++}
          href={m[6]}
          className="underline underline-offset-2 hover:text-foreground"
          target="_blank"
          rel="noreferrer"
        >
          {m[5]}
        </a>,
      )
    } else if (m[7]) {
      nodes.push(
        <code
          key={key++}
          className="px-1.5 py-0.5 rounded-md bg-muted/60 border border-border/40 text-[0.9em] font-mono"
        >
          {m[8]}
        </code>,
      )
    } else if (m[9]) {
      nodes.push(<strong key={key++}>{m[10]}</strong>)
    } else if (m[11]) {
      nodes.push(<em key={key++}>{m[12]}</em>)
    }
    last = m.index + m[0].length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes.length === 1 ? nodes[0] : nodes
}
