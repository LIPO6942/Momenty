import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

async function callGroq(description: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY manquant');

  const model = process.env.GROQ_MODEL || 'llama3-8b-8192';

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
            "Tu es un ecrivain de voyage. Recris le texte en francais pour le rendre plus evocateur, immersif et personnel, en 1 a 3 phrases. Reponds uniquement avec le texte recrit.",
        },
        { role: 'user', content: description },
      ],
      temperature: 0.7,
      max_tokens: 300,
      stream: false,
    }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Groq error ${res.status}: ${t}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? '';
  if (!text) throw new Error('Reponse vide de Groq');
  return text.trim();
}

function localFallbackImprove(description: string): string {
  const trimmed = description.trim();
  const openers = [
    "Un moment suspendu dans le temps \u2014",
    "Je me souviens de chaque detail :",
    "Grave dans ma memoire pour toujours \u2014",
    "Une parenthese que le temps n'effacera pas \u2014",
    "Ces instants ont quelque chose de magique.",
  ];
  const closers = [
    " Un souvenir a jamais precieux.",
    " Ces instants-la, on ne les oublie pas.",
    " La vie, dans toute sa beaute.",
    " Un bonheur simple et parfait.",
  ];

  const opener = openers[Math.floor(Math.random() * openers.length)];
  const closer = closers[Math.floor(Math.random() * closers.length)];
  const body = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  const ending = body.endsWith('.') || body.endsWith('!') || body.endsWith('?') ? '' : '.';
  return `${opener} ${body}${ending}${closer}`;
}

export async function POST(req: NextRequest) {
  try {
    const { description } = await req.json();

    if (!description || typeof description !== 'string' || !description.trim()) {
      return NextResponse.json({ error: 'Description manquante.' }, { status: 400 });
    }

    let improvedDescription: string;

    if (process.env.GROQ_API_KEY) {
      try {
        improvedDescription = await callGroq(description);
      } catch (groqErr) {
        console.error('[improve-description] Groq failed, fallback:', groqErr);
        improvedDescription = localFallbackImprove(description);
      }
    } else {
      console.warn('[improve-description] No GROQ_API_KEY, using local fallback.');
      improvedDescription = localFallbackImprove(description);
    }

    return NextResponse.json({ improvedDescription });
  } catch (err: any) {
    console.error('[improve-description] Error:', err);
    return NextResponse.json({ error: err?.message || 'Erreur interne.' }, { status: 500 });
  }
}
