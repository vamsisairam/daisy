import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

// Convert VAPID key for push subscription
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  return new Uint8Array([...raw].map(c => c.charCodeAt(0)))
}

const STEPS = [
  {
    id: 'hello',
    daisy: (name) => `Hi${name ? ` ${name}` : ''} — I'm Daisy. 🌼\n\nI'm not like other apps. I actually remember you. Every conversation we have becomes part of your story — saved in your diary, woven into your constellation of stars.\n\nI'm here whenever you need to think something through, vent, or just talk.`,
    action: 'Sounds good',
  },
  {
    id: 'name',
    daisy: () => `Before we begin — what should I call you?`,
    input: true,
    placeholder: 'Your name...',
    action: 'That\'s me →',
  },
  {
    id: 'feeling',
    daisy: (name) => `Nice to meet you, ${name}. 🌼\n\nFirst question — and be honest — how are you actually doing right now?`,
    input: true,
    placeholder: 'I\'m feeling...',
    action: 'Tell Daisy →',
  },
  {
    id: 'one_thing',
    daisy: (name) => `Thank you for sharing that, ${name}.\n\nOne more thing — what's something that's been on your mind lately? Could be big, could be small.`,
    input: true,
    placeholder: 'Something on my mind...',
    action: 'Got it →',
  },
  {
    id: 'notifications',
    daisy: (name) => `I'd love to check in with you, ${name} — a gentle nudge when you haven't talked in a while.\n\nWant me to reach out when you've been quiet for a couple of days?`,
    action: 'Yes, remind me',
    skipAction: 'Maybe later',
  },
  {
    id: 'done',
    daisy: (name) => `You're all set, ${name}. 🌼\n\nYour sanctuary is ready. Everything you share here stays here — private, yours, safe.\n\nLet's begin.`,
    action: 'Enter Sanctum →',
  },
]

