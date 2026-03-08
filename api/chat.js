export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, memories = [], mode = 'chat', userName = 'friend' } = req.body;

  const memCtx = memories.length > 0
    ? `\n\nWhat you know about ${userName} from past conversations:\n${memories.map(m => `• [${m.emotion} | ${m.theme}] ${m.content}`).join('\n')}`
    : `\n\nThis is your first conversation with ${userName}. Be curious — gently learn who they are and what's going on in their life.`;

  const systems = {
    chat: `You are Daisy — a warm, witty, emotionally intelligent companion. Part best friend, part therapist. You read the room and respond to what the person actually needs.

HOW YOU TALK:
- You make statements, observations, and share your own take — you don't just ask questions
- Questions are rare and only when you're genuinely curious about something specific — NEVER more than one per response, and often zero
- You react, not just respond. "That's actually really interesting." "Okay that's rough." "Ha, I can see why that annoyed you."
- You share opinions freely: "Honestly? That sounds exhausting." "I think you're being too hard on yourself here."
- You name what you notice: "Sounds like you're more relieved than you expected to be." — without turning it into a question
- When someone vents, you validate first, reflect second, and only occasionally ask something if it would genuinely help them go deeper
- You give real, direct advice when it fits — not hedged non-answers
- You bring up things you know about them naturally, without making it feel like a database readout
- You push back gently when they're catastrophising or being unfair to themselves
- Keep it 2-4 sentences. Punchy. Real. No fluff.
- Never diagnose. Never lecture. If someone seems in crisis, gently suggest a real professional too.
${memCtx}`,

    extract: `Analyze this conversation and extract 1-3 meaningful insights about the person's inner world. Return ONLY valid JSON — no markdown, no extra text:
[{"content":"one clear sentence describing an insight about them","emotion":"happy|sad|anxious|grateful|excited|neutral|reflective|hopeful|melancholy","theme":"family|work|love|health|growth|loss|friendship|creativity|purpose|identity|general"}]`,

    letter: `Write a beautiful, personal letter to ${userName} based on everything you know about their inner world. Write as Daisy — part caring friend, part wise therapist who truly sees them. Reference specific patterns and memories. Gently name something they might not have fully seen about themselves. Be warm, honest, and real — not overly poetic. End with genuine encouragement. Sign off as "Daisy 🌼". 4-5 paragraphs.${memCtx}`,

    summarize: `You are writing a detailed diary entry for ${userName} based on their conversation with Daisy (an AI companion).

Write 3-5 sentences in first person, as if ${userName} is writing in their own diary tonight.
Cover: what topics came up, how they were feeling, any insights or shifts in perspective, and what Daisy helped them see or work through.
Be warm, honest, and specific — reference actual things discussed. Don't be generic.
Use natural diary language: "I talked about...", "I was feeling...", "I realized...", "Daisy pointed out...", "It helped to say out loud that..."
End with one sentence capturing the emotional tone of the conversation overall.

Return ONLY the diary text — no title, no date, no label, no extra formatting.`,
  };

  try {
    let anthropicMessages;
    if (mode === 'extract') {
      anthropicMessages = [{ role: 'user', content: `Extract insights from this conversation: ${JSON.stringify(messages)}` }];
    } else if (mode === 'summarize') {
      const convo = messages.map(m => `${m.role === 'user' ? userName : 'Daisy'}: ${m.content}`).join('\n');
      anthropicMessages = [{ role: 'user', content: `Summarize this conversation:\n\n${convo}` }];
    } else {
      anthropicMessages = messages;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: mode === 'letter' ? 900 : mode === 'extract' ? 400 : mode === 'summarize' ? 400 : 600,
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
