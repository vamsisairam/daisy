import { useNavigate } from 'react-router-dom'

const STARS = Array.from({ length: 70 }, () => ({
  x: Math.random() * 100, y: Math.random() * 100,
  s: Math.random() * 2 + 0.4,
  d: Math.random() * 5, dur: Math.random() * 3 + 2.5,
}))

export default function Landing() {
  const nav = useNavigate()
  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 30% 20%, #0d1f38 0%, #060d1a 65%)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {STARS.map((st, i) => (
        <div key={i} style={{ position: 'absolute', left: `${st.x}%`, top: `${st.y}%`, width: st.s, height: st.s, borderRadius: '50%', background: '#fff', animation: `twinkle ${st.dur}s ease-in-out ${st.d}s infinite`, pointerEvents: 'none' }} />
      ))}
      <div style={{ position: 'absolute', top: '15%', left: '15%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 32px', position: 'relative', zIndex: 10 }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 22, fontWeight: 700, color: '#C9A84C', letterSpacing: '0.15em', display: 'flex', alignItems: 'center', gap: 8 }}>
          🌼 DAISY
        </div>
        <button onClick={() => nav('/auth')}
          style={{ padding: '11px 30px', background: 'transparent', border: '1px solid rgba(201,168,76,0.5)', borderRadius: 8, color: '#C9A84C', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.1)'; e.currentTarget.style.borderColor = '#C9A84C' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.5)' }}>
          Enter →
        </button>
      </nav>

      {/* Hero */}
      <section style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '48px 24px 56px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'inline-block', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 20, padding: '5px 16px', marginBottom: 28 }}>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, fontWeight: 500, letterSpacing: '0.2em', color: '#C9A84C', textTransform: 'uppercase' }}>An AI that remembers you</span>
        </div>

        <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 'clamp(34px, 6vw, 72px)', fontWeight: 700, lineHeight: 1.15, color: '#eae0cc', marginBottom: 24, maxWidth: 800 }}>
          Your inner world,<br />
          <span style={{ color: '#C9A84C' }}>woven into light</span>
        </h1>

        <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', fontWeight: 400, color: '#8a7f72', maxWidth: 520, lineHeight: 1.75, marginBottom: 44 }}>
          Daisy remembers every conversation, grows with you, and maps your emotional universe as a <strong style={{ color: '#b0a090', fontWeight: 600 }}>living constellation</strong> — uniquely yours.
        </p>

        <button onClick={() => nav('/auth')}
          style={{ padding: '16px 52px', background: 'linear-gradient(135deg, rgba(201,168,76,0.18), rgba(201,168,76,0.08))', border: '1px solid rgba(201,168,76,0.5)', borderRadius: 10, color: '#C9A84C', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 16, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.04em' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.22)'; e.currentTarget.style.boxShadow = '0 0 32px rgba(201,168,76,0.2)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(201,168,76,0.18), rgba(201,168,76,0.08))'; e.currentTarget.style.boxShadow = 'none' }}>
          Begin Your Journey
        </button>
      </section>

      {/* Feature cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, padding: '0 28px 64px', maxWidth: 980, margin: '0 auto', width: '100%', position: 'relative', zIndex: 10 }}>
        {[
          { icon: '🧠', title: 'Persistent Memory', text: 'Remembers every conversation. Builds a picture of you over time.' },
          { icon: '✦', title: 'Living Constellation', text: 'Your memories become stars — a visual map of your emotional world.' },
          { icon: '✉', title: 'Personal Letters', text: 'Daisy writes you letters drawn from everything she knows about you.' },
          { icon: '💬', title: 'Friend + Therapist', text: 'Talks back, shares opinions, goes deep when you need it.' },
        ].map((f, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '24px 20px', transition: 'border-color 0.2s, background 0.2s', cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.2)'; e.currentTarget.style.background = 'rgba(201,168,76,0.03)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}>
            <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
            <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', color: '#C9A84C', marginBottom: 8, textTransform: 'uppercase' }}>{f.title}</div>
            <div style={{ fontSize: 15, fontWeight: 400, color: '#6a6258', lineHeight: 1.65 }}>{f.text}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