export default function Onboarding({ session }) {
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [inputVal, setInputVal] = useState('')
  const [answers, setAnswers] = useState({})
  const [visible, setVisible] = useState(true)
  const [typing, setTyping] = useState(true)
  const inputRef = useRef(null)

  const current = STEPS[step]

  useEffect(() => {
    setTyping(true)
    setVisible(false)
    const t1 = setTimeout(() => setVisible(true), 100)
    const t2 = setTimeout(() => {
      setTyping(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }, 800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [step])

  const requestPush = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
      const reg = await navigator.serviceWorker.ready
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') return
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      })
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub, user_id: session.user.id })
      })
    } catch (e) { console.log('Push setup skipped:', e.message) }
  }

  const saveOnboardingMemories = async () => {
    const feeling = answers.feeling
    const oneMind = answers.one_thing
    const memories = []
    if (feeling) memories.push({ user_id: session.user.id, content: `When they first arrived, ${name || 'they'} said they were feeling: ${feeling}`, emotion: 'neutral', theme: 'general' })
    if (oneMind) memories.push({ user_id: session.user.id, content: `On their first day, something on their mind was: ${oneMind}`, emotion: 'neutral', theme: 'general' })
    if (memories.length > 0) {
      await supabase.from('memories').insert(memories)
    }
    // Mark onboarded in profile
    await supabase.from('profiles').update({ name: name || 'Wanderer', onboarded: true }).eq('id', session.user.id)
  }

  const handleNext = async (skip = false) => {
    // Save input value for this step
    if (current.input && inputVal.trim()) {
      if (current.id === 'name') setName(inputVal.trim())
      setAnswers(prev => ({ ...prev, [current.id]: inputVal.trim() }))
    }

    if (current.id === 'notifications' && !skip) {
      await requestPush()
    }

    if (current.id === 'done') {
      await saveOnboardingMemories()
      nav('/sanctum')
      return
    }

    setInputVal('')
    setStep(s => s + 1)
  }

  const displayName = name || (answers.name) || ''
  const daisyText = current.daisy(displayName)

  const canProceed = !current.input || inputVal.trim().length > 0

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 30% 20%, #0d1f38 0%, #060d1a 65%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden' }}>

      {/* Stars */}
      {Array.from({length:40}).map((_,i) => (
        <div key={i} style={{ position:'absolute', left:`${Math.random()*100}%`, top:`${Math.random()*100}%`, width:Math.random()*1.5+0.5, height:Math.random()*1.5+0.5, borderRadius:'50%', background:'#fff', opacity:0.2, animation:`twinkle ${Math.random()*3+2}s ease-in-out ${Math.random()*4}s infinite`, pointerEvents:'none' }}/>
      ))}

      <div style={{ width:'100%', maxWidth:480, position:'relative', zIndex:1 }}>

        {/* Progress dots */}
        <div style={{ display:'flex', justifyContent:'center', gap:8, marginBottom:40 }}>
          {STEPS.map((_,i) => (
            <div key={i} style={{ width: i===step?24:8, height:8, borderRadius:4, background: i<=step?'#C9A84C':'rgba(255,255,255,0.1)', transition:'all 0.3s ease' }}/>
          ))}
        </div>

        {/* Daisy avatar */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:72, height:72, borderRadius:'50%', background:'rgba(201,168,76,0.1)', border:'1px solid rgba(201,168,76,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, margin:'0 auto', boxShadow:'0 0 30px rgba(201,168,76,0.12)', animation:'pulse 3s ease infinite' }}>
            🌼
          </div>
        </div>

        {/* Daisy message */}
        <div style={{
          background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)',
          borderRadius:16, padding:'24px 28px', marginBottom:24,
          opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(8px)',
          transition:'opacity 0.4s ease, transform 0.4s ease', minHeight:100,
        }}>
          {typing ? (
            <div style={{ display:'flex', gap:5, alignItems:'center', padding:'8px 0' }}>
              {[0,1,2].map(i => <div key={i} style={{ width:7, height:7, borderRadius:'50%', background:'#C9A84C', opacity:0.6, animation:`blink 1.2s ease ${i*0.2}s infinite` }}/>)}
            </div>
          ) : (
            <div style={{ fontSize:16, fontWeight:400, color:'#d0c0a8', lineHeight:1.8, whiteSpace:'pre-line' }}>
              {daisyText}
            </div>
          )}
        </div>

        {/* Input */}
        {current.input && !typing && (
          <input
            ref={inputRef}
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && canProceed && handleNext()}
            placeholder={current.placeholder}
            style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:10, padding:'14px 18px', color:'#eae0cc', fontSize:16, marginBottom:16, outline:'none', transition:'border-color 0.2s', boxSizing:'border-box' }}
            onFocus={e => e.target.style.borderColor='rgba(201,168,76,0.6)'}
            onBlur={e => e.target.style.borderColor='rgba(201,168,76,0.3)'}
            autoFocus
          />
        )}

        {/* Actions */}
        {!typing && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <button
              onClick={() => handleNext(false)}
              disabled={!canProceed}
              style={{ width:'100%', padding:'15px', background: canProceed?'linear-gradient(135deg, rgba(201,168,76,0.22), rgba(201,168,76,0.1))':'rgba(255,255,255,0.03)', border:`1px solid ${canProceed?'rgba(201,168,76,0.55)':'rgba(255,255,255,0.08)'}`, borderRadius:10, color:canProceed?'#C9A84C':'#4a4540', fontSize:15, fontWeight:700, cursor:canProceed?'pointer':'not-allowed', transition:'all 0.2s', letterSpacing:'0.04em' }}
              onMouseEnter={e => { if(canProceed) e.currentTarget.style.background='rgba(201,168,76,0.26)' }}
              onMouseLeave={e => { if(canProceed) e.currentTarget.style.background='linear-gradient(135deg, rgba(201,168,76,0.22), rgba(201,168,76,0.1))' }}>
              {current.action}
            </button>
            {current.skipAction && (
              <button
                onClick={() => handleNext(true)}
                style={{ width:'100%', padding:'11px', background:'transparent', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, color:'#6a6258', fontSize:14, cursor:'pointer', transition:'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color='#8a7f72'}
                onMouseLeave={e => e.currentTarget.style.color='#6a6258'}>
                {current.skipAction}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
