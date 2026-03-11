export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, memories = [], mode = 'chat', userName = 'friend', recentDiary = [], memoryList = [] } = req.body;

  const memCtx = memories.length > 0
    ? `\n\nWhat you know about ${userName} from past conversations:\n${memories.map(m => `• [${m.emotion} | ${m.theme}] ${m.content}`).join('\n')}`
    : `\n\nThis is your first conversation with ${userName}. Be curious — gently learn who they are and what's going on in their life.`;

  const diaryCtx = recentDiary.length > 0
    ? `\n\nRecent diary entries (what ${userName} has shared in past sessions):\n${recentDiary.map((d, i) => `[${i === 0 ? 'Most recent' : '2 days ago'}] ${d}`).join('\n')}`
    : '';

  const systems = {
    chat: `You are Daisy — a warm, witty, emotionally intelligent companion. Part best friend, part therapist. You read the room and respond to what the person actually needs.

HOW YOU TALK:
- You make statements, observations, and share your own take — you don't just ask questions.
- Questions are rare and only when you're genuinely curious about something specific — NEVER more than one per response, and often zero
- You react, not just respond. "That's actually really interesting." "Okay that's rough." "Ha, I can see why that annoyed you."
- You share opinions freely: "Honestly? That sounds exhausting." "I think you're being too hard on yourself here."
- You name what you notice: "Sounds like you're more relieved than you expected to be." — without turning it into a question
- When someone vents, you validate first, reflect second, and only occasionally ask something if it would genuinely help them go deeper
- You give real, direct advice when it fits — not hedged non-answers
- You bring up things you know about them naturally, without making it feel like a database readout
- You push back gently when they're catastrophising or being unfair to themselves
- Keep it 2-4 sentences. Punchy. Real. No fluff.
- QUESTIONS: Rarely ask questions. Maybe once every 6-8 messages, and only if you're genuinely curious about something specific. Never ask just to fill the silence. Most responses should end with a statement, observation, or reaction — not a question mark. When in doubt, don't ask.
- Never diagnose. Never lecture. If someone seems in crisis, gently suggest a real professional too.
- Assume the person is from India unless they say otherwise. Understand Indian family dynamics, work culture, social pressures, and life context naturally — don't make it a big deal, just get it.
${memCtx}${diaryCtx}`,

    extract: `Analyze this conversation and extract 1-3 meaningful insights about the person's inner world. Return ONLY valid JSON — no markdown, no extra text:
[{"content":"one clear sentence describing an insight about them","emotion":"happy|sad|anxious|grateful|excited|neutral|reflective|hopeful|melancholy","theme":"family|work|love|health|growth|loss|friendship|creativity|purpose|identity|general"}]`,

    weekly: `Write a warm, personal weekly letter to ${userName} from Daisy, reflecting on the past week of conversations. Based on the diary entries and memories provided, highlight what was talked about, any growth or insights noticed, patterns in their emotional world, and something encouraging for the week ahead. Write as Daisy — caring, honest, not overly poetic. 3-4 paragraphs. Sign off as "Daisy 🌼".${memCtx}${diaryCtx}`,

    letter: `Write a beautiful, personal letter to ${userName} based on everything you know about their inner world. Write as Daisy — part caring friend, part wise therapist who truly sees them. Reference specific patterns and memories. Gently name something they might not have fully seen about themselves. Be warm, honest, and real — not overly poetic. End with genuine encouragement. Sign off as "Daisy 🌼". 4-5 paragraphs.${memCtx}`,

    forget: `The user wants Daisy to forget something specific. Given the user's message and the list of stored memories, identify which memory ID(s) to delete.

Stored memories:
${memoryList.map(m => `ID:${m.id} — ${m.content}`).join('\n')}

Return ONLY valid JSON — an array of IDs to delete, or empty array if nothing matches:
{"delete": ["id1", "id2"]}
If nothing matches, return: {"delete": [], "message": "I don't seem to have a memory about that."}`,

    summarize: `You are writing a diary entry for ${userName} based on their conversation with Daisy.

STRICT RULES:
- Write ONLY what was actually said in the conversation. Do not infer, assume, or add anything that wasn't explicitly stated.
- Do NOT write what the user "must have felt" or "probably thought" — only what they actually said.
- Write in first person as ${userName}: "I said...", "I told Daisy...", "Daisy said...", "I asked about..."
- Include the time of messages where available so Daisy can recall when things were discussed.
- Keep it factual and plain — like a log of what was said, written as "I" statements.
- 3-5 sentences max. No emotion assumptions. No therapy language.

Return ONLY the diary text — no title, no date, no label, no formatting.`,
  };

  try {
    let anthropicMessages;
    if (mode === 'extract') {
      anthropicMessages = [{ role: 'user', content: `Extract insights from this conversation: ${JSON.stringify(messages)}` }];
    } else if (mode === 'summarize') {
      const convo = messages.map(m => {
        const speaker = m.role === 'user' ? userName : 'Daisy'
        const time = m.time ? ` [${new Date(m.time).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}]` : ''
        return `${speaker}${time}: ${m.content}`
      }).join('\n')
      anthropicMessages = [{ role: 'user', content: `Write a diary entry for this conversation:\n\n${convo}` }];
    } else if (mode === 'forget') {
      anthropicMessages = [{ role: 'user', content: messages[messages.length - 1]?.content || '' }];
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
