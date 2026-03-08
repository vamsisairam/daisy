// api/verify-payment.js
// Verifies Razorpay payment signature and upgrades user to Pro in Supabase

import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId } = req.body

  // Verify signature
  const body = razorpay_order_id + '|' + razorpay_payment_id
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex')

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ error: 'Invalid payment signature' })
  }

  // Upgrade user in Supabase
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY // service role key — can bypass RLS
  )

  const proUntil = new Date()
  proUntil.setMonth(proUntil.getMonth() + 1)

  const { error } = await supabase
    .from('profiles')
    .update({
      is_pro: true,
      pro_until: proUntil.toISOString(),
      payment_id: razorpay_payment_id,
    })
    .eq('id', userId)

  if (error) return res.status(500).json({ error: error.message })

  return res.json({ success: true, proUntil: proUntil.toISOString() })
}
