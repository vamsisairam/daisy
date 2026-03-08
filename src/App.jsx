import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Sanctum from './pages/Sanctum'

function ProtectedRoute({ session, children }) {
  if (!session) return <Navigate to="/auth" replace />
  return children
}

const Loader = () => (
  <div style={{
    height: '100vh', background: '#050c18', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    color: '#C9A84C', fontFamily: 'Cinzel, serif', fontSize: 28,
    animation: 'pulse 2s ease infinite',
  }}>
    ✦
  </div>
)

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <Loader />

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={session ? <Navigate to="/sanctum" /> : <Landing />} />
        <Route path="/auth" element={session ? <Navigate to="/sanctum" /> : <Auth />} />
        <Route path="/sanctum" element={
          <ProtectedRoute session={session}>
            <Sanctum session={session} />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
