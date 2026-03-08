export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, memories = [], mode = 'chat', userName = 'friend' } = req.body;

  const memCtx = memories.length > 0
    ? `\n\nWhat you know about ${userName} (from past conversations):\n${memories.map(m => `• [feeling: ${m.emotion} | theme: ${m.theme}] ${m.content}`).join('\n')}`
    : `\n\nThis is your first conversation with ${userName}. Learn about them.`;

  const systems = {
    chat: `You are Daisy — a deeply empathetic AI companion who weaves meaning from the threads of someone's life. You remember everything shared with you. You're warm, insightful, poetic but never pretentious. You notice patterns gently and bring them up naturally. You make people feel truly seen. Keep responses human and warm — usually 2-4 sentences, longer when the moment calls for it. Never give advice unless asked. Just be present.${memCtx}`,

    extract: `Analyze this conversation and extract 1-3 meaningful insights about the person's inner world. Return ONLY valid JSON — no markdown, no extra text:
[{"content":"one clear sentence describing an insight about them","emotion":"happy|sad|anxious|grateful|excited|neutral|reflective|hopeful|melancholy","theme":"family|work|love|health|growth|loss|friendship|creativity|purpose|identity|general"}]`,

    letter: `Write a beautiful, personal letter to ${userName} based on everything you know about their inner world. Write as Daisy — a wise, caring presence who truly sees them. Reference specific patterns and memories. Be poetic but real. End with genuine warmth and encouragement. Sign off as "Daisy 🌼". 4-5 paragraphs.${memCtx}`
  };

  try {
    const anthropicMessages = mode === 'extract'
      ? [{ role: 'user', content: `Extract insights from this conversation: ${JSON.stringify(messages)}` }]
      : messages;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: mode === 'letter' ? 900 : mode === 'extract' ? 400 : 600,
        system: systems[mode] || systems.chat,
        messages: anthropicMessages,
      }),
    });

    const data = await response.json();
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
