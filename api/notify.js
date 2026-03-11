// Vercel cron job — runs daily, nudges users who haven't visited in 2+ days
import webpush from 'web-push'

const NUDGE_MESSAGES = [
  { title: "Daisy misses you 🌼", body: "You haven't checked in for a while. I'm here whenever you're ready." },
  { title: "How are you doing? 🌼", body: "It's been a couple of days. Come tell me what's been on your mind." },
  { title: "Your stars are waiting ✦", body: "Your constellation has been quiet. Let's add some light to it." },
  { title: "A thought from Daisy 🌼", body: "Sometimes just saying things out loud helps. I'm listening." },
  { title: "Check in with yourself 🌼", body: "Two days gone. How are you actually feeling?" },
]

export default async function handler(req, res) {
  // Verify this is called by Vercel cron (or manually with secret)
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY
  const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY

  webpush.setVapidDetails(
    'mailto:daisy@yourdomain.com',
    VAPID_PUBLIC,
    VAPID_PRIVATE
  )

  try {
    // Get users whose last diary entry was 2+ days ago
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0,10)
    
    // Get all push subscriptions
    const subRes = await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?select=*`, {
      headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY }
    })
    const subscriptions = await subRes.json()

    // Get recent active users (logged diary entry today or yesterday)
    const recentRes = await fetch(
      `${SUPABASE_URL}/rest/v1/conversation_logs?log_date=gte.${twoDaysAgo}&select=user_id`,
      { headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY } }
    )
    const recentActive = await recentRes.json()
    const activeUserIds = new Set(recentActive.map(r => r.user_id))

    // Send to inactive users only
    const inactive = subscriptions.filter(s => !activeUserIds.has(s.user_id))
    let sent = 0

    for (const sub of inactive) {
      try {
        const msg = NUDGE_MESSAGES[Math.floor(Math.random() * NUDGE_MESSAGES.length)]
        await webpush.sendNotification(
          JSON.parse(sub.subscription),
          JSON.stringify({ ...msg, url: '/sanctum' })
        )
        sent++
      } catch (e) {
        // Subscription expired — remove it
        if (e.statusCode === 410) {
          await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?user_id=eq.${sub.user_id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY }
          })
        }
      }
    }

    return res.status(200).json({ sent, total: subscriptions.length })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
