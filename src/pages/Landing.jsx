import { useNavigate } from 'react-router-dom'

const STARS = Array.from({ length: 80 }, (_, i) => ({
  x: Math.random() * 100, y: Math.random() * 100,
  size: Math.random() * 2 + 0.5,
  delay: Math.random() * 4, dur: Math.random() * 3 + 2,
}))

const EMOTIONS = [
  { label: 'joy', x: 20, y: 30, color: '#C9A84C' },
  { label: 'longing', x: 70, y: 20, color: '#4a9eff' },
  { label: 'growth', x: 55, y: 60, color: '#52c77a' },
  { label: 'love', x: 30, y: 65, color: '#e87676' },
  { label: 'hope', x: 80, y: 70, color: '#b08fde' },
  { label: 'clarity', x: 10, y: 75, color: '#5ec8c8' },
]

export default function Landing() {
  const nav = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 30% 20%, #0d1f35 0%, #050c18 60%)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* Stars */}
      {STARS.map((st, i) => (
        <div key={i} style={{ position: 'absolute', left: `${st.x}%`, top: `${st.y}%`, width: st.size, height: st.size, borderRadius: '50%', background: '#fff', animation: `twinkle ${st.dur}s ease-in-out ${st.delay}s infinite`, pointerEvents: 'none' }} />
      ))}

      {/* Ambient glow */}
      <div style={{ position: 'absolute', top: '20%', left: '20%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Constellation preview — hidden on mobile */}
      <div style={{ position: 'absolute', right: '5%', top: '15%', width: 280, height: 280, opacity: 0.55, display: 'none' }} className="constellation-preview">
        <svg viewBox="0 0 300 300" fill="none">
          {EMOTIONS.map((e, i) => (
            <g key={i}>
              {i > 0 && <line x1={EMOTIONS[i-1].x*3} y1={EMOTIONS[i-1].y*3} x2={e.x*3} y2={e.y*3} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5"/>}
              <circle cx={e.x*3} cy={e.y*3} r={5} fill={e.color} opacity={0.75} style={{ animation: `twinkle ${2+i*0.4}s ease-in-out ${i*0.3}s infinite` }}/>
              <text x={e.x*3+9} y={e.y*3+4} fill={e.color} fontSize="9" fontFamily="DM Mono, monospace" opacity={0.5}>{e.label}</text>
            </g>
          ))}
        </svg>
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 32px', position: 'relative', zIndex: 10 }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 22, fontWeight: 700, color: '#C9A84C', letterSpacing: '0.15em', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ animation: 'pulse 3s ease infinite' }}>🌼</span> DAISY
        </div>
        <button onClick={() => nav('/auth')}
          style={{ padding: '10px 28px', background: 'transparent', border: '1px solid #C9A84C88', borderRadius: 3, color: '#C9A84C', fontFamily: 'Cinzel, serif', fontSize: 13, fontWeight: 600, letterSpacing: '0.18em', cursor: 'pointer', transition: 'all 0.3s', textTransform: 'uppercase' }}
          onMouseEnter={e => { e.target.style.background = 'rgba(201,168,76,0.1)'; e.target.style.borderColor = '#C9A84C' }}
          onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.borderColor = '#C9A84C88' }}>
          Enter
        </button>
      </nav>

      {/* Hero */}
      <section style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '60px 24px 60px', position: 'relative', zIndex: 10 }}>
        <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, fontWeight: 500, letterSpacing: '0.28em', color: '#C9A84C', textTransform: 'uppercase', marginBottom: 28, opacity: 0.9 }}>
          An AI that remembers you
        </p>
        <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 'clamp(38px, 6vw, 76px)', fontWeight: 700, lineHeight: 1.15, color: '#e8dcc8', marginBottom: 28, maxWidth: 820 }}>
          Your inner world,<br />
          <em style={{ color: '#C9A84C', fontStyle: 'italic' }}>woven into light</em>
        </h1>
        <p style={{ fontSize: 'clamp(17px, 2vw, 21px)', fontWeight: 400, color: '#a89880', maxWidth: 540, lineHeight: 1.75, fontStyle: 'italic', marginBottom: 52 }}>
          Daisy remembers every conversation, grows with you, and maps your emotional universe as a <strong>living constellation</strong> — uniquely yours.
        </p>
        <button onClick={() => nav('/auth')}
          style={{ display: 'inline-block', padding: '16px 48px', background: 'transparent', border: '1px solid #C9A84C88', borderRadius: 3, color: '#C9A84C', fontFamily: 'Cinzel, serif', fontSize: 14, fontWeight: 600, letterSpacing: '0.2em', cursor: 'pointer', transition: 'all 0.3s', textTransform: 'uppercase' }}
          onMouseEnter={e => { e.target.style.background = 'rgba(201,168,76,0.12)'; e.target.style.borderColor = '#C9A84C'; e.target.style.boxShadow = '0 0 30px rgba(201,168,76,0.15)' }}
          onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.borderColor = '#C9A84C88'; e.target.style.boxShadow = 'none' }}>
          Begin Your Journey
        </button>
      </section>

      {/* Features */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, padding: '0 32px 72px', position: 'relative', zIndex: 10, maxWidth: 1000, margin: '0 auto', width: '100%' }}>
        {[
          { icon: '🧠', title: 'Persistent Memory', text: 'Daisy remembers every conversation. She builds a picture of you over time — your fears, joys, dreams.' },
          { icon: '✦', title: 'Living Constellation', text: 'Your memories become stars. Watch your inner world grow into a map only you possess.' },
          { icon: '✉', title: 'Personal Letters', text: 'Daisy writes you letters — poetic reflections drawn from everything she knows about you.' },
          { icon: '◎', title: 'Friend + Therapist', text: 'She talks back, shares opinions, reads the room — and goes deep when you need her to.' },
        ].map((f, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, padding: '28px 22px', backdropFilter: 'blur(8px)' }}>
            <div style={{ fontSize: 26, marginBottom: 14 }}>{f.icon}</div>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', color: '#C9A84C', marginBottom: 10, textTransform: 'uppercase' }}>{f.title}</div>
            <div style={{ fontSize: 15, color: '#7a7065', lineHeight: 1.7, fontStyle: 'italic' }}>{f.text}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
