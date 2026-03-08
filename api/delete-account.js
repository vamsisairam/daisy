export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { user_id } = req.body
  if (!user_id) return res.status(400).json({ error: 'user_id required' })

  // Verify the request is from the actual logged-in user via their JWT
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' })

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  try {
    // First verify the JWT matches the user_id being deleted
    const verifyRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': authHeader,
        'apikey': process.env.VITE_SUPABASE_ANON_KEY,
      }
    })
    const verifyData = await verifyRes.json()
    if (!verifyRes.ok || verifyData.id !== user_id) {
      return res.status(403).json({ error: 'Forbidden — user mismatch' })
    }

    // Delete user data from tables first
    const headers = {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
    }
    await fetch(`${SUPABASE_URL}/rest/v1/conversation_logs?user_id=eq.${user_id}`, { method: 'DELETE', headers })
    await fetch(`${SUPABASE_URL}/rest/v1/memories?user_id=eq.${user_id}`, { method: 'DELETE', headers })
    await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user_id}`, { method: 'DELETE', headers })

    // Delete the auth user — this is the key step, requires service role
    const deleteRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user_id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
      }
    })

    if (!deleteRes.ok) {
      const err = await deleteRes.json()
      throw new Error(err.message || 'Failed to delete auth user')
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Delete account error:', error)
    return res.status(500).json({ error: error.message })
  }
}
