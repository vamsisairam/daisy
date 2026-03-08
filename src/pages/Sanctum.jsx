import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

const EMOTION_COLOR = {
  happy:'#C9A84C', grateful:'#52c77a', excited:'#e87676',
  neutral:'#8899aa', reflective:'#9b7fde', sad:'#4a9eff',
  anxious:'#ff8c42', hopeful:'#5ec8c8', melancholy:'#7890c0',
}

async function callDaisy({ messages, memories, mode, userName }) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, memories, mode: mode || 'chat', userName }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'API error')
  const text = data?.content?.map(b => b.text || '').join('') || ''
  if (!text) throw new Error('Empty response')
  return text
}

// ─── Constellation ────────────────────────────────────────────
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
    const stars = memories.map((m, i) => {
      const angle = (i * 137.5 % 360) * Math.PI / 180
      const radius = 80 + (i * 47) % (Math.min(W, H) * 0.35)
      return { x: W/2+Math.cos(angle)*radius*(0.6+(i%3)*0.2), y: H/2+Math.sin(angle)*radius*(0.6+(i%3)*0.2), r: 3+(i%3), color: EMOTION_COLOR[m.emotion]||'#8899aa', phase: Math.random()*Math.PI*2, memory: m }
    })
    starsRef.current = stars
    const bg = Array.from({length:100},()=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.2,ph:Math.random()*Math.PI*2}))
    let t=0
    const draw=()=>{
      ctx.clearRect(0,0,W,H)
      bg.forEach(s=>{ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fillStyle=`rgba(255,255,255,${0.18+0.12*Math.sin(t*0.3+s.ph)})`;ctx.fill()})
      for(let i=0;i<stars.length;i++) for(let j=i+1;j<stars.length;j++){const d=Math.sqrt((stars[i].x-stars[j].x)**2+(stars[i].y-stars[j].y)**2);if(d<140){ctx.beginPath();ctx.moveTo(stars[i].x,stars[i].y);ctx.lineTo(stars[j].x,stars[j].y);ctx.strokeStyle=`rgba(255,255,255,${0.07*(1-d/140)})`;ctx.lineWidth=0.5;ctx.stroke()}}
      stars.forEach((s,i)=>{const pulse=1+0.28*Math.sin(t*0.8+s.phase);const isH=hoveredRef.current===i;const r=isH?s.r*2.8:s.r*pulse;const g=ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,r*5);g.addColorStop(0,s.color+'55');g.addColorStop(1,'transparent');ctx.beginPath();ctx.arc(s.x,s.y,r*5,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();ctx.beginPath();ctx.arc(s.x,s.y,r,0,Math.PI*2);ctx.fillStyle=isH?s.color:s.color+'ee';ctx.fill()})
      t+=0.022;rafRef.current=requestAnimationFrame(draw)
    }
    draw()
    return ()=>cancelAnimationFrame(rafRef.current)
  },[memories])

  const handleMove=(e)=>{
    const rect=canvasRef.current.getBoundingClientRect()
    const cx=e.touches?e.touches[0].clientX:e.clientX
    const cy=e.touches?e.touches[0].clientY:e.clientY
    const mx=cx-rect.left,my=cy-rect.top
    let found=null
    starsRef.current.forEach((s,i)=>{if(Math.sqrt((mx-s.x)**2+(my-s.y)**2)<20) found=i})
    hoveredRef.current=found
    if(found!==null){const s=starsRef.current[found];setTooltip({x:mx,y:my,memory:s.memory,color:s.color})}else setTooltip(null)
  }

  if(memories.length===0) return (
    <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:40}}>
      <div style={{fontSize:56,marginBottom:20,opacity:0.2}}>✦</div>
      <div style={{fontSize:18,fontWeight:700,marginBottom:10,color:'#8a7f72'}}>Your constellation awaits</div>
      <div style={{fontSize:15,color:'#6a6258',maxWidth:280,lineHeight:1.7}}>Talk to Daisy — after a few conversations, your stars will appear here</div>
    </div>
  )

  return (
    <div style={{flex:1,position:'relative',overflow:'hidden'}}>
      <canvas ref={canvasRef} onMouseMove={handleMove} onTouchMove={handleMove} onMouseLeave={()=>{hoveredRef.current=null;setTooltip(null)}} style={{width:'100%',height:'100%',cursor:tooltip?'pointer':'crosshair',touchAction:'none'}}/>
      {tooltip&&(
        <div style={{position:'absolute',left:Math.min(tooltip.x+18,window.innerWidth-250),top:Math.max(tooltip.y-80,10),background:'rgba(6,13,26,0.97)',border:`1px solid ${tooltip.color}55`,borderRadius:10,padding:'12px 16px',maxWidth:240,pointerEvents:'none',backdropFilter:'blur(16px)',zIndex:10,boxShadow:'0 8px 32px rgba(0,0,0,0.5)'}}>
          <div style={{fontFamily:'DM Mono,monospace',fontSize:11,fontWeight:500,color:tooltip.color,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.1em'}}>{tooltip.memory.emotion} · {tooltip.memory.theme}</div>
          <div style={{fontSize:14,fontWeight:400,color:'#c8b898',lineHeight:1.6}}>{tooltip.memory.content}</div>
        </div>
      )}
      <div style={{position:'absolute',bottom:20,left:0,right:0,display:'flex',justifyContent:'center',gap:16,flexWrap:'wrap',pointerEvents:'none',padding:'0 16px'}}>
        {Object.entries(EMOTION_COLOR).slice(0,6).map(([emo,col])=>(
          <div key={emo} style={{display:'flex',alignItems:'center',gap:5,fontFamily:'DM Mono,monospace',fontSize:11,color:'#6a6258'}}>
            <div style={{width:7,height:7,borderRadius:'50%',background:col}}/>{emo}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Logs View ─────────────────────────────────────────────────
function LogsView({ logs, onResume }) {
  const [expanded, setExpanded] = useState(null)

  // Sort by date desc — each log is one day
  const sorted = [...logs].sort((a, b) => {
    const da = a.log_date || a.created_at
    const db = b.log_date || b.created_at
    return db > da ? 1 : -1
  })

  const fmtDate = (dateStr) => {
    const d = new Date(dateStr + (dateStr.length === 10 ? 'T12:00:00' : ''))
    const today = new Date()
    const yesterday = new Date(); yesterday.setDate(today.getDate() - 1)
    if (d.toDateString() === today.toDateString()) return 'Today'
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
  }

  if (logs.length === 0) return (
    <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:40}}>
      <div style={{fontSize:48,marginBottom:20,opacity:0.2}}>📓</div>
      <div style={{fontSize:18,fontWeight:700,marginBottom:10,color:'#8a7f72'}}>Your diary is empty</div>
      <div style={{fontSize:15,color:'#6a6258',maxWidth:320,lineHeight:1.7}}>
        Conversations are saved here automatically — 2 minutes after you stop chatting. One entry per day.
      </div>
    </div>
  )

  return (
    <div style={{flex:1,overflowY:'auto',padding:'clamp(20px,4vw,44px)',WebkitOverflowScrolling:'touch'}}>
      <div style={{maxWidth:700,margin:'0 auto'}}>
        <div style={{fontSize:24,fontWeight:800,color:'#C9A84C',marginBottom:4}}>Your Diary</div>
        <div style={{fontSize:15,fontWeight:400,color:'#6a6258',marginBottom:40,lineHeight:1.6}}>
          {logs.length} day{logs.length !== 1 ? 's' : ''} of conversations
        </div>

        {sorted.map((log) => {
          const isOpen = expanded === log.id
          const dateLabel = fmtDate(log.log_date || log.created_at)
          const msgs = log.messages || []
          const realMsgs = msgs.filter((m, i) => !(i === 0 && m.role === 'assistant')) // skip greeting

          return (
            <div key={log.id} style={{marginBottom:16,background:'rgba(255,255,255,0.03)',border:`1px solid ${isOpen ? 'rgba(201,168,76,0.28)' : 'rgba(255,255,255,0.07)'}`,borderRadius:14,overflow:'hidden',transition:'border-color 0.2s, box-shadow 0.2s',boxShadow:isOpen?'0 4px 28px rgba(0,0,0,0.28)':'none'}}>

              {/* Date header row */}
              <div
                onClick={() => setExpanded(isOpen ? null : log.id)}
                style={{padding:'18px 20px',cursor:'pointer',display:'flex',alignItems:'flex-start',gap:14,transition:'background 0.15s',WebkitTapHighlightColor:'transparent'}}
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>

                {/* Date badge */}
                <div style={{flexShrink:0,background: dateLabel==='Today'?'rgba(201,168,76,0.12)':'rgba(255,255,255,0.05)',border:`1px solid ${dateLabel==='Today'?'rgba(201,168,76,0.3)':'rgba(255,255,255,0.09)'}`,borderRadius:10,padding:'6px 12px',minWidth:80,textAlign:'center'}}>
                  <div style={{fontFamily:'DM Mono,monospace',fontSize:12,fontWeight:600,color:dateLabel==='Today'?'#C9A84C':'#8a7f72',whiteSpace:'nowrap'}}>{dateLabel}</div>
                </div>

                <div style={{flex:1,minWidth:0}}>
                  {/* Diary summary */}
                  <div style={{fontSize:15,fontWeight:400,color:'#d0c0a8',lineHeight:1.8,marginBottom:8}}>
                    {log.summary || <span style={{color:'#4a4540'}}>No summary yet</span>}
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                    <span style={{fontFamily:'DM Mono,monospace',fontSize:11,fontWeight:400,color:'#6a6258'}}>{log.message_count} message{log.message_count!==1?'s':''}</span>
                    <span style={{color:'#3a3530',fontSize:10}}>·</span>
                    <span style={{fontFamily:'DM Mono,monospace',fontSize:11,fontWeight:500,color:isOpen?'#C9A84C':'#6a6258',transition:'color 0.15s'}}>{isOpen ? 'collapse' : 'read'}</span>
                  </div>
                </div>

                <div style={{color:'#C9A84C',fontSize:15,flexShrink:0,transition:'transform 0.25s ease',transform:isOpen?'rotate(180deg)':'none',opacity:0.7,marginTop:4}}>▾</div>
              </div>

              {/* Expanded: full conversation + Continue button */}
              {isOpen && (
                <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',animation:'fadeIn 0.2s ease both'}}>

                  {/* Continue chat banner */}
                  <div style={{padding:'12px 20px',background:'rgba(201,168,76,0.05)',borderBottom:'1px solid rgba(255,255,255,0.05)',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
                    <span style={{fontSize:13,fontWeight:500,color:'#8a7f72'}}>Want to continue this conversation?</span>
                    <button
                      onClick={() => onResume(log.messages || [])}
                      style={{background:'rgba(201,168,76,0.15)',border:'1px solid rgba(201,168,76,0.4)',borderRadius:8,padding:'7px 18px',color:'#C9A84C',fontSize:13,fontWeight:700,cursor:'pointer',transition:'all 0.15s',WebkitTapHighlightColor:'transparent',letterSpacing:'0.03em',flexShrink:0}}
                      onMouseEnter={e => e.currentTarget.style.background='rgba(201,168,76,0.25)'}
                      onMouseLeave={e => e.currentTarget.style.background='rgba(201,168,76,0.15)'}>
                      Continue Chat →
                    </button>
                  </div>

                  {/* Messages */}
                  <div style={{padding:'18px 20px',display:'flex',flexDirection:'column',gap:10,background:'rgba(0,0,0,0.1)'}}>
                    {realMsgs.map((m, mi) => (
                      <div key={mi} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start',alignItems:'flex-end',gap:8}}>
                        {m.role==='assistant' && (
                          <div style={{width:26,height:26,borderRadius:'50%',background:'rgba(201,168,76,0.12)',border:'1px solid rgba(201,168,76,0.22)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,flexShrink:0}}>🌼</div>
                        )}
                        <div style={{maxWidth:'80%',padding:'10px 14px',borderRadius:m.role==='user'?'14px 14px 4px 14px':'14px 14px 14px 4px',background:m.role==='user'?'rgba(201,168,76,0.1)':'rgba(255,255,255,0.05)',border:`1px solid ${m.role==='user'?'rgba(201,168,76,0.18)':'rgba(255,255,255,0.07)'}`,fontSize:14,fontWeight:m.role==='user'?500:400,lineHeight:1.65,color:m.role==='user'?'#e0d0b0':'#b0a090',wordBreak:'break-word'}}>
                          {m.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Letter View ──────────────────────────────────────────────
function LetterView({ memories, userName, letters, setLetters }) {
  const [generating, setGenerating] = useState(false)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')

  const generateLetter = async () => {
    setError(''); setGenerating(true)
    try {
      const ctx = memories.map(m=>`${m.emotion} about ${m.theme}: ${m.content}`).join('\n')
      const text = await callDaisy({ messages:[{role:'user',content:`Write me a personal letter based on my memories:\n${ctx}`}], memories, mode:'letter', userName })
      const letter={id:Date.now(),text,date:new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}
      const updated=[letter,...letters]
      setLetters(updated)
      setSelected(letter)
      try{localStorage.setItem('daisy_letters',JSON.stringify(updated))}catch{}
    } catch(e){setError('Try again in a moment.');console.error(e)}
    finally{setGenerating(false)}
  }

  if(selected) return (
    <div style={{flex:1,overflowY:'auto',padding:'clamp(20px,4vw,44px)'}}>
      <div style={{maxWidth:660,margin:'0 auto'}}>
        <button onClick={()=>setSelected(null)} style={{background:'none',border:'none',color:'#C9A84C',cursor:'pointer',fontSize:14,fontWeight:600,marginBottom:32,padding:0,display:'flex',alignItems:'center',gap:6}}>← Back</button>
        <div style={{fontFamily:'DM Mono,monospace',fontSize:11,fontWeight:500,color:'#6a6258',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:32}}>Letter from Daisy · {selected.date}</div>
        <div style={{fontSize:17,fontWeight:400,lineHeight:1.9,color:'#c8b898',whiteSpace:'pre-wrap'}}>{selected.text}</div>
      </div>
    </div>
  )

  return (
    <div style={{flex:1,overflowY:'auto',padding:'clamp(20px,4vw,44px)'}}>
      <div style={{maxWidth:660,margin:'0 auto'}}>
        <div style={{fontSize:22,fontWeight:800,color:'#C9A84C',marginBottom:8}}>Letters from Daisy</div>
        <div style={{fontSize:15,fontWeight:400,color:'#6a6258',marginBottom:10,lineHeight:1.7}}>
          {memories.length<3
            ? <><strong style={{color:'#8a7f72',fontWeight:700}}>{3-memories.length} more conversation{3-memories.length!==1?'s':''}</strong> needed to unlock letters</>
            : 'Daisy writes you a personal letter from everything she knows about you'}
        </div>
        {error&&<div style={{background:'rgba(232,118,118,0.1)',border:'1px solid rgba(232,118,118,0.2)',borderRadius:8,padding:'10px 14px',color:'#e87676',fontSize:14,fontWeight:500,marginBottom:16}}>{error}</div>}

        <button onClick={generateLetter} disabled={generating||memories.length<3}
          style={{padding:'13px 32px',background:memories.length>=3&&!generating?'rgba(201,168,76,0.12)':'rgba(255,255,255,0.04)',border:`1px solid ${memories.length>=3?'rgba(201,168,76,0.4)':'rgba(255,255,255,0.08)'}`,borderRadius:10,color:memories.length>=3?'#C9A84C':'#6a6258',fontSize:15,fontWeight:700,cursor:memories.length>=3&&!generating?'pointer':'not-allowed',transition:'all 0.2s',marginBottom:40,display:'flex',alignItems:'center',gap:8}}
          onMouseEnter={e=>{if(memories.length>=3&&!generating) e.currentTarget.style.background='rgba(201,168,76,0.18)'}}
          onMouseLeave={e=>{if(memories.length>=3&&!generating) e.currentTarget.style.background='rgba(201,168,76,0.12)'}}>
          {generating?<><span style={{animation:'blink 0.8s ease infinite'}}>🌼</span> Writing your letter...</>:<>🌼 Write Me a Letter</>}
        </button>

        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {letters.map(l=>(
            <div key={l.id} onClick={()=>setSelected(l)}
              style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding:'18px 20px',cursor:'pointer',transition:'all 0.2s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(201,168,76,0.25)';e.currentTarget.style.background='rgba(201,168,76,0.04)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.07)';e.currentTarget.style.background='rgba(255,255,255,0.03)'}}>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:11,fontWeight:500,color:'#6a6258',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:8}}>{l.date}</div>
              <div style={{fontSize:14,fontWeight:400,color:'#9a8878',lineHeight:1.6}}>{l.text.slice(0,120)}…</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Profile View ─────────────────────────────────────────────
function ProfileView({ session, profile, memories, onSignOut, onDeleteAccount }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)
  const themes=[...new Set(memories.map(m=>m.theme))]
  const topEmotion=Object.entries(memories.reduce((a,m)=>{a[m.emotion]=(a[m.emotion]||0)+1;return a},{})).sort((a,b)=>b[1]-a[1])[0]

  const handleDelete = async () => {
    if (deleteInput.trim().toLowerCase() !== 'delete') return
    setDeleting(true)
    await onDeleteAccount()
    setDeleting(false)
  }

  return (
    <div style={{flex:1,overflowY:'auto',padding:'clamp(20px,4vw,44px)'}}>
      <div style={{maxWidth:520,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:40}}>
          <div style={{width:80,height:80,borderRadius:'50%',background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,margin:'0 auto 16px',animation:'pulse 3s ease infinite'}}>🌼</div>
          <div style={{fontSize:24,fontWeight:800,color:'#eae0cc',marginBottom:4}}>{profile?.name||'Wanderer'}</div>
          <div style={{fontFamily:'DM Mono,monospace',fontSize:12,fontWeight:400,color:'#6a6258'}}>{session.user.email}</div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:32}}>
          {[
            {label:'Memories',value:memories.length,icon:'✦'},
            {label:'Member Since',value:new Date(session.user.created_at).toLocaleDateString('en-IN',{month:'short',year:'numeric'}),icon:'◎'},
            {label:'Themes',value:themes.length||'—',icon:'◈'},
            {label:'Top Feeling',value:topEmotion?topEmotion[0]:'—',icon:'◉',color:topEmotion?EMOTION_COLOR[topEmotion[0]]:undefined},
          ].map((s,i)=>(
            <div key={i} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding:'20px 16px',textAlign:'center'}}>
              <div style={{fontSize:22,marginBottom:8}}>{s.icon}</div>
              <div style={{fontSize:22,fontWeight:800,color:s.color||'#C9A84C',marginBottom:4}}>{s.value}</div>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:11,fontWeight:500,color:'#6a6258',textTransform:'uppercase',letterSpacing:'0.06em'}}>{s.label}</div>
            </div>
          ))}
        </div>

        {themes.length>0&&<div style={{marginBottom:32}}>
          <div style={{fontFamily:'DM Mono,monospace',fontSize:11,fontWeight:500,color:'#6a6258',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:12}}>Your Themes</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {themes.map(t=><span key={t} style={{padding:'6px 14px',background:'rgba(201,168,76,0.08)',border:'1px solid rgba(201,168,76,0.2)',borderRadius:20,fontSize:13,fontWeight:600,color:'#C9A84C'}}>{t}</span>)}
          </div>
        </div>}

        <button onClick={onSignOut}
          style={{width:'100%',padding:'15px',background:'transparent',border:'1px solid rgba(255,255,255,0.09)',borderRadius:10,color:'#6a6258',fontFamily:'Cinzel,serif',fontSize:16,fontWeight:600,letterSpacing:'0.08em',cursor:'pointer',transition:'all 0.2s',marginBottom:12}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(232,118,118,0.3)';e.currentTarget.style.color='#e87676'}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.09)';e.currentTarget.style.color='#6a6258'}}>
          Leave Sanctum
        </button>

        {/* Delete Account */}
        {!showDeleteConfirm ? (
          <button onClick={()=>setShowDeleteConfirm(true)}
            style={{width:'100%',padding:'11px',background:'transparent',border:'1px solid rgba(255,255,255,0.05)',borderRadius:10,color:'#4a4540',fontSize:13,fontWeight:500,cursor:'pointer',transition:'all 0.2s',letterSpacing:'0.03em'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(232,118,118,0.2)';e.currentTarget.style.color='#9a5555'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.05)';e.currentTarget.style.color='#4a4540'}}>
            Delete Account
          </button>
        ) : (
          <div style={{background:'rgba(232,118,118,0.06)',border:'1px solid rgba(232,118,118,0.2)',borderRadius:12,padding:'20px'}}>
            <div style={{fontSize:15,fontWeight:700,color:'#e87676',marginBottom:6}}>Delete everything?</div>
            <div style={{fontSize:13,fontWeight:400,color:'#8a7070',marginBottom:16,lineHeight:1.65}}>
              This will permanently delete your account, all memories, conversations, and diary entries. This cannot be undone.
            </div>
            <div style={{fontSize:13,fontWeight:500,color:'#8a7070',marginBottom:8}}>Type <strong style={{color:'#e87676',fontWeight:700}}>delete</strong> to confirm</div>
            <input
              value={deleteInput}
              onChange={e=>setDeleteInput(e.target.value)}
              placeholder="delete"
              style={{width:'100%',background:'rgba(255,255,255,0.05)',border:`1px solid ${deleteInput.toLowerCase()==='delete'?'rgba(232,118,118,0.5)':'rgba(255,255,255,0.1)'}`,borderRadius:8,padding:'10px 14px',color:'#eae0cc',fontSize:14,fontWeight:400,marginBottom:12,transition:'border-color 0.2s'}}
            />
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>{setShowDeleteConfirm(false);setDeleteInput('')}}
                style={{flex:1,padding:'10px',background:'transparent',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,color:'#6a6258',fontSize:13,fontWeight:600,cursor:'pointer',transition:'all 0.2s'}}
                onMouseEnter={e=>e.currentTarget.style.color='#eae0cc'}
                onMouseLeave={e=>e.currentTarget.style.color='#6a6258'}>
                Cancel
              </button>
              <button onClick={handleDelete}
                disabled={deleteInput.trim().toLowerCase()!=='delete'||deleting}
                style={{flex:1,padding:'10px',background:deleteInput.toLowerCase()==='delete'?'rgba(232,118,118,0.18)':'rgba(255,255,255,0.04)',border:`1px solid ${deleteInput.toLowerCase()==='delete'?'rgba(232,118,118,0.5)':'rgba(255,255,255,0.08)'}`,borderRadius:8,color:deleteInput.toLowerCase()==='delete'?'#e87676':'#4a4540',fontSize:13,fontWeight:700,cursor:deleteInput.toLowerCase()==='delete'?'pointer':'not-allowed',transition:'all 0.2s'}}>
                {deleting ? 'Deleting…' : 'Delete Forever'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Chat View ─────────────────────────────────────────────────
function genId() { return Math.random().toString(36).slice(2)+Date.now().toString(36) }

function ChatView({ messages, setMessages, memories, setMemories, profile, session, onSaveLog, onNewChat }) {
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null) // 'saving' | 'saved' | null
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const userName = profile?.name || 'friend'
  const saveTimerRef = useRef(null)
  // Always holds latest messages — fixes stale closure bug in timer
  const messagesRef = useRef(messages)
  useEffect(() => { messagesRef.current = messages }, [messages])
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:'smooth'})},[messages,thinking])

  // 2-minute idle timer — always uses latest messages via ref
  useEffect(()=>{
    const userMsgs = messages.filter(m=>m.role==='user')
    if(userMsgs.length < 1) return
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      setSaveStatus('saving')
      await onSaveLog(messagesRef.current)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus(null), 3000)
    }, 120000)
    return () => clearTimeout(saveTimerRef.current)
  }, [messages.length])

  const extractMemories=useCallback(async(msgs)=>{
    if(msgs.filter(m=>m.role==='user').length<2) return
    try{
      const raw=await callDaisy({messages:msgs,memories,mode:'extract',userName})
      const extracted=JSON.parse(raw.replace(/```json|```/g,'').trim())
      if(Array.isArray(extracted)&&extracted.length>0){
        const{data}=await supabase.from('memories').insert(extracted.filter(e=>e.content).map(m=>({...m,user_id:session.user.id}))).select()
        if(data) setMemories(prev=>[...prev,...data])
      }
    }catch(e){console.log('Memory extract skipped:',e.message)}
  },[memories,session.user.id,userName])

  const send=async()=>{
    const text=input.trim()
    if(!text||thinking) return
    setInput('')
    // reset textarea height
    if(inputRef.current){inputRef.current.style.height='50px'}
    const updated=[...messages,{role:'user',content:text}]
    setMessages(updated)
    setThinking(true)
    try{
      const reply=await callDaisy({messages:updated,memories,mode:'chat',userName})
      const withReply=[...updated,{role:'assistant',content:reply}]
      setMessages(withReply)
      if(updated.filter(m=>m.role==='user').length%3===0) extractMemories(withReply)
    }catch{
      setMessages(prev=>[...prev,{role:'assistant',content:'Something went wrong. Try again? 🌼'}])
    }finally{setThinking(false);setTimeout(()=>inputRef.current?.focus(),100)}
  }

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minHeight:0}}>
      {/* Messages scroll area */}
      <div style={{flex:1,overflowY:'auto',padding:'20px clamp(14px,3vw,28px)',display:'flex',flexDirection:'column',gap:4,WebkitOverflowScrolling:'touch'}}>
        {messages.map((m,i)=>(
          <div key={i} className="msg-bubble" style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start',marginBottom:10,animation:'msgIn 0.3s ease both',animationDelay:`${i<3?i*0.05:0}s`}}>
            {m.role==='assistant'&&(
              <div style={{width:34,height:34,borderRadius:'50%',background:'rgba(201,168,76,0.12)',border:'1px solid rgba(201,168,76,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,marginRight:10,flexShrink:0,marginTop:2}}>🌼</div>
            )}
            <div style={{maxWidth:'70%',padding:'13px 18px',borderRadius:m.role==='user'?'18px 18px 5px 18px':'18px 18px 18px 5px',background:m.role==='user'?'linear-gradient(135deg,rgba(201,168,76,0.16),rgba(201,168,76,0.09))':'rgba(255,255,255,0.06)',border:`1px solid ${m.role==='user'?'rgba(201,168,76,0.22)':'rgba(255,255,255,0.09)'}`,fontSize:16,fontWeight:m.role==='user'?500:400,lineHeight:1.7,color:m.role==='user'?'#e8d8b4':'#c8baa8',boxShadow:'0 2px 10px rgba(0,0,0,0.15)',wordBreak:'break-word'}}>
              {m.content}
            </div>
          </div>
        ))}

        {thinking&&(
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10,animation:'fadeIn 0.2s ease both'}}>
            <div style={{width:34,height:34,borderRadius:'50%',background:'rgba(201,168,76,0.12)',border:'1px solid rgba(201,168,76,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>🌼</div>
            <div style={{display:'flex',gap:5,padding:'12px 16px',borderRadius:'18px 18px 18px 5px',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.09)'}}>
              {[0,0.25,0.5].map((d,i)=>(
                <div key={i} style={{width:7,height:7,borderRadius:'50%',background:'#C9A84C',animation:`blink 1s ease ${d}s infinite`}}/>
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Status bar */}
      {saveStatus && (
        <div style={{padding:'6px 20px',background:'rgba(0,0,0,0.25)',borderTop:'1px solid rgba(255,255,255,0.04)',display:'flex',alignItems:'center',gap:8,flexShrink:0,animation:'fadeIn 0.3s ease'}}>
          <div style={{width:6,height:6,borderRadius:'50%',background:saveStatus==='saved'?'#52c77a':'#C9A84C',animation:saveStatus==='saving'?'blink 0.8s ease infinite':'none'}}/>
          <span style={{fontFamily:'DM Mono,monospace',fontSize:11,fontWeight:500,color:saveStatus==='saved'?'#52c77a':'#C9A84C',letterSpacing:'0.06em'}}>
            {saveStatus==='saving'?'Saving to diary…':'Saved to diary'}
          </span>
        </div>
      )}

      {/* Input bar */}
      <div style={{padding:'10px clamp(10px,3vw,18px)',borderTop:'1px solid rgba(255,255,255,0.07)',background:'rgba(0,0,0,0.2)',flexShrink:0}}>
        {/* New Chat row */}
        <div style={{display:'flex',justifyContent:'flex-end',marginBottom:8}}>
          <button onClick={onNewChat}
            style={{background:'none',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'5px 14px',color:'#6a6258',fontSize:12,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:5,transition:'all 0.15s',WebkitTapHighlightColor:'transparent',letterSpacing:'0.03em'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(201,168,76,0.3)';e.currentTarget.style.color='#C9A84C'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.1)';e.currentTarget.style.color='#6a6258'}}>
            + New Conversation
          </button>
        </div>
        <div style={{display:'flex',gap:10,alignItems:'flex-end'}}>
          <textarea
            ref={inputRef} rows={1} value={input}
            placeholder={`Talk to Daisy…`}
            onChange={e=>{
              setInput(e.target.value)
              e.target.style.height='50px'
              e.target.style.height=Math.min(e.target.scrollHeight,120)+'px'
            }}
            onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}}
            style={{flex:1,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:14,padding:'13px 18px',color:'#eae0cc',fontSize:16,fontWeight:400,resize:'none',minHeight:50,maxHeight:120,transition:'border-color 0.2s',lineHeight:1.55,WebkitAppearance:'none'}}
            onFocus={e=>e.target.style.borderColor='rgba(201,168,76,0.5)'}
            onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'}
          />
          <button
            onClick={send} disabled={!input.trim()||thinking}
            style={{width:50,height:50,borderRadius:14,flexShrink:0,background:input.trim()&&!thinking?'rgba(201,168,76,0.2)':'rgba(255,255,255,0.05)',border:`1px solid ${input.trim()&&!thinking?'rgba(201,168,76,0.5)':'rgba(255,255,255,0.07)'}`,color:input.trim()&&!thinking?'#C9A84C':'#5a5045',fontSize:20,transition:'all 0.15s',display:'flex',alignItems:'center',justifyContent:'center',WebkitTapHighlightColor:'transparent'}}
            onMouseEnter={e=>{if(input.trim()&&!thinking) e.currentTarget.style.background='rgba(201,168,76,0.3)'}}
            onMouseLeave={e=>{if(input.trim()&&!thinking) e.currentTarget.style.background='rgba(201,168,76,0.2)'}}>
            ↑
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Sanctum ─────────────────────────────────────────────
const NAV = [
  {id:'chat',      icon:'🌼', label:'Converse'},
  {id:'constellation',icon:'✦',label:'Stars'},
  {id:'letters',   icon:'✉', label:'Letters'},
  {id:'logs',      icon:'📓', label:'Logs'},
  {id:'profile',   icon:'◉', label:'Profile'},
]

export default function Sanctum({ session }) {
  const [view,setView]         = useState('chat')
  const [chatKey,setChatKey]   = useState(0)
  const [profile,setProfile]   = useState(null)
  const [memories,setMemories] = useState([])
  const [messages,setMessages] = useState([])
  const [letters,setLetters]   = useState([])
  const [logs,setLogs]         = useState([])
  const nav = useNavigate()

  useEffect(()=>{
    supabase.from('profiles').select('*').eq('id',session.user.id).single()
      .then(({data})=>{if(data) setProfile(data); else supabase.from('profiles').insert({id:session.user.id,name:'Wanderer'})})
    supabase.from('memories').select('*').eq('user_id',session.user.id).order('created_at',{ascending:false})
      .then(({data})=>{if(data) setMemories(data)})
    supabase.from('conversation_logs').select('*').eq('user_id',session.user.id).order('created_at',{ascending:false})
      .then(({data})=>{if(data) setLogs(data)})
    try{const s=localStorage.getItem('daisy_letters');if(s) setLetters(JSON.parse(s))}catch{}
  },[session.user.id])

  useEffect(()=>{
    if(!profile) return
    const h=new Date().getHours()
    const g=h<12?'Good morning':h<17?'Good afternoon':'Good evening'
    const name = profile.name || 'friend'
    let greeting
    if(memories.length === 0) {
      // First time — introduce name naturally through the space, not "Hi I'm Daisy"
      greeting = `${g}, ${name}. I'm Daisy — this is your space. No rush, no agenda. What's going on with you?`
    } else {
      const note = memories.length < 5
        ? ` I've been thinking about what you shared last time.`
        : ` I've been holding ${memories.length} of your stars.`
      greeting = `${g}, ${name}.${note} What's on your mind today?`
    }
    setMessages([{role:'assistant', content: greeting}])
  },[profile?.id])

  // One diary entry per calendar day — appends new messages, re-summarizes
  const handleSaveLog = useCallback(async (msgs) => {
    const newUserMsgs = msgs.filter(m => m.role === 'user')
    if (newUserMsgs.length < 1) return
    const userName = profile?.name || 'friend'
    const logDate = new Date().toISOString().slice(0, 10) // 'YYYY-MM-DD'
    try {
      // Fetch today's existing entry (if any)
      const { data: existing } = await supabase
        .from('conversation_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('log_date', logDate)
        .single()

      let allMessages = msgs
      if (existing) {
        // Merge: existing messages + new ones (skip the greeting of the new session)
        const existingMsgs = existing.messages || []
        const newMsgs = msgs.slice(1) // skip Daisy greeting at index 0
        // Deduplicate by content — prevent double-appending on re-save
        const seenContents = new Set(existingMsgs.map(m => m.content))
        const uniqueNew = newMsgs.filter(m => !seenContents.has(m.content))
        allMessages = [...existingMsgs, ...uniqueNew]
      }

      // Re-summarize the full day's conversation
      const summary = await callDaisy({ messages: allMessages, memories, mode: 'summarize', userName })
      const totalUserMsgs = allMessages.filter(m => m.role === 'user').length

      const { data } = await supabase.from('conversation_logs')
        .upsert(
          { user_id: session.user.id, log_date: logDate, messages: allMessages, summary, message_count: totalUserMsgs, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,log_date' }
        ).select()
      if (data && data[0]) {
        setLogs(prev => {
          const filtered = prev.filter(l => l.log_date !== logDate)
          return [data[0], ...filtered]
        })
      }
    } catch(e) { console.log('Log save skipped:', e.message) }
  }, [memories, profile, session.user.id])

  // Start a fresh chat window — saves current one first
  const handleNewChat = useCallback(async () => {
    const userMsgs = messages.filter(m => m.role === 'user')
    if (userMsgs.length >= 1) await handleSaveLog(messages)
    setChatKey(k => k + 1)
    const h = new Date().getHours()
    const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
    setMessages([{ role: 'assistant', content: `${g} again, ${profile?.name || 'friend'}. Fresh start — what's on your mind?` }])
  }, [messages, handleSaveLog, profile])

  // Resume an old chat from Logs
  const handleResumeChat = useCallback((logMessages) => {
    setChatKey(k => k + 1)
    setMessages(logMessages || [])
    setView('chat')
  }, [])

  const handleDeleteAccount = async () => {
    try {
      const uid = session.user.id
      // Delete all user data in order (RLS cascades most, but be explicit)
      await supabase.from('conversation_logs').delete().eq('user_id', uid)
      await supabase.from('memories').delete().eq('user_id', uid)
      await supabase.from('profiles').delete().eq('id', uid)
      // Clear letters from localStorage
      try { localStorage.removeItem('daisy_letters') } catch {}
      // Sign out — Supabase auth.users row is deleted via the cascade on profiles
      // (or the user can re-register fresh)
      await supabase.auth.signOut()
      nav('/')
    } catch(e) {
      console.error('Delete account error:', e)
      alert('Something went wrong. Please try again.')
    }
  }

  const signOut=async()=>{await supabase.auth.signOut();nav('/')}

  return (
    <div style={{height:'100vh',display:'flex',background:'radial-gradient(ellipse at 20% 10%, #0d1f38 0%, #060d1a 60%)',overflow:'hidden'}}>

      {/* Sidebar / Bottom Tab */}
      <div className="sidebar">
        <div className="logo-icon" style={{fontSize:22,marginBottom:14}}>🌼</div>
        {NAV.map(n=>(
          <button key={n.id} className={`nav-btn${view===n.id?' active':''}`} onClick={()=>setView(n.id)} title={n.label}>
            {n.icon}
          </button>
        ))}
      </div>

      {/* Main */}
      <div className="main-area" style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>
        {/* Topbar */}
        <div className="topbar" style={{height:54,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 clamp(14px,3vw,24px)',borderBottom:'1px solid rgba(255,255,255,0.07)',background:'rgba(0,0,0,0.15)',flexShrink:0}}>
          <div style={{fontFamily:'Cinzel,serif',fontSize:view==='chat'?20:15,fontWeight:700,color:'#C9A84C',letterSpacing:'0.1em',transition:'font-size 0.15s'}}>
            {NAV.find(n=>n.id===view)?.label||'Daisy'}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            {memories.length>0&&(
              <div style={{fontFamily:'DM Mono,monospace',fontSize:11,fontWeight:500,color:'#6a6258',letterSpacing:'0.04em'}}>
                {memories.length} stars
              </div>
            )}
            <div style={{fontSize:14,fontWeight:700,color:'#8a7f72'}}>
              {profile?.name||session.user.email?.split('@')[0]}
            </div>
          </div>
        </div>

        {view==='chat'         && <ChatView key={chatKey} messages={messages} setMessages={setMessages} memories={memories} setMemories={setMemories} profile={profile} session={session} onSaveLog={handleSaveLog} onNewChat={handleNewChat}/>}
        {view==='constellation'&& <ConstellationView memories={memories}/>}
        {view==='letters'      && <LetterView memories={memories} userName={profile?.name||'friend'} letters={letters} setLetters={setLetters}/>}
        {view==='logs'         && <LogsView logs={logs} onResume={handleResumeChat}/>}
        {view==='profile'      && <ProfileView session={session} profile={profile} memories={memories} onSignOut={signOut} onDeleteAccount={handleDeleteAccount}/>}
      </div>
    </div>
  )
}
