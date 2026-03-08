// api/create-order.js
// Creates a Razorpay order for ₹99/month Pro subscription

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { userId } = req.body
  if (!userId) return res.status(400).json({ error: 'Missing userId' })

  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  const orderData = {
    amount: 9900, // ₹99 in paise
    currency: 'INR',
    receipt: `daisy_pro_${userId}_${Date.now()}`,
    notes: { userId, plan: 'pro_monthly' },
  }

  const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64')

  try {
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify(orderData),
    })

    const order = await response.json()
    if (order.error) throw new Error(order.error.description)

    return res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
