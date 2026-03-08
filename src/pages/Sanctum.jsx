import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

const EMOTION_COLOR = {
  happy: '#C9A84C', grateful: '#52c77a', excited: '#e87676',
  neutral: '#8899aa', reflective: '#9b7fde', sad: '#4a9eff',
  anxious: '#ff8c42', hopeful: '#5ec8c8', melancholy: '#7890c0',
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
    const bgStars = Array.from({length:120},()=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.2,phase:Math.random()*Math.PI*2}))
    let t=0
    const draw=()=>{
      ctx.clearRect(0,0,W,H)
      bgStars.forEach(s=>{ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fillStyle=`rgba(255,255,255,${0.2+0.15*Math.sin(t*0.3+s.phase)})`;ctx.fill()})
      for(let i=0;i<stars.length;i++) for(let j=i+1;j<stars.length;j++){const d=Math.sqrt((stars[i].x-stars[j].x)**2+(stars[i].y-stars[j].y)**2);if(d<130){ctx.beginPath();ctx.moveTo(stars[i].x,stars[i].y);ctx.lineTo(stars[j].x,stars[j].y);ctx.strokeStyle=`rgba(255,255,255,${0.06*(1-d/130)})`;ctx.lineWidth=0.5;ctx.stroke()}}
      stars.forEach((s,i)=>{const pulse=1+0.3*Math.sin(t*0.8+s.phase);const isH=hoveredRef.current===i;const r=isH?s.r*2.5:s.r*pulse;const g=ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,r*4);g.addColorStop(0,s.color+'55');g.addColorStop(1,'transparent');ctx.beginPath();ctx.arc(s.x,s.y,r*4,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();ctx.beginPath();ctx.arc(s.x,s.y,r,0,Math.PI*2);ctx.fillStyle=isH?s.color:s.color+'dd';ctx.fill()})
      t+=0.025;rafRef.current=requestAnimationFrame(draw)
    }
    draw()
    return ()=>cancelAnimationFrame(rafRef.current)
  },[memories])

  const handleMouseMove=(e)=>{
    const rect=canvasRef.current.getBoundingClientRect()
    const mx=e.clientX-rect.left,my=e.clientY-rect.top
    let found=null
    starsRef.current.forEach((s,i)=>{if(Math.sqrt((mx-s.x)**2+(my-s.y)**2)<18) found=i})
    hoveredRef.current=found
    if(found!==null){const s=starsRef.current[found];setTooltip({x:mx,y:my,memory:s.memory,color:s.color})}else setTooltip(null)
  }

  if(memories.length===0) return (
    <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'#7a7065',textAlign:'center',padding:40}}>
      <div style={{fontSize:52,marginBottom:20,opacity:0.25}}>✦</div>
      <div style={{fontFamily:'Cinzel,serif',fontSize:18,fontWeight:700,marginBottom:10,color:'#9a8870'}}>Your constellation awaits</div>
      <div style={{fontStyle:'italic',fontSize:16,maxWidth:280,lineHeight:1.7}}>Chat with Daisy — after a few conversations, your stars will appear here</div>
    </div>
  )

  return (
    <div style={{flex:1,position:'relative',overflow:'hidden'}}>
      <canvas ref={canvasRef} onMouseMove={handleMouseMove} onMouseLeave={()=>{hoveredRef.current=null;setTooltip(null)}} style={{width:'100%',height:'100%',cursor:tooltip?'pointer':'crosshair'}}/>
      {tooltip&&<div style={{position:'absolute',left:Math.min(tooltip.x+16,window.innerWidth-240),top:tooltip.y-20,background:'rgba(5,12,24,0.96)',border:`1px solid ${tooltip.color}44`,borderRadius:6,padding:'12px 16px',maxWidth:230,pointerEvents:'none',backdropFilter:'blur(12px)',zIndex:10,boxShadow:'0 8px 32px rgba(0,0,0,0.5)'}}>
        <div style={{fontFamily:'DM Mono,monospace',fontSize:11,fontWeight:500,color:tooltip.color,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.08em'}}>{tooltip.memory.emotion} · {tooltip.memory.theme}</div>
        <div style={{fontSize:15,color:'#c8b898',fontStyle:'italic',lineHeight:1.6}}>{tooltip.memory.content}</div>
      </div>}
      <div style={{position:'absolute',bottom:24,left:0,right:0,display:'flex',justifyContent:'center',gap:18,flexWrap:'wrap',pointerEvents:'none'}}>
        {Object.entries(EMOTION_COLOR).slice(0,6).map(([emo,col])=>(
          <div key={emo} style={{display:'flex',alignItems:'center',gap:6,fontFamily:'DM Mono,monospace',fontSize:11,color:'#7a7065'}}>
            <div style={{width:7,height:7,borderRadius:'50%',background:col}}/>{emo}
          </div>
        ))}
      </div>
    </div>
  )
}

function LetterView({ memories, userName, letters, setLetters }) {
  const [generating, setGenerating] = useState(false)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')

  const generateLetter = async () => {
    setError(''); setGenerating(true)
    try {
      const memoryContext = memories.map(m=>`${m.emotion} feeling about ${m.theme}: ${m.content}`).join('\n')
      const text = await callDaisy({
        messages:[{role:'user',content:`Write me a personal letter based on my memories:\n${memoryContext}`}],
        memories, mode:'letter', userName,
      })
      const letter={id:Date.now(),text,date:new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}
      const updated=[letter,...letters]
      setLetters(updated)
      setSelected(letter)
      try{localStorage.setItem('daisy_letters',JSON.stringify(updated))}catch{}
    } catch(e){setError('Daisy is gathering her thoughts — please try again in a moment.');console.error(e)}
    finally{setGenerating(false)}
  }

  if(selected) return (
    <div style={{flex:1,overflowY:'auto',padding:'clamp(24px,4vw,48px)'}}>
      <div style={{maxWidth:680,margin:'0 auto'}}>
        <button onClick={()=>setSelected(null)} style={{background:'none',border:'none',color:'#C9A84C',cursor:'pointer',fontSize:14,fontWeight:600,fontFamily:'DM Mono,monospace',letterSpacing:'0.05em',marginBottom:36,padding:0}}>← Back</button>
        <div style={{fontFamily:'DM Mono,monospace',fontSize:11,fontWeight:500,color:'#7a7065',letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:36}}>Letter from Daisy · {selected.date}</div>
        <div style={{fontSize:18,lineHeight:1.95,color:'#c8b898',fontStyle:'italic',whiteSpace:'pre-wrap'}}>{selected.text}</div>
      </div>
    </div>
  )

  return (
    <div style={{flex:1,overflowY:'auto',padding:'clamp(24px,4vw,48px)'}}>
      <div style={{maxWidth:680,margin:'0 auto'}}>
        <div style={{fontFamily:'Cinzel,serif',fontSize:22,fontWeight:700,color:'#C9A84C',marginBottom:10}}>Letters from Daisy</div>
        <div style={{color:'#7a7065',fontSize:16,fontStyle:'italic',marginBottom:10,lineHeight:1.7}}>
          {memories.length<3
            ? <><strong style={{color:'#a89880',fontStyle:'normal'}}>{3-memories.length} more conversation{3-memories.length!==1?'s':''}</strong> needed to unlock your first letter</>
            : 'Daisy will write you a personal letter based on <strong>everything she remembers</strong> about you'}
        </div>
        {error&&<div style={{color:'#e87676',fontSize:14,fontWeight:600,fontStyle:'italic',marginBottom:18}}>{error}</div>}

        <button onClick={generateLetter} disabled={generating||memories.length<3}
          style={{padding:'13px 32px',background:'transparent',border:`1px solid ${memories.length>=3?'#C9A84C88':'rgba(255,255,255,0.1)'}`,borderRadius:4,color:memories.length>=3?'#C9A84C':'#7a7065',fontFamily:'Cinzel,serif',fontSize:13,fontWeight:700,letterSpacing:'0.15em',textTransform:'uppercase',cursor:memories.length>=3&&!generating?'pointer':'not-allowed',transition:'all 0.3s',marginBottom:44}}>
          {generating?'🌼 Writing your letter...':'🌼 Write Me a Letter'}
        </button>

        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {letters.map(l=>(
            <div key={l.id} onClick={()=>setSelected(l)}
              style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:6,padding:'18px 22px',cursor:'pointer',transition:'all 0.2s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='#C9A84C44';e.currentTarget.style.background='rgba(201,168,76,0.04)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.07)';e.currentTarget.style.background='rgba(255,255,255,0.03)'}}>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:11,fontWeight:500,color:'#7a7065',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:8}}>{l.date}</div>
              <div style={{fontSize:15,color:'#a89880',fontStyle:'italic',lineHeight:1.6}}>{l.text.slice(0,120)}…</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ProfileView({ session, profile, memories, onSignOut }) {
  const themes=[...new Set(memories.map(m=>m.theme))]
  const topEmotion=Object.entries(memories.reduce((a,m)=>{a[m.emotion]=(a[m.emotion]||0)+1;return a},{})).sort((a,b)=>b[1]-a[1])[0]
  return (
    <div style={{flex:1,overflowY:'auto',padding:'clamp(24px,4vw,48px)'}}>
      <div style={{maxWidth:560,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:44}}>
          <div style={{width:76,height:76,borderRadius:'50%',background:'rgba(201,168,76,0.1)',border:'1px solid #C9A84C44',display:'flex',alignItems:'center',justifyContent:'center',fontSize:30,margin:'0 auto 18px',animation:'pulse 3s ease infinite'}}>🌼</div>
          <div style={{fontFamily:'Cinzel,serif',fontSize:24,fontWeight:700,color:'#e8dcc8',marginBottom:6}}>{profile?.name||'Wanderer'}</div>
          <div style={{fontFamily:'DM Mono,monospace',fontSize:12,color:'#7a7065',letterSpacing:'0.08em'}}>{session.user.email}</div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:36}}>
          {[
            {label:'Memories Woven',value:memories.length,icon:'✦'},
            {label:'Member Since',value:new Date(session.user.created_at).toLocaleDateString('en-IN',{month:'long',year:'numeric'}),icon:'◎'},
            {label:'Themes Explored',value:themes.length||'—',icon:'◈'},
            {label:'Dominant Feeling',value:topEmotion?topEmotion[0]:'—',icon:'◉',color:topEmotion?EMOTION_COLOR[topEmotion[0]]:undefined},
          ].map((s,i)=>(
            <div key={i} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:6,padding:'22px 16px',textAlign:'center'}}>
              <div style={{fontSize:22,marginBottom:10}}>{s.icon}</div>
              <div style={{fontFamily:'Cinzel,serif',fontSize:20,fontWeight:700,color:s.color||'#C9A84C',marginBottom:6}}>{s.value}</div>
              <div style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'#7a7065',letterSpacing:'0.06em',textTransform:'uppercase'}}>{s.label}</div>
            </div>
          ))}
        </div>

        {themes.length>0&&<div style={{marginBottom:36}}>
          <div style={{fontFamily:'DM Mono,monospace',fontSize:11,fontWeight:500,color:'#7a7065',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:14}}>Your Themes</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:9}}>{themes.map(t=><span key={t} style={{padding:'6px 16px',background:'rgba(201,168,76,0.06)',border:'1px solid #C9A84C33',borderRadius:20,fontSize:13,fontWeight:600,color:'#C9A84C',fontFamily:'DM Mono,monospace'}}>{t}</span>)}</div>
        </div>}

        <button onClick={onSignOut} style={{width:'100%',padding:14,background:'transparent',border:'1px solid rgba(255,255,255,0.08)',borderRadius:4,color:'#7a7065',fontFamily:'Cinzel,serif',fontSize:13,fontWeight:600,letterSpacing:'0.15em',textTransform:'uppercase',cursor:'pointer',transition:'all 0.2s'}}
          onMouseEnter={e=>{e.target.style.borderColor='rgba(232,118,118,0.3)';e.target.style.color='#e87676'}}
          onMouseLeave={e=>{e.target.style.borderColor='rgba(255,255,255,0.08)';e.target.style.color='#7a7065'}}>
          Leave Sanctum
        </button>
      </div>
    </div>
  )
}

