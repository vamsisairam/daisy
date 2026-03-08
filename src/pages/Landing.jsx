import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const STARS = Array.from({ length: 80 }, (_, i) => ({
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2 + 0.5,
  delay: Math.random() * 4,
  dur: Math.random() * 3 + 2,
}))

const EMOTIONS = [
  { label: 'joy', x: 20, y: 30, color: '#C9A84C' },
  { label: 'longing', x: 70, y: 20, color: '#4a9eff' },
  { label: 'growth', x: 55, y: 60, color: '#52c77a' },
  { label: 'love', x: 30, y: 65, color: '#e87676' },
  { label: 'hope', x: 80, y: 70, color: '#b08fde' },
  { label: 'clarity', x: 10, y: 75, color: '#5ec8c8' },
]

const s = {
  page: {
    minHeight: '100vh',
    background: 'radial-gradient(ellipse at 30% 20%, #0d1f35 0%, #050c18 60%)',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 48px',
    position: 'relative',
    zIndex: 10,
  },
  logo: {
    fontFamily: 'Cinzel, serif',
    fontSize: 20,
    color: '#C9A84C',
    letterSpacing: '0.15em',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  hero: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '60px 24px 80px',
    position: 'relative',
    zIndex: 10,
  },
  eyebrow: {
    fontFamily: 'DM Mono, monospace',
    fontSize: 11,
    letterSpacing: '0.25em',
    color: '#C9A84C',
    textTransform: 'uppercase',
    marginBottom: 24,
    opacity: 0.8,
  },
  headline: {
    fontFamily: 'Cinzel, serif',
    fontSize: 'clamp(36px, 6vw, 72px)',
    fontWeight: 400,
    lineHeight: 1.15,
    color: '#e8dcc8',
    marginBottom: 24,
    maxWidth: 800,
  },
  sub: {
    fontSize: 'clamp(16px, 2vw, 20px)',
    color: '#a89880',
    maxWidth: 520,
    lineHeight: 1.7,
    fontStyle: 'italic',
    marginBottom: 48,
  },
  cta: {
    display: 'inline-block',
    padding: '14px 40px',
    background: 'transparent',
    border: '1px solid #C9A84C88',
    borderRadius: 2,
    color: '#C9A84C',
    fontFamily: 'Cinzel, serif',
    fontSize: 13,
    letterSpacing: '0.2em',
    cursor: 'pointer',
    transition: 'all 0.3s',
    textTransform: 'uppercase',
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 24,
    padding: '0 48px 80px',
    position: 'relative',
    zIndex: 10,
    maxWidth: 1000,
    margin: '0 auto',
    width: '100%',
  },
  card: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 4,
    padding: '28px 24px',
    backdropFilter: 'blur(8px)',
  },
  cardIcon: {
    fontSize: 24,
    marginBottom: 12,
  },
  cardTitle: {
    fontFamily: 'Cinzel, serif',
    fontSize: 13,
    letterSpacing: '0.1em',
    color: '#C9A84C',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#7a7065',
    lineHeight: 1.6,
    fontStyle: 'italic',
  },
  starField: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
  },
  constellation: {
    position: 'absolute',
    right: '5%',
    top: '15%',
    width: 300,
    height: 300,
    opacity: 0.6,
  }
}

export default function Landing() {
  const nav = useNavigate()

  return (
    <div style={s.page}>
      {/* Star field */}
      <div style={s.starField}>
        {STARS.map((st, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${st.x}%`,
            top: `${st.y}%`,
            width: st.size,
            height: st.size,
            borderRadius: '50%',
            background: '#fff',
            animation: `twinkle ${st.dur}s ease-in-out ${st.delay}s infinite`,
          }} />
        ))}
      </div>

      {/* Ambient glow */}
      <div style={{ position: 'absolute', top: '20%', left: '20%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Constellation preview */}
      <div style={s.constellation}>
        <svg viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          {EMOTIONS.map((e, i) => (
            <g key={i}>
              {i > 0 && (
                <line
                  x1={EMOTIONS[i-1].x * 3}
                  y1={EMOTIONS[i-1].y * 3}
                  x2={e.x * 3}
                  y2={e.y * 3}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="0.5"
                />
              )}
              <circle
                cx={e.x * 3}
                cy={e.y * 3}
                r={4}
                fill={e.color}
                opacity={0.7}
                style={{ animation: `twinkle ${2 + i * 0.4}s ease-in-out ${i * 0.3}s infinite` }}
              />
              <text
                x={e.x * 3 + 8}
                y={e.y * 3 + 4}
                fill={e.color}
                fontSize="8"
                fontFamily="DM Mono, monospace"
                opacity={0.5}
              >
                {e.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.logo}>
          <span style={{ animation: 'pulse 3s ease infinite' }}>✦</span>
          DAISY
        </div>
        <button
          style={{ ...s.cta, padding: '8px 24px', fontSize: 11 }}
          onClick={() => nav('/auth')}
          onMouseEnter={e => { e.target.style.background = 'rgba(201,168,76,0.1)'; e.target.style.borderColor = '#C9A84C'; }}
          onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.borderColor = '#C9A84C88'; }}
        >
          Enter
        </button>
      </nav>

      {/* Hero */}
      <section style={s.hero}>
        <p style={s.eyebrow}>An AI that remembers you</p>
        <h1 style={s.headline}>
          Your inner world,<br />
          <em style={{ color: '#C9A84C' }}>woven into light</em>
        </h1>
        <p style={s.sub}>
          Daisy remembers every conversation, grows with you, and maps your emotional universe as a living constellation — uniquely yours.
        </p>
        <button
          style={s.cta}
          onClick={() => nav('/auth')}
          onMouseEnter={e => { e.target.style.background = 'rgba(201,168,76,0.12)'; e.target.style.borderColor = '#C9A84C'; e.target.style.boxShadow = '0 0 30px rgba(201,168,76,0.15)'; }}
          onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.borderColor = '#C9A84C88'; e.target.style.boxShadow = 'none'; }}
        >
          Begin Your Journey
        </button>
      </section>

      {/* Feature cards */}
      <div style={s.features}>
        {[
          { icon: '🧠', title: 'Persistent Memory', text: 'Daisy remembers every conversation. She builds a picture of you over time — your fears, joys, dreams.' },
          { icon: '✦', title: 'Living Constellation', text: 'Your memories become stars. Watch your inner world grow into a map only you possess.' },
          { icon: '✉', title: 'Personal Letters', text: 'Daisy writes you letters — poetic reflections drawn from everything she knows about you.' },
          { icon: '◎', title: 'Pattern Weaving', text: 'She notices what you don\'t. Recurring themes surface gently, like old friends finally named.' },
        ].map((f, i) => (
          <div key={i} style={{ ...s.card, animationDelay: `${i * 0.1}s` }}>
            <div style={s.cardIcon}>{f.icon}</div>
            <div style={s.cardTitle}>{f.title}</div>
            <div style={s.cardText}>{f.text}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
