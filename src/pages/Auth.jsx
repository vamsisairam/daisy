import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const STARS = Array.from({ length: 40 }, () => ({
  x: Math.random() * 100,
  y: Math.random() * 100,
  s: Math.random() * 1.5 + 0.5,
  d: Math.random() * 4,
  dur: Math.random() * 3 + 2,
}))

export default function Auth() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const nav = useNavigate()

  const handle = async () => {
    setError(''); setSuccess('')
    if (!email || !password) return setError('Please fill all fields.')
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { data, error: err } = await supabase.auth.signUp({ email, password })
        if (err) throw err
        if (data.user) {
          await supabase.from('profiles').upsert({ id: data.user.id, name: name || 'Wanderer' })
          setSuccess('Check your email to confirm, then sign in.')
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) throw err
        nav('/sanctum')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inp = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 3,
    padding: '13px 16px',
    color: '#e8dcc8',
    fontSize: 15,
    fontFamily: 'Cormorant Garamond, serif',
    transition: 'border-color 0.2s',
    marginBottom: 14,
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 40% 30%, #0d1f35 0%, #050c18 70%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      padding: 24,
    }}>
      {STARS.map((st, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${st.x}%`, top: `${st.y}%`,
          width: st.s, height: st.s,
          borderRadius: '50%', background: '#fff',
          animation: `twinkle ${st.dur}s ease-in-out ${st.d}s infinite`,
        }} />
      ))}

      <div style={{
        width: '100%', maxWidth: 400,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 6,
        padding: '48px 40px',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
        animation: 'fadeUp 0.6s ease both',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            fontFamily: 'Cinzel, serif', fontSize: 28,
            color: '#C9A84C', letterSpacing: '0.15em',
            marginBottom: 6, animation: 'pulse 3s ease infinite',
          }}>
            🌼 DAISY
          </div>
          <div style={{ color: '#7a7065', fontSize: 13, fontStyle: 'italic' }}>
            {mode === 'login' ? 'Welcome back, wanderer' : 'Begin your constellation'}
          </div>
        </div>

        {mode === 'signup' && (
          <input
            placeholder="Your name"
            value={name}
            onChange={e => setName(e.target.value)}
            style={inp}
            onFocus={e => e.target.style.borderColor = '#C9A84C88'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={inp}
          onFocus={e => e.target.style.borderColor = '#C9A84C88'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handle()}
          style={{ ...inp, marginBottom: 24 }}
          onFocus={e => e.target.style.borderColor = '#C9A84C88'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />

        {error && (
          <div style={{ color: '#e87676', fontSize: 13, marginBottom: 16, fontStyle: 'italic', textAlign: 'center' }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ color: '#52c77a', fontSize: 13, marginBottom: 16, fontStyle: 'italic', textAlign: 'center' }}>
            {success}
          </div>
        )}

        <button
          onClick={handle}
          disabled={loading}
          style={{
            width: '100%', padding: '14px',
            background: loading ? 'rgba(201,168,76,0.1)' : 'transparent',
            border: '1px solid #C9A84C88',
            borderRadius: 3,
            color: '#C9A84C',
            fontFamily: 'Cinzel, serif',
            fontSize: 12,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s',
            marginBottom: 20,
          }}
          onMouseEnter={e => { if (!loading) e.target.style.background = 'rgba(201,168,76,0.1)' }}
          onMouseLeave={e => { if (!loading) e.target.style.background = 'transparent' }}
        >
          {loading ? '✦' : mode === 'login' ? 'Enter Sanctum' : 'Create Account'}
        </button>

        <div style={{ textAlign: 'center', fontSize: 13, color: '#7a7065' }}>
          {mode === 'login' ? "No account? " : "Have an account? "}
          <span
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess(''); }}
            style={{ color: '#C9A84C', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {mode === 'login' ? 'Create one' : 'Sign in'}
          </span>
        </div>

        <div style={{
          marginTop: 28, paddingTop: 20,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          textAlign: 'center', fontSize: 11,
          color: '#7a7065', fontFamily: 'DM Mono, monospace',
          letterSpacing: '0.05em',
        }}>
          your space. your stars. no ads. forever free.
        </div>
      </div>
    </div>
  )
}
