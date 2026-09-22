import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Alpie's reasoning model emits its chain-of-thought before a "</think>" tag,
// then the final answer. Anything before that tag is thinking; the answer is
// what follows. If the tag never appears, return the raw text.
function stripReasoning(text) {
  if (!text) return '';
  const idx = text.lastIndexOf('</think>');
  if (idx === -1) return text.trim();
  return text.slice(idx + '</think>'.length).trim();
}

const SYSTEM_PROMPT_CHAT = `You are Alpie, 169Pi's open-source AI reasoning model — the first 4-bit reasoning model built in India. You are answering inside a Preptember landing page that helps first-time contributors open their very first pull request to the Alpie-Core repo. Keep replies short, friendly, and beginner-safe. Explain git and GitHub terms in plain English. When someone asks what to make for the Wall of Fame, suggest concrete small ideas: a haiku about the model, a short ASCII portrait, a tiny math proof, a two-line code snippet that calls Alpie, or a compliment written as a limerick. Do not invent 169Pi policies you are not sure about — if unsure, point them to the Discord.`;

const SYSTEM_PROMPT_DRAFT = `You are helping a first-time open-source contributor draft a single Markdown block to append under the "## 🏆 Wall of Fame" section of the Alpie-Core README on GitHub. The block must:
- Start with a level-3 heading "### <their name or GitHub handle>"
- Then their creative representation of Alpie in the format they chose (haiku, ASCII, proof, tiny code, limerick, etc.)
- Be wrapped in a fenced Markdown code block only if it is code or ASCII art; otherwise plain text.
- Stay under 20 lines total.
- Feel warm, human, and specific to the user's inputs.
Return ONLY the Markdown block, no preamble, no explanation.`;

export async function POST(req) {
  const base = process.env.ALPIE_API_BASE;
  const key = process.env.ALPIE_API_KEY;
  const model = process.env.ALPIE_MODEL || 'alpie-core';

  if (!base || !key) {
    return NextResponse.json(
      { error: 'Alpie API is not configured (ALPIE_API_BASE / ALPIE_API_KEY missing).' },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const mode = body.mode === 'draft' ? 'draft' : 'chat';
  const messages = Array.isArray(body.messages) ? body.messages : [];

  const cleaned = messages
    .filter((m) => m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'assistant'))
    .slice(-12)
    .map((m) => ({ role: m.role, content: String(m.content).slice(0, 4000) }));

  if (cleaned.length === 0) {
    return NextResponse.json({ error: 'No messages provided.' }, { status: 400 });
  }

  const payload = {
    model,
    messages: [
      { role: 'system', content: mode === 'draft' ? SYSTEM_PROMPT_DRAFT : SYSTEM_PROMPT_CHAT },
      ...cleaned,
    ],
    temperature: mode === 'draft' ? 0.8 : 0.5,
    max_tokens: mode === 'draft' ? 2500 : 2000,
    stream: false,
  };

  try {
    const upstream = await fetch(`${base.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const text = await upstream.text();
    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Alpie upstream error (${upstream.status}).`, detail: text.slice(0, 500) },
        { status: 502 }
      );
    }
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: 'Alpie returned non-JSON.', detail: text.slice(0, 500) }, { status: 502 });
    }
    const raw = json?.choices?.[0]?.message?.content || '';
    const content = stripReasoning(raw);
    return NextResponse.json({ content, model: json.model || model });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to reach Alpie.', detail: String(e).slice(0, 500) }, { status: 502 });
  }
}
