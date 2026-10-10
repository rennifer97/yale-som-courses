import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react'
import { AuthError, clearChats, fetchChats, sendChat } from '../api'
import { Cat, CAT_INFO, type CatName } from './Characters'
import CityBackdrop from './CityBackdrop'

interface Message {
  role: 'user' | 'bot'
  text: string
  tools?: string[]
  error?: boolean
  cat?: CatName
}

const SUGGESTIONS = [
  'Who teaches MGT 409?',
  'How many core courses are there?',
  'What are some good AI courses?',
]

const TOOL_LABEL: Record<string, string> = {
  search_courses: 'Searched courses',
  web_search: 'Searched the web',
}

// Tiny markdown: **bold**, [links](url), bullet lines. Built as React nodes (no innerHTML).
function inline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g)
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>
    const link = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (link && /^https?:\/\//.test(link[2]))
      return <a key={i} href={link[2]} target="_blank" rel="noreferrer">{link[1]}</a>
    return p
  })
}

function Markdown({ text }: { text: string }) {
  const blocks: ReactNode[] = []
  let bullets: string[] = []
  const flush = () => {
    if (bullets.length) blocks.push(<ul key={blocks.length}>{bullets.map((b, i) => <li key={i}>{inline(b)}</li>)}</ul>)
    bullets = []
  }
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    const bullet = line.match(/^(?:[-*•]|\d+\.)\s+(.*)/)
    if (bullet) { bullets.push(bullet[1]); continue }
    flush()
    if (!line) continue
    const heading = line.match(/^#{1,4}\s+(.*)/)
    blocks.push(heading
      ? <p key={blocks.length} className="md-h">{inline(heading[1])}</p>
      : <p key={blocks.length}>{inline(line)}</p>)
  }
  flush()
  return <>{blocks}</>
}

// Luna answers first, then Artemis, then Luna again…
const catFor = (botIndex: number): CatName => (botIndex % 2 ? 'artemis' : 'luna')

export default function ChatPanel({ onAuthError }: { onAuthError: () => void }) {
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const bottom = useRef<HTMLDivElement>(null)
  const nextCat = catFor(messages.filter((m) => m.role === 'bot').length)

  // Load this person's saved conversation from the database.
  useEffect(() => {
    let bots = 0
    fetchChats()
      .then((saved) => setMessages(saved.map((m) => m.role === 'user'
        ? { role: 'user', text: m.text }
        : { role: 'bot', text: m.text, tools: m.tools_used, cat: catFor(bots++) })))
      .catch((e) => { if (e instanceof AuthError) onAuthError() })
      .finally(() => setLoaded(true))
  }, [onAuthError])

  async function startOver() {
    if (busy || !window.confirm('Clear your saved chat with Luna & Artemis?')) return
    try {
      await clearChats()
      setMessages([])
    } catch (e) {
      if (e instanceof AuthError) onAuthError()
    }
  }

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  async function ask(text: string) {
    const q = text.trim()
    if (!q || busy) return
    setMessages((m) => [...m, { role: 'user', text: q }])
    setDraft('')
    setBusy(true)
    try {
      const r = await sendChat(q)
      setMessages((m) => [...m, { role: 'bot', text: r.reply, tools: r.tools_used, cat: nextCat }])
    } catch (e) {
      if (e instanceof AuthError) return onAuthError()
      const text = e instanceof TypeError ? 'Could not reach the backend. Is it running?' : String((e as Error).message)
      setMessages((m) => [...m, { role: 'bot', text, error: true, cat: nextCat }])
    } finally {
      setBusy(false)
    }
  }

  const submit = (e: FormEvent) => { e.preventDefault(); ask(draft) }

  if (!open) {
    return (
      <button className="chat-fab" onClick={() => setOpen(true)}>
        <Cat who="luna" size={30} /> Ask Luna &amp; Artemis
      </button>
    )
  }

  return (
    <aside className="chat">
      <header className="chat-head">
        <CityBackdrop compact />
        <div className="chat-title">
          <span className="head-cats"><Cat who="luna" size={36} /><Cat who="artemis" size={36} /></span>
          <div>
            <strong>Luna &amp; Artemis</strong>
            <span>Your Fall 2026 course guides</span>
          </div>
        </div>
        <div className="chat-actions">
          {messages.length > 0 && (
            <button className="text-btn" onClick={startOver} title="Clear saved chat">Start over</button>
          )}
          <button className="close light" onClick={() => setOpen(false)} aria-label="Close chat">×</button>
        </div>
      </header>

      <div className="chat-body">
        {loaded && messages.length === 0 && (
          <div className="chat-empty">
            <p>Luna and Artemis know every course this fall. Ask about faculty, times, or what to take.</p>
            {SUGGESTIONS.map((s) => (
              <button key={s} className="suggestion" onClick={() => ask(s)}>{s}</button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}${m.error ? ' error' : ''}`}>
            {m.role === 'bot' && m.cat && (
              <div className="speaker"><Cat who={m.cat} size={26} /> {CAT_INFO[m.cat].name}</div>
            )}
            <div className="bubble">{m.role === 'bot' ? <Markdown text={m.text} /> : m.text}</div>
            {m.role === 'bot' && !m.error && (
              <div className="tools">
                {m.tools && m.tools.length
                  ? m.tools.map((t) => <span key={t} className="tool">{TOOL_LABEL[t] ?? t}</span>)
                  : <span className="tool none">No tools used</span>}
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div className="msg bot">
            <div className="speaker"><Cat who={nextCat} size={26} /> {CAT_INFO[nextCat].name}</div>
            <div className="bubble thinking"><span className="spinner" /> {CAT_INFO[nextCat].name} is thinking…</div>
          </div>
        )}
        <div ref={bottom} />
      </div>

      <form className="chat-form" onSubmit={submit}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask Luna & Artemis…"
          disabled={busy}
          autoFocus
        />
        <button type="submit" disabled={busy || !draft.trim()}>Send</button>
      </form>
    </aside>
  )
}
