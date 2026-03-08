import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

// ─── Emotion colors ───────────────────────────────────────────
const EMOTION_COLOR = {
  happy: '#C9A84C', grateful: '#52c77a', excited: '#e87676',
  neutral: '#8899aa', reflective: '#9b7fde', sad: '#4a9eff',
  anxious: '#ff8c42', hopeful: '#5ec8c8', melancholy: '#7890c0',
}

// ─── API helper ───────────────────────────────────────────────
async function callDaisy({ messages, memories, mode, userName }) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, memories, mode: mode || 'chat', userName }),
  })
  const data = await res.json()
  return data?.content?.map(b => b.text || '').join('') || ''
}

// ─── Constellation Canvas ─────────────────────────────────────
function ConstellationView({ memories }) {
  const canvasRef = useRef(null)
  const hoveredRef = useRef(null)
  const [tooltip, setTooltip] = useState(null)
  const starsRef = useRef([])
  const rafRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width = canvas.offsetWidth
    const H = canvas.height = canvas.offsetHeight

    // Seed positions from memory id
    const stars = memories.map((m, i) => {
      const seed = i * 137.5
      const angle = (seed % 360) * Math.PI / 180
      const radius = 80 + (i * 47) % (Math.min(W, H) * 0.35)
      return {
        x: W / 2 + Math.cos(angle) * radius * (0.6 + (i % 3) * 0.2),
        y: H / 2 + Math.sin(angle) * radius * (0.6 + (i % 3) * 0.2),
        r: 2 + (i % 3),
        color: EMOTION_COLOR[m.emotion] || '#8899aa',
        phase: Math.random() * Math.PI * 2,
        memory: m,
      }
    })
    starsRef.current = stars

    // Background stars
    const bgStars = Array.from({ length: 120 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.2,
      phase: Math.random() * Math.PI * 2,
    }))

    let t = 0
    const draw = () => {
      ctx.clearRect(0, 0, W, H)

      // Background stars
      bgStars.forEach(s => {
        const alpha = 0.2 + 0.15 * Math.sin(t * 0.3 + s.phase)
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${alpha})`
        ctx.fill()
      })

      // Connection lines between nearby memory stars
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const dx = stars[i].x - stars[j].x
          const dy = stars[i].y - stars[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 130) {
            ctx.beginPath()
            ctx.moveTo(stars[i].x, stars[i].y)
            ctx.lineTo(stars[j].x, stars[j].y)
            ctx.strokeStyle = `rgba(255,255,255,${0.05 * (1 - dist / 130)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      // Memory stars
      stars.forEach((s, i) => {
        const pulse = 1 + 0.3 * Math.sin(t * 0.8 + s.phase)
        const isHovered = hoveredRef.current === i
        const r = isHovered ? s.r * 2.5 : s.r * pulse

        // Glow
        const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 4)
        grd.addColorStop(0, s.color + '44')
        grd.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(s.x, s.y, r * 4, 0, Math.PI * 2)
        ctx.fillStyle = grd
        ctx.fill()

        // Star
        ctx.beginPath()
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2)
        ctx.fillStyle = isHovered ? s.color : s.color + 'cc'
        ctx.fill()

        if (isHovered) {
          ctx.beginPath()
          ctx.arc(s.x, s.y, r + 3, 0, Math.PI * 2)
          ctx.strokeStyle = s.color + '88'
          ctx.lineWidth = 1
          ctx.stroke()
        }
      })

      t += 0.025
      rafRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [memories])

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    let found = null
    starsRef.current.forEach((s, i) => {
      const d = Math.sqrt((mx - s.x) ** 2 + (my - s.y) ** 2)
      if (d < 16) found = i
    })

    hoveredRef.current = found
    if (found !== null) {
      const s = starsRef.current[found]
      setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, memory: s.memory, color: s.color })
    } else {
      setTooltip(null)
    }
  }

  if (memories.length === 0) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#7a7065', textAlign: 'center', padding: 40 }}>
      <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>✦</div>
      <div style={{ fontFamily: 'Cinzel, serif', fontSize: 16, marginBottom: 8, color: '#9a8870' }}>Your constellation awaits</div>
      <div style={{ fontStyle: 'italic', fontSize: 14 }}>Talk with Daisy and watch your stars emerge</div>
    </div>
  )

  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { hoveredRef.current = null; setTooltip(null) }}
        style={{ width: '100%', height: '100%', cursor: tooltip ? 'pointer' : 'crosshair' }}
      />
      {tooltip && (
        <div style={{
          position: 'absolute',
          left: tooltip.x + 14, top: tooltip.y - 20,
          background: 'rgba(5,12,24,0.95)',
          border: `1px solid ${tooltip.color}44`,
          borderRadius: 4,
          padding: '10px 14px',
          maxWidth: 220,
          pointerEvents: 'none',
          backdropFilter: 'blur(12px)',
          zIndex: 10,
          boxShadow: `0 8px 32px rgba(0,0,0,0.5)`,
        }}>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: tooltip.color, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {tooltip.memory.emotion} · {tooltip.memory.theme}
          </div>
          <div style={{ fontSize: 13, color: '#c8b898', fontStyle: 'italic', lineHeight: 1.5 }}>
            {tooltip.memory.content}
          </div>
        </div>
      )}
      <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', pointerEvents: 'none' }}>
        {Object.entries(EMOTION_COLOR).slice(0, 6).map(([emo, col]) => (
          <div key={emo} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#7a7065' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: col }} />
            {emo}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Letter View ──────────────────────────────────────────────
function LetterView({ memories, userName, letters, setLetters }) {
  const [generating, setGenerating] = useState(false)
  const [selected, setSelected] = useState(null)

  const generateLetter = async () => {
    if (memories.length < 3) return
    setGenerating(true)
    try {
      const text = await callDaisy({ messages: [], memories, mode: 'letter', userName })
      const letter = { id: Date.now(), text, date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) }
      const updated = [letter, ...letters]
      setLetters(updated)
      setSelected(letter)
      localStorage.setItem('daisy_letters', JSON.stringify(updated))
    } finally {
      setGenerating(false)
    }
  }

  if (selected) return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '40px 48px', maxWidth: 700, margin: '0 auto', width: '100%' }}>
      <button
        onClick={() => setSelected(null)}
        style={{ background: 'none', border: 'none', color: '#C9A84C', cursor: 'pointer', fontSize: 13, fontFamily: 'DM Mono, monospace', letterSpacing: '0.05em', marginBottom: 32, padding: 0 }}
      >
        ← Back
      </button>
      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#7a7065', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 32 }}>
        Letter from Daisy · {selected.date}
      </div>
      <div style={{ fontSize: 17, lineHeight: 1.9, color: '#c8b898', fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
        {selected.text}
      </div>
    </div>
  )

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '40px 48px', maxWidth: 700, margin: '0 auto', width: '100%' }}>
      <div style={{ fontFamily: 'Cinzel, serif', fontSize: 20, color: '#C9A84C', marginBottom: 8 }}>Letters from Daisy</div>
      <div style={{ color: '#7a7065', fontSize: 14, fontStyle: 'italic', marginBottom: 32 }}>
        {memories.length < 3
          ? `Share ${3 - memories.length} more memories to unlock your first letter`
          : 'Daisy weaves your memories into words meant only for you'}
      </div>

      <button
        onClick={generateLetter}
        disabled={generating || memories.length < 3}
        style={{
          padding: '12px 28px',
          background: 'transparent',
          border: `1px solid ${memories.length >= 3 ? '#C9A84C88' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 3,
          color: memories.length >= 3 ? '#C9A84C' : '#7a7065',
          fontFamily: 'Cinzel, serif',
          fontSize: 12,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          cursor: memories.length >= 3 && !generating ? 'pointer' : 'not-allowed',
          transition: 'all 0.3s',
          marginBottom: 40,
        }}
      >
        {generating ? '✦ Weaving your letter...' : '✦ Write Me a Letter'}
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {letters.map(l => (
          <div
            key={l.id}
            onClick={() => setSelected(l)}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 4,
              padding: '16px 20px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A84C44'; e.currentTarget.style.background = 'rgba(201,168,76,0.04)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
          >
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#7a7065', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
              {l.date}
            </div>
            <div style={{ fontSize: 14, color: '#a89880', fontStyle: 'italic' }}>
              {l.text.slice(0, 100)}…
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Profile View ─────────────────────────────────────────────
function ProfileView({ session, profile, memories, onSignOut }) {
  const joinDate = new Date(session.user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  const themes = [...new Set(memories.map(m => m.theme))]
  const topEmotion = Object.entries(
    memories.reduce((acc, m) => { acc[m.emotion] = (acc[m.emotion] || 0) + 1; return acc }, {})
  ).sort((a, b) => b[1] - a[1])[0]

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '40px 48px', maxWidth: 600, margin: '0 auto', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(201,168,76,0.1)', border: '1px solid #C9A84C44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 16px', animation: 'pulse 3s ease infinite' }}>
          ✦
        </div>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 22, color: '#e8dcc8', marginBottom: 4 }}>
          {profile?.name || 'Wanderer'}
        </div>
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#7a7065', letterSpacing: '0.08em' }}>
          {session.user.email}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 }}>
        {[
          { label: 'Memories Woven', value: memories.length, icon: '✦' },
          { label: 'Member Since', value: joinDate, icon: '◎' },
          { label: 'Themes Explored', value: themes.length, icon: '◈' },
          { label: 'Dominant Feeling', value: topEmotion ? topEmotion[0] : '—', icon: '◉', color: topEmotion ? EMOTION_COLOR[topEmotion[0]] : undefined },
        ].map((stat, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 4, padding: '20px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>{stat.icon}</div>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 18, color: stat.color || '#C9A84C', marginBottom: 4 }}>{stat.value}</div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#7a7065', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {themes.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#7a7065', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Your Themes</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {themes.map(t => (
              <span key={t} style={{ padding: '4px 12px', background: 'rgba(201,168,76,0.06)', border: '1px solid #C9A84C33', borderRadius: 20, fontSize: 12, color: '#C9A84C', fontFamily: 'DM Mono, monospace' }}>{t}</span>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onSignOut}
        style={{ width: '100%', padding: 13, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3, color: '#7a7065', fontFamily: 'Cinzel, serif', fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s' }}
        onMouseEnter={e => { e.target.style.borderColor = 'rgba(232,118,118,0.3)'; e.target.style.color = '#e87676' }}
        onMouseLeave={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.color = '#7a7065' }}
      >
        Leave Sanctum
      </button>
    </div>
  )
}

// ─── Chat View ────────────────────────────────────────────────
function ChatView({ messages, setMessages, memories, setMemories, profile, session }) {
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const userName = profile?.name || 'friend'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  const extractMemories = useCallback(async (msgs) => {
    if (msgs.filter(m => m.role === 'user').length < 2) return
    try {
      const raw = await callDaisy({ messages: msgs, memories, mode: 'extract', userName })
      const cleaned = raw.replace(/```json|```/g, '').trim()
      const extracted = JSON.parse(cleaned)
      if (Array.isArray(extracted)) {
        const newMems = extracted.filter(e => e.content)
        const { data } = await supabase.from('memories').insert(
          newMems.map(m => ({ ...m, user_id: session.user.id }))
        ).select()
        if (data) setMemories(prev => [...prev, ...data])
      }
    } catch (e) {
      console.log('Memory extract skipped:', e.message)
    }
  }, [memories, session.user.id, userName])

  const send = async () => {
    const text = input.trim()
    if (!text || thinking) return
    setInput('')
    const updated = [...messages, { role: 'user', content: text }]
    setMessages(updated)
    setThinking(true)
    try {
      const reply = await callDaisy({ messages: updated, memories, mode: 'chat', userName })
      const withReply = [...updated, { role: 'assistant', content: reply }]
      setMessages(withReply)
      if (updated.filter(m => m.role === 'user').length % 3 === 0) {
        extractMemories(withReply)
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something flickered in the ether. Try again?' }])
    } finally {
      setThinking(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: 16,
            animation: 'fadeUp 0.35s ease both',
          }}>
            {m.role === 'assistant' && (
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(201,168,76,0.12)', border: '1px solid #C9A84C44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#C9A84C', marginRight: 10, flexShrink: 0, marginTop: 4 }}>
                ✦
              </div>
            )}
            <div style={{
              maxWidth: '68%',
              padding: '12px 18px',
              borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: m.role === 'user'
                ? 'rgba(201,168,76,0.08)'
                : 'rgba(255,255,255,0.04)',
              border: `1px solid ${m.role === 'user' ? '#C9A84C22' : 'rgba(255,255,255,0.07)'}`,
              fontSize: 15,
              lineHeight: 1.7,
              color: '#d4c4a8',
              fontStyle: m.role === 'assistant' ? 'italic' : 'normal',
            }}>
              {m.content}
            </div>
          </div>
        ))}

        {thinking && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, animation: 'fadeIn 0.3s ease both' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(201,168,76,0.12)', border: '1px solid #C9A84C44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#C9A84C' }}>✦</div>
            <div style={{ display: 'flex', gap: 5, padding: '10px 16px', borderRadius: '16px 16px 16px 4px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {[0, 0.3, 0.6].map((d, i) => (
                <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#C9A84C', opacity: 0.6, animation: `twinkle 1s ease ${d}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 12, alignItems: 'flex-end', background: 'rgba(0,0,0,0.15)' }}>
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          placeholder={`Tell Daisy what's on your mind, ${userName}…`}
          onChange={e => {
            setInput(e.target.value)
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'
          }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          style={{
            flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, padding: '12px 16px', color: '#e8dcc8', fontSize: 15,
            resize: 'none', minHeight: 46, transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = '#C9A84C66'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
        <button
          onClick={send}
          disabled={!input.trim() || thinking}
          style={{
            width: 44, height: 44, borderRadius: '50%', border: 'none', flexShrink: 0,
            background: input.trim() && !thinking ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${input.trim() && !thinking ? '#C9A84C66' : 'rgba(255,255,255,0.06)'}`,
            color: input.trim() && !thinking ? '#C9A84C' : '#7a7065',
            cursor: input.trim() && !thinking ? 'pointer' : 'not-allowed',
            fontSize: 16, transition: 'all 0.2s',
          }}
        >
          ↑
        </button>
      </div>
    </div>
  )
}

// ─── Main Sanctum ─────────────────────────────────────────────
const NAV = [
  { id: 'chat', icon: '◎', label: 'Converse' },
  { id: 'constellation', icon: '✦', label: 'Constellation' },
  { id: 'letters', icon: '✉', label: 'Letters' },
  { id: 'profile', icon: '◉', label: 'Profile' },
]

export default function Sanctum({ session }) {
  const [view, setView] = useState('chat')
  const [profile, setProfile] = useState(null)
  const [memories, setMemories] = useState([])
  const [messages, setMessages] = useState([])
  const [letters, setLetters] = useState([])
  const nav = useNavigate()

  useEffect(() => {
    // Load profile
    supabase.from('profiles').select('*').eq('id', session.user.id).single()
      .then(({ data }) => {
        if (data) setProfile(data)
        else supabase.from('profiles').insert({ id: session.user.id, name: 'Wanderer' })
      })

    // Load memories
    supabase.from('memories').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setMemories(data) })

    // Load letters from localStorage
    try {
      const saved = localStorage.getItem('daisy_letters')
      if (saved) setLetters(JSON.parse(saved))
    } catch {}
  }, [session.user.id])

  // Set initial greeting from Daisy
  useEffect(() => {
    const name = profile?.name || 'friend'
    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
    const hasMemories = memories.length > 0
    const memoryNote = hasMemories ? ` I've been holding ${memories.length} of your stars.` : ' Your constellation is waiting to be born.'

    setMessages([{
      role: 'assistant',
      content: `${greeting}, ${name}.${memoryNote} What's stirring in you today?`
    }])
  }, [profile, memories.length > 0])

  const signOut = async () => {
    await supabase.auth.signOut()
    nav('/')
  }

  return (
    <div style={{ height: '100vh', display: 'flex', background: 'radial-gradient(ellipse at 20% 10%, #0d1f35 0%, #050c18 60%)' }}>

      {/* Sidebar */}
      <div style={{
        width: 64,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 24,
        paddingBottom: 24,
        borderRight: '1px solid rgba(255,255,255,0.06)',
        gap: 8,
        background: 'rgba(0,0,0,0.2)',
        flexShrink: 0,
      }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 16, color: '#C9A84C', marginBottom: 16, animation: 'pulse 3s ease infinite' }}>✦</div>
        {NAV.map(n => (
          <button
            key={n.id}
            onClick={() => setView(n.id)}
            title={n.label}
            style={{
              width: 40, height: 40, borderRadius: 8, border: 'none',
              background: view === n.id ? 'rgba(201,168,76,0.12)' : 'transparent',
              color: view === n.id ? '#C9A84C' : '#7a7065',
              cursor: 'pointer', fontSize: 16, transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}
            onMouseEnter={e => { if (view !== n.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#a89880' }}
            onMouseLeave={e => { if (view !== n.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#7a7065' } }}
          >
            {n.icon}
            {view === n.id && <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 2, height: 16, background: '#C9A84C', borderRadius: 1 }} />}
          </button>
        ))}
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <div style={{
          height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.1)',
        }}>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 13, color: '#C9A84C', letterSpacing: '0.1em' }}>
            {NAV.find(n => n.id === view)?.label || 'Daisy'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {memories.length > 0 && (
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#7a7065', letterSpacing: '0.06em' }}>
                {memories.length} stars in your sky
              </div>
            )}
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#5a5045' }}>
              {profile?.name || session.user.email?.split('@')[0]}
            </div>
          </div>
        </div>

        {/* View */}
        {view === 'chat' && (
          <ChatView messages={messages} setMessages={setMessages} memories={memories} setMemories={setMemories} profile={profile} session={session} />
        )}
        {view === 'constellation' && (
          <ConstellationView memories={memories} />
        )}
        {view === 'letters' && (
          <LetterView memories={memories} userName={profile?.name || 'friend'} letters={letters} setLetters={setLetters} />
        )}
        {view === 'profile' && (
          <ProfileView session={session} profile={profile} memories={memories} onSignOut={signOut} />
        )}
      </div>
    </div>
  )
}
