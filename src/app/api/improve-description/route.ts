import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { description } = await req.json();

    if (!description || typeof description !== 'string' || !description.trim()) {
      return NextResponse.json({ error: 'Description manquante.' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Cl\u00e9 API Groq non configur\u00e9e. Veuillez d\u00e9finir GROQ_API_KEY." },
        { status: 503 }
      );
    }

    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

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
      console.error(`[improve-description] Groq error ${res.status}:`, errText);
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
