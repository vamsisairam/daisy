import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

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
        // identities is empty when email already exists in Supabase
        if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
          throw new Error('This email is already registered. Please sign in instead.')
        }
        if (data.user) {
          await supabase.from('profiles').upsert({ id: data.user.id, name: name || 'Wanderer' })
          setSuccess('✓ Account created! You can sign in now.')
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) {
          // Make Supabase's generic errors friendlier
          if (err.message.includes('Invalid login credentials')) {
            throw new Error('Wrong email or password. Please try again.')
          }
          if (err.message.includes('Email not confirmed')) {
            throw new Error('Please confirm your email first.... you are closerrr-errrr')
          }
          throw err
        }
        nav('/sanctum')
      }
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const inp = {
    width: '100%', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
    padding: '14px 18px', color: '#eae0cc',
    fontSize: 16, fontWeight: 400,
    transition: 'border-color 0.2s', marginBottom: 12,
  }

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 40% 30%, #0d1f38 0%, #060d1a 70%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative', overflow: 'hidden' }}>

      {/* bg stars */}
      {Array.from({length:30}).map((_,i)=>(
        <div key={i} style={{ position:'absolute', left:`${Math.random()*100}%`, top:`${Math.random()*100}%`, width: Math.random()*1.5+0.5, height: Math.random()*1.5+0.5, borderRadius:'50%', background:'#fff', opacity: 0.3, animation:`twinkle ${Math.random()*3+2}s ease-in-out ${Math.random()*4}s infinite` }}/>
      ))}

      <div style={{ width: '100%', maxWidth: 400, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 16, padding: 'clamp(28px, 5vw, 48px)', backdropFilter: 'blur(24px)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', position: 'relative', zIndex: 1, animation: 'fadeUp 0.5s ease both' }}>

        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 30, fontWeight: 700, color: '#C9A84C', letterSpacing: '0.12em', marginBottom: 8 }}>🌼 DAISY</div>
          <div style={{ fontSize: 15, fontWeight: 400, color: '#6a6258' }}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </div>
        </div>

        {mode === 'signup' && (
          <input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} style={inp}
            onFocus={e => e.target.style.borderColor = 'rgba(201,168,76,0.6)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
        )}
        <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} style={inp}
          onFocus={e => e.target.style.borderColor = 'rgba(201,168,76,0.6)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handle()}
          style={{ ...inp, marginBottom: 22 }}
          onFocus={e => e.target.style.borderColor = 'rgba(201,168,76,0.6)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />

        {error && <div style={{ background: 'rgba(232,118,118,0.1)', border: '1px solid rgba(232,118,118,0.25)', borderRadius: 8, padding: '10px 14px', color: '#e87676', fontSize: 14, fontWeight: 500, marginBottom: 16 }}>{error}</div>}
        {success && (
          <div style={{ background: 'rgba(82,199,122,0.08)', border: '1px solid rgba(82,199,122,0.3)', borderRadius: 10, padding: '14px 16px', marginBottom: 16, animation: 'fadeUp 0.3s ease both' }}>
            <div style={{ color: '#52c77a', fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{success}</div>
            <div style={{ color: '#6a9a70', fontSize: 13, fontWeight: 400, lineHeight: 1.5 }}>
              If you got a confirmation email, can't ignore the security guys! confirm yourselves! Are you real?
            </div>
          </div>
        )}

        <button onClick={handle} disabled={loading}
          style={{ width: '100%', padding: '15px', background: loading ? 'rgba(201,168,76,0.08)' : 'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.1))', border: '1px solid rgba(201,168,76,0.5)', borderRadius: 10, color: '#C9A84C', fontSize: 15, fontWeight: 700, letterSpacing: '0.06em', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', marginBottom: 20 }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'rgba(201,168,76,0.25)' }}
          onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.1))' }}>
          {loading ? '🌼 ...' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>

        <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 400, color: '#6a6258' }}>
          {mode === 'login' ? 'No account? ' : 'Have an account? '}
          <span onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess('') }}
            style={{ color: '#C9A84C', cursor: 'pointer', fontWeight: 700 }}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </span>
        </div>

        <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', fontSize: 12, fontWeight: 400, color: '#4a4540', fontFamily: 'DM Mono, monospace', letterSpacing: '0.04em' }}>
          your space · your stars · no ads · free
        </div>
      </div>
    </div>
  )
}