function ChatView({ messages, setMessages, memories, setMemories, profile, session }) {
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const userName = profile?.name || 'friend'

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:'smooth'})},[messages,thinking])

  const extractMemories = useCallback(async(msgs)=>{
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
    const updated=[...messages,{role:'user',content:text}]
    setMessages(updated)
    setThinking(true)
    try{
      const reply=await callDaisy({messages:updated,memories,mode:'chat',userName})
      const withReply=[...updated,{role:'assistant',content:reply}]
      setMessages(withReply)
      if(updated.filter(m=>m.role==='user').length%3===0) extractMemories(withReply)
    }catch{
      setMessages(prev=>[...prev,{role:'assistant',content:'Something flickered in the ether. Try again? 🌼'}])
    }finally{setThinking(false);inputRef.current?.focus()}
  }

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{flex:1,overflowY:'auto',padding:'clamp(16px,3vw,28px) clamp(16px,3vw,32px)'}}>
        {messages.map((m,i)=>(
          <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start',marginBottom:18,animation:'fadeUp 0.35s ease both'}}>
            {m.role==='assistant'&&<div style={{width:32,height:32,borderRadius:'50%',background:'rgba(201,168,76,0.12)',border:'1px solid #C9A84C44',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,marginRight:12,flexShrink:0,marginTop:4}}>🌼</div>}
            <div style={{maxWidth:'72%',padding:'14px 20px',borderRadius:m.role==='user'?'18px 18px 4px 18px':'18px 18px 18px 4px',background:m.role==='user'?'rgba(201,168,76,0.09)':'rgba(255,255,255,0.05)',border:`1px solid ${m.role==='user'?'#C9A84C28':'rgba(255,255,255,0.08)'}`,fontSize:17,lineHeight:1.75,color:'#d8c8ac',fontStyle:m.role==='assistant'?'italic':'normal',fontWeight:m.role==='user'?600:400,boxShadow:'0 2px 12px rgba(0,0,0,0.15)'}}>
              {m.content}
            </div>
          </div>
        ))}
        {thinking&&<div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18,animation:'fadeIn 0.3s ease both'}}>
          <div style={{width:32,height:32,borderRadius:'50%',background:'rgba(201,168,76,0.12)',border:'1px solid #C9A84C44',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>🌼</div>
          <div style={{display:'flex',gap:6,padding:'12px 18px',borderRadius:'18px 18px 18px 4px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)'}}>
            {[0,0.3,0.6].map((d,i)=><div key={i} style={{width:6,height:6,borderRadius:'50%',background:'#C9A84C',opacity:0.6,animation:`twinkle 1s ease ${d}s infinite`}}/>)}
          </div>
        </div>}
        <div ref={bottomRef}/>
      </div>

      <div style={{padding:'14px clamp(12px,3vw,24px)',borderTop:'1px solid rgba(255,255,255,0.06)',display:'flex',gap:12,alignItems:'flex-end',background:'rgba(0,0,0,0.18)'}}>
        <textarea ref={inputRef} rows={1} value={input}
          placeholder={`Talk to Daisy, ${userName}…`}
          onChange={e=>{setInput(e.target.value);e.target.style.height='auto';e.target.style.height=Math.min(e.target.scrollHeight,110)+'px'}}
          onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}}
          style={{flex:1,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:14,padding:'13px 18px',color:'#e8dcc8',fontSize:17,fontWeight:400,resize:'none',minHeight:50,transition:'border-color 0.2s',lineHeight:1.6}}
          onFocus={e=>e.target.style.borderColor='#C9A84C66'}
          onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'}
        />
        <button onClick={send} disabled={!input.trim()||thinking}
          style={{width:50,height:50,borderRadius:'50%',flexShrink:0,background:input.trim()&&!thinking?'rgba(201,168,76,0.18)':'rgba(255,255,255,0.05)',border:`1px solid ${input.trim()&&!thinking?'#C9A84C77':'rgba(255,255,255,0.06)'}`,color:input.trim()&&!thinking?'#C9A84C':'#7a7065',cursor:input.trim()&&!thinking?'pointer':'not-allowed',fontSize:20,transition:'all 0.2s',display:'flex',alignItems:'center',justifyContent:'center'}}>
          ↑
        </button>
      </div>
    </div>
  )
}

