'use client'

import {useChat} from '@ai-sdk/react'
import {DefaultChatTransport, type UIMessage} from 'ai'
import {useEffect, useMemo, useRef, useState} from 'react'

interface Props {
  widgetKey: string
  businessName: string
  botName: string
  greeting: string
  accent: string
  ready: boolean
}

function getSessionId(key: string) {
  if (typeof window === 'undefined') return ''
  const k = `rez:session:${key}`
  try {
    let v = window.localStorage.getItem(k)
    if (!v) {
      v = crypto.randomUUID()
      window.localStorage.setItem(k, v)
    }
    return v
  } catch {
    return crypto.randomUUID()
  }
}

function toolLabel(type: string) {
  if (type.includes('escalate')) return 'Sending to the team'
  if (type.includes('initial_context')) return 'Checking what I know'
  if (type.includes('search')) return 'Searching the knowledge base'
  if (type.includes('read')) return 'Reading the answer'
  return 'Working'
}

function renderText(text: string) {
  // Minimal Markdown: bold, lists, line breaks, and a muted Source line.
  const lines = text.split('\n')
  return lines.map((line, i) => {
    const isSource = /^\s*\*{0,2}source:?\*{0,2}/i.test(line)
    const html = line
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[(.+?)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    const isList = /^\s*([-*]|\d+\.)\s+/.test(line)
    return (
      <div
        key={i}
        className={isSource ? 'rez-source' : isList ? 'rez-li' : undefined}
        style={{minHeight: line.trim() ? undefined : 8}}
        dangerouslySetInnerHTML={{__html: html}}
      />
    )
  })
}

export function ChatWidget({widgetKey, businessName, botName, greeting, accent, ready}: Props) {
  const sessionId = useMemo(() => getSessionId(widgetKey), [widgetKey])
  const transport = useMemo(
    () => new DefaultChatTransport({api: '/api/chat', body: {key: widgetKey, sessionId}}),
    [widgetKey, sessionId],
  )
  const {messages, sendMessage, status, error} = useChat({transport})
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const busy = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({behavior: 'smooth'})
  }, [messages, status])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    sendMessage({text})
  }

  const close = () => window.parent?.postMessage({type: 'rez:close'}, '*')

  return (
    <div className="rez-root" style={{['--accent' as string]: accent}}>
      <style>{`
        *{box-sizing:border-box} html,body{margin:0;height:100%;background:#fff}
        .rez-root{display:flex;flex-direction:column;height:100vh;font:14px/1.45 var(--font-body),system-ui,sans-serif;color:#111}
        .rez-head{display:flex;align-items:center;gap:10px;padding:14px 16px;background:var(--accent);color:#fff}
        .rez-avatar{width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;font-weight:700}
        .rez-head h1{font-size:15px;margin:0;font-weight:600} .rez-head p{margin:0;font-size:12px;opacity:.85}
        .rez-x{margin-left:auto;background:none;border:0;color:#fff;font-size:20px;cursor:pointer;line-height:1}
        .rez-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:#f7f8fa}
        .rez-bubble{max-width:85%;padding:10px 12px;border-radius:14px;white-space:normal;word-break:break-word}
        .rez-bot{align-self:flex-start;background:#fff;border:1px solid #e5e7eb;border-bottom-left-radius:4px}
        .rez-user{align-self:flex-end;background:var(--accent);color:#fff;border-bottom-right-radius:4px}
        .rez-li{padding-left:8px} .rez-source{font-size:12px;color:#6b7280;margin-top:6px}
        .rez-tool{font-size:12px;color:#6b7280;align-self:flex-start;padding:2px 4px;display:flex;gap:6px;align-items:center}
        .rez-dot{width:6px;height:6px;border-radius:50%;background:var(--accent);animation:rez-pulse 1s infinite}
        @keyframes rez-pulse{0%,100%{opacity:.3}50%{opacity:1}}
        .rez-form{display:flex;gap:8px;padding:12px;border-top:1px solid #e5e7eb;background:#fff}
        .rez-form input{flex:1;border:1px solid #d1d5db;border-radius:10px;padding:10px 12px;font:inherit;outline:none}
        .rez-form input:focus{border-color:var(--accent)}
        .rez-form button{background:var(--accent);color:#fff;border:0;border-radius:10px;padding:0 14px;font:inherit;font-weight:600;cursor:pointer}
        .rez-form button:disabled{opacity:.5;cursor:default}
        .rez-foot{font-size:11px;color:#9ca3af;text-align:center;padding:0 0 8px;background:#fff}
        .rez-bubble a{color:inherit;text-decoration:underline}
        @keyframes rez-in{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}
        .rez-bubble,.rez-tool{animation:rez-in .35s cubic-bezier(.2,.8,.2,1) both}
        .rez-user{transform-origin:bottom right}.rez-bot{transform-origin:bottom left}
        .rez-form button{transition:transform .15s,opacity .2s}.rez-form button:active:not(:disabled){transform:scale(.94)}
        .rez-form input{transition:border-color .2s,box-shadow .2s}.rez-form input:focus{box-shadow:0 0 0 3px rgba(0,0,0,.06)}
        .rez-x{transition:transform .2s}.rez-x:hover{transform:rotate(90deg)}
        @media (prefers-reduced-motion:reduce){.rez-bubble,.rez-tool{animation:none}}
      `}</style>
      <div className="rez-head">
        <div className="rez-avatar">{botName.slice(0, 1).toUpperCase()}</div>
        <div>
          <h1>{botName}</h1>
          <p>{businessName} support</p>
        </div>
        <button className="rez-x" onClick={close} aria-label="Close chat">×</button>
      </div>
      <div className="rez-msgs">
        <div className="rez-bubble rez-bot">{ready ? greeting : 'This assistant is still learning about the business. Please check back in a few minutes.'}</div>
        {messages.map((m: UIMessage) => (
          <MessageView key={m.id} message={m} />
        ))}
        {busy && messages[messages.length - 1]?.role === 'user' && (
          <div className="rez-tool"><span className="rez-dot" /> Thinking</div>
        )}
        {error && <div className="rez-bubble rez-bot" style={{color: '#b91c1c'}}>Something went wrong. Please try again.</div>}
        <div ref={bottomRef} />
      </div>
      <form className="rez-form" onSubmit={submit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={ready ? 'Ask a question…' : 'Not ready yet'}
          disabled={!ready}
          autoFocus
        />
        <button type="submit" disabled={!ready || busy || !input.trim()}>Send</button>
      </form>
      <div className="rez-foot">Powered by REZ · answers come from {businessName}&apos;s knowledge base</div>
    </div>
  )
}

function MessageView({message}: {message: UIMessage}) {
  const isUser = message.role === 'user'
  const parts = message.parts || []
  const textParts = parts.filter((p) => p.type === 'text') as {type: 'text'; text: string}[]
  const toolParts = parts.filter((p) => p.type.startsWith('tool-') || p.type === 'dynamic-tool') as {type: string; state?: string; toolName?: string}[]
  const text = textParts.map((p) => p.text).join('')
  return (
    <>
      {!isUser &&
        toolParts.map((p, i) => (
          <div key={i} className="rez-tool">
            {p.state && !p.state.startsWith('output') && <span className="rez-dot" />}
            {toolLabel(p.toolName || p.type)}
          </div>
        ))}
      {text && <div className={`rez-bubble ${isUser ? 'rez-user' : 'rez-bot'}`}>{isUser ? text : renderText(text)}</div>}
    </>
  )
}
