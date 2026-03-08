import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

const STARS = Array.from({ length: 90 }, () => ({
  x: Math.random() * 100, y: Math.random() * 100,
  s: Math.random() * 2.2 + 0.3,
  d: Math.random() * 6, dur: Math.random() * 3 + 2,
  opacity: Math.random() * 0.5 + 0.15,
}))

// Daisy's rotating self-descriptions
const DAISY_LINES = [
  "I remember what you told me last Tuesday.",
  "I noticed you've been carrying a lot lately.",
  "I wrote you a letter. Want to read it?",
  "You have 12 new stars in your constellation.",
  "I've been thinking about what you shared.",
  "I won't forget. That's kind of my thing.",
]

export default function Landing() {
  const nav = useNavigate()
  const [lineIdx, setLineIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setLineIdx(i => (i + 1) % DAISY_LINES.length)
        setVisible(true)
      }, 400)
    }, 3200)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 25% 15%, #0e2040 0%, #060d1a 60%)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* Stars */}
      {STARS.map((st, i) => (
        <div key={i} style={{ position: 'absolute', left: `${st.x}%`, top: `${st.y}%`, width: st.s, height: st.s, borderRadius: '50%', background: '#fff', opacity: st.opacity, animation: `twinkle ${st.dur}s ease-in-out ${st.d}s infinite`, pointerEvents: 'none' }} />
      ))}

      {/* Soft glow orbs */}
      <div style={{ position: 'absolute', top: '10%', left: '10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '5%', right: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(100,140,200,0.05) 0%, transparent 65%)', pointerEvents: 'none' }} />

      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 36px', position: 'relative', zIndex: 10 }}>
        <div style={{ fontSize: 22 }}>🌼</div>
        <button onClick={() => nav('/auth')}
          style={{ padding: '10px 28px', background: 'transparent', border: '1px solid rgba(201,168,76,0.45)', borderRadius: 8, color: '#C9A84C', fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.1)'; e.currentTarget.style.borderColor = '#C9A84C' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.45)' }}>
          Sign In →
        </button>
      </nav>

      {/* Hero */}
      <section style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '32px 24px 24px', position: 'relative', zIndex: 10 }}>

        {/* Daisy avatar with glow */}
        <div style={{ position: 'relative', marginBottom: 28 }}>
          <div style={{ position: 'absolute', inset: -20, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,0.18) 0%, transparent 70%)', animation: 'pulse 3s ease infinite' }} />
          <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(201,168,76,0.18), rgba(201,168,76,0.06))', border: '1px solid rgba(201,168,76,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, position: 'relative', boxShadow: '0 0 40px rgba(201,168,76,0.15)' }}>
            🌼
          </div>
        </div>

        {/* Big name */}
        <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 'clamp(30px, 5.5vw, 64px)', fontWeight: 700, lineHeight: 1.18, color: '#eae0cc', marginBottom: 20, maxWidth: 700 }}>
          Your inner world,<br />
          <span style={{ color: '#C9A84C' }}>woven into light</span>
        </h1>

        <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', fontWeight: 400, color: '#8a7f72', maxWidth: 500, lineHeight: 1.75, marginBottom: 36 }}>
          Daisy remembers every conversation, grows with you, and maps your emotional universe as a <strong style={{ color: '#b0a090', fontWeight: 600 }}>living constellation</strong> — uniquely yours.
        </p>

        {/* Animated speech bubble */}
        <div style={{ position: 'relative', marginBottom: 44, minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.2)',
            borderRadius: 14, padding: '14px 24px', maxWidth: 420,
            fontSize: 'clamp(14px, 2vw, 16px)', fontWeight: 400, color: '#b0a090',
            lineHeight: 1.6, fontStyle: 'italic',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(4px)',
            transition: 'opacity 0.35s ease, transform 0.35s ease',
          }}>
            " {DAISY_LINES[lineIdx]} "
          </div>
        </div>

        {/* CTA */}
        <button onClick={() => nav('/auth')}
          style={{ padding: '17px 60px', background: 'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.08))', border: '1px solid rgba(201,168,76,0.55)', borderRadius: 10, color: '#C9A84C', fontSize: 16, fontWeight: 700, cursor: 'pointer', transition: 'all 0.25s', letterSpacing: '0.06em', marginBottom: 16 }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.24)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(201,168,76,0.22)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.08))'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}>
          Meet Daisy →
        </button>

        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#4a4540', letterSpacing: '0.12em' }}>
          free · private · no ads
        </div>
      </section>

      {/* Feature strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, padding: '0 28px 56px', maxWidth: 960, margin: '0 auto', width: '100%', position: 'relative', zIndex: 10 }}>
        {[
          { icon: '🧠', title: 'She Remembers', text: 'Every conversation. Every detail. She builds a picture of you that grows.' },
          { icon: '✦', title: 'Your Constellation', text: 'Your memories become stars — a living map of your emotional world.' },
          { icon: '✉', title: 'She Writes to You', text: 'Personal letters drawn from everything she knows about you.' },
          { icon: '📓', title: 'Your Diary', text: 'Every chat becomes a diary entry. Your story, written by you both.' },
        ].map((f, i) => (
          <div key={i}
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '22px 18px', transition: 'all 0.2s', cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.22)'; e.currentTarget.style.background = 'rgba(201,168,76,0.04)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.transform = 'none' }}>
            <div style={{ fontSize: 26, marginBottom: 12 }}>{f.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#C9A84C', marginBottom: 8, letterSpacing: '0.04em' }}>{f.title}</div>
            <div style={{ fontSize: 14, fontWeight: 400, color: '#6a6258', lineHeight: 1.7 }}>{f.text}</div>
          </div>
        ))}
      </div>

    </div>
  )
}