const NAV=[
  {id:'chat',icon:'🌼',label:'Converse'},
  {id:'constellation',icon:'✦',label:'Constellation'},
  {id:'letters',icon:'✉',label:'Letters'},
  {id:'profile',icon:'◉',label:'Profile'},
]

export default function Sanctum({ session }) {
  const[view,setView]=useState('chat')
  const[profile,setProfile]=useState(null)
  const[memories,setMemories]=useState([])
  const[messages,setMessages]=useState([])
  const[letters,setLetters]=useState([])
  const nav=useNavigate()

  useEffect(()=>{
    supabase.from('profiles').select('*').eq('id',session.user.id).single()
      .then(({data})=>{if(data) setProfile(data); else supabase.from('profiles').insert({id:session.user.id,name:'Wanderer'})})
    supabase.from('memories').select('*').eq('user_id',session.user.id).order('created_at',{ascending:false})
      .then(({data})=>{if(data) setMemories(data)})
    try{const s=localStorage.getItem('daisy_letters');if(s) setLetters(JSON.parse(s))}catch{}
  },[session.user.id])

  useEffect(()=>{
    if(!profile) return
    const hour=new Date().getHours()
    const greeting=hour<12?'Good morning':hour<17?'Good afternoon':'Good evening'
    const memNote=memories.length>0?` I've been holding ${memories.length} of your stars.`:' Your constellation is waiting to be born.'
    setMessages([{role:'assistant',content:`${greeting}, ${profile.name||'friend'}.${memNote} What's on your mind?`}])
  },[profile?.id])

  const signOut=async()=>{await supabase.auth.signOut();nav('/')}

  return (
    <div style={{height:'100vh',display:'flex',background:'radial-gradient(ellipse at 20% 10%, #0d1f35 0%, #050c18 60%)'}}>
      {/* Sidebar — desktop left, mobile bottom */}
      <div className="sidebar" style={{width:68,display:'flex',flexDirection:'column',alignItems:'center',paddingTop:24,paddingBottom:24,borderRight:'1px solid rgba(255,255,255,0.06)',gap:6,background:'rgba(0,0,0,0.22)',flexShrink:0}}>
        <div className="logo-icon" style={{fontSize:20,marginBottom:18}}>🌼</div>
        {NAV.map(n=>(
          <button key={n.id} onClick={()=>setView(n.id)} title={n.label}
            style={{width:44,height:44,borderRadius:10,border:'none',background:view===n.id?'rgba(201,168,76,0.14)':'transparent',color:view===n.id?'#C9A84C':'#7a7065',cursor:'pointer',fontSize:18,transition:'all 0.2s',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',flexShrink:0}}
            onMouseEnter={e=>{if(view!==n.id){e.currentTarget.style.background='rgba(255,255,255,0.05)';e.currentTarget.style.color='#a89880'}}}
            onMouseLeave={e=>{if(view!==n.id){e.currentTarget.style.background='transparent';e.currentTarget.style.color='#7a7065'}}}>
            {n.icon}
            {view===n.id&&<div style={{position:'absolute',left:0,top:'50%',transform:'translateY(-50%)',width:3,height:18,background:'#C9A84C',borderRadius:2}}/>}
          </button>
        ))}
      </div>

      {/* Main */}
      <div className="main-area" style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        {/* Topbar */}
        <div style={{height:56,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 clamp(16px,3vw,28px)',borderBottom:'1px solid rgba(255,255,255,0.06)',background:'rgba(0,0,0,0.12)',flexShrink:0}}>
          <div style={{fontFamily:'Cinzel,serif',fontSize:14,fontWeight:700,color:'#C9A84C',letterSpacing:'0.12em'}}>
            {NAV.find(n=>n.id===view)?.label||'Daisy'}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            {memories.length>0&&<div style={{fontFamily:'DM Mono,monospace',fontSize:11,fontWeight:500,color:'#7a7065',letterSpacing:'0.06em'}}>{memories.length} stars</div>}
            <div style={{fontFamily:'Cinzel,serif',fontSize:13,fontWeight:600,color:'#9a8860'}}>{profile?.name||session.user.email?.split('@')[0]}</div>
          </div>
        </div>

        {view==='chat'&&<ChatView messages={messages} setMessages={setMessages} memories={memories} setMemories={setMemories} profile={profile} session={session}/>}
        {view==='constellation'&&<ConstellationView memories={memories}/>}
        {view==='letters'&&<LetterView memories={memories} userName={profile?.name||'friend'} letters={letters} setLetters={setLetters}/>}
        {view==='profile'&&<ProfileView session={session} profile={profile} memories={memories} onSignOut={signOut}/>}
      </div>
    </div>
  )
}
