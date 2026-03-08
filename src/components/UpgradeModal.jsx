// src/components/UpgradeModal.jsx
// Shows when free user hits 30 message limit OR clicks "Upgrade"

export default function UpgradeModal({ onClose, onSuccess, session, profile }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePayment = async () => {
    setLoading(true)
    setError('')

    try {
      // 1. Create Razorpay order via our API
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id }),
      })
      const { orderId, amount, currency, keyId, error: orderErr } = await res.json()
      if (orderErr) throw new Error(orderErr)

      // 2. Open Razorpay checkout popup
      const options = {
        key: keyId,
        amount,
        currency,
        name: 'Daisy 🌼',
        description: 'Pro — Unlimited memories, forever',
        order_id: orderId,
        prefill: {
          email: session.user.email,
          name: profile?.name || '',
        },
        theme: { color: '#C9A84C' },
        handler: async (response) => {
          // 3. Verify payment on server
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...response,
              userId: session.user.id,
            }),
          })
          const result = await verifyRes.json()
          if (result.success) {
            onSuccess()
          } else {
            setError('Payment verification failed. Contact support.')
          }
          setLoading(false)
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (response) => {
        setError('Payment failed: ' + response.error.description)
        setLoading(false)
      })
      rzp.open()

    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(5,12,24,0.92)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(8px)',
      animation: 'fadeIn 0.2s ease both',
      padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        background: 'linear-gradient(160deg, #0d1f35, #091220)',
        border: '1px solid rgba(201,168,76,0.2)',
        borderRadius: 12,
        padding: '44px 40px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        animation: 'fadeUp 0.3s ease both',
        textAlign: 'center',
        position: 'relative',
      }}>
        {onClose && (
          <button onClick={onClose} style={{
            position: 'absolute', top: 16, right: 16,
            background: 'none', border: 'none',
            color: '#7a7065', cursor: 'pointer', fontSize: 18,
          }}>×</button>
        )}

        <div style={{ fontSize: 40, marginBottom: 16 }}>🌼</div>

        <div style={{
          fontFamily: 'Cinzel, serif', fontSize: 22,
          color: '#e8dcc8', marginBottom: 8,
        }}>
          Bloom Fully with Pro
        </div>

        <div style={{
          color: '#7a7065', fontSize: 14, fontStyle: 'italic',
          lineHeight: 1.7, marginBottom: 32,
        }}>
          You've reached your free limit.<br />
          Upgrade to keep your constellation growing.
        </div>

        {/* Feature comparison */}
        <div style={{ marginBottom: 32, textAlign: 'left' }}>
          {[
            { label: 'Messages per month', free: '30', pro: 'Unlimited' },
            { label: 'Personal letters from Daisy', free: '✗', pro: '✓' },
            { label: 'Memory constellation', free: '✓', pro: '✓' },
            { label: 'Emotional pattern insights', free: '✗', pro: '✓' },
          ].map((row, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr auto auto',
              gap: 16, padding: '10px 0',
              borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: 13, color: '#a89880' }}>{row.label}</span>
              <span style={{ fontSize: 12, color: '#7a7065', fontFamily: 'DM Mono, monospace', textAlign: 'center', minWidth: 40 }}>{row.free}</span>
              <span style={{ fontSize: 12, color: '#C9A84C', fontFamily: 'DM Mono, monospace', textAlign: 'center', minWidth: 60, fontWeight: 600 }}>{row.pro}</span>
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 16, marginTop: 8 }}>
            <span />
            <span style={{ fontSize: 11, color: '#7a7065', fontFamily: 'DM Mono, monospace', textAlign: 'center' }}>Free</span>
            <span style={{ fontSize: 11, color: '#C9A84C', fontFamily: 'DM Mono, monospace', textAlign: 'center' }}>Pro</span>
          </div>
        </div>

        {error && (
          <div style={{ color: '#e87676', fontSize: 13, fontStyle: 'italic', marginBottom: 16 }}>{error}</div>
        )}

        <button
          onClick={handlePayment}
          disabled={loading}
          style={{
            width: '100%', padding: '15px',
            background: loading ? 'rgba(201,168,76,0.1)' : 'linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.08))',
            border: '1px solid #C9A84C88',
            borderRadius: 6,
            color: '#C9A84C',
            fontFamily: 'Cinzel, serif',
            fontSize: 14,
            letterSpacing: '0.1em',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s',
            marginBottom: 12,
          }}
          onMouseEnter={e => { if (!loading) e.target.style.background = 'rgba(201,168,76,0.2)' }}
          onMouseLeave={e => { if (!loading) e.target.style.background = 'linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.08))' }}
        >
          {loading ? '✦ Opening payment...' : 'Upgrade to Pro — ₹99/month'}
        </button>

        <div style={{ fontSize: 11, color: '#5a5045', fontFamily: 'DM Mono, monospace', letterSpacing: '0.05em' }}>
          Secured by Razorpay · Cancel anytime
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
