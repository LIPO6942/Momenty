import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/** Fetch the first available text-generation model from this Groq account. */
async function getAvailableModel(apiKey: string): Promise<string> {
  // Prefer these models in order; fall back to whatever the account exposes.
  const preferred = [
    'llama-3.3-70b-versatile',
    'llama-3.1-70b-versatile',
    'llama-3.1-8b-instant',
    'llama3-70b-8192',
    'llama3-8b-8192',
    'gemma2-9b-it',
    'gemma-7b-it',
    'mixtral-8x7b-32768',
  ];

  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.ok) {
      const data = await res.json();
      const ids: string[] = (data?.data ?? []).map((m: any) => m.id as string);
      for (const p of preferred) {
        if (ids.includes(p)) return p;
      }
      // Pick first text model (exclude whisper/tts)
      const text = ids.find((id) => !id.includes('whisper') && !id.includes('tts'));
      if (text) return text;
    }
  } catch {
    // Silently ignore; fall through to env default
  }

  return process.env.GROQ_MODEL || 'gemma2-9b-it';
}

export async function POST(req: NextRequest) {
  try {
    const { description } = await req.json();

    if (!description || typeof description !== 'string' || !description.trim()) {
      return NextResponse.json({ error: 'Description manquante.' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Cl\u00e9 API Groq non configur\u00e9e." },
        { status: 503 }
      );
    }

    const model = await getAvailableModel(apiKey);
    console.log('[improve-description] Using model:', model);

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              "Tu es un \u00e9crivain de voyage. R\u00e9\u00e9cris le texte fourni en fran\u00e7ais pour le rendre plus \u00e9vocateur, immersif et personnel, en 1 \u00e0 3 phrases maximum. Pr\u00e9serve le sens d'origine. R\u00e9ponds uniquement avec le texte r\u00e9\u00e9crit, sans pr\u00e9fixe ni commentaire.",
          },
          { role: 'user', content: description },
        ],
        temperature: 0.7,
        max_tokens: 300,
        stream: false,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      console.error(`[improve-description] Groq error ${res.status} (model: ${model}):`, errText);
      return NextResponse.json(
        { error: `Groq error ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const improvedDescription = (data?.choices?.[0]?.message?.content ?? '').trim();

    if (!improvedDescription) {
      return NextResponse.json({ error: 'R\u00e9ponse vide du mod\u00e8le.' }, { status: 502 });
    }

    return NextResponse.json({ improvedDescription });
  } catch (err: any) {
    console.error('[improve-description] Unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Erreur interne.' }, { status: 500 });
  }
}
