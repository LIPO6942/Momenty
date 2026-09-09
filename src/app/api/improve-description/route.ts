import { NextRequest, NextResponse } from 'next/server';
import { callGroqChat } from '@/lib/groq';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { description } = await req.json();

    if (!description || typeof description !== 'string' || !description.trim()) {
      return NextResponse.json({ error: 'Description manquante.' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Clé API Groq non configurée (GROQ_API_KEY manquante).' },
        { status: 503 }
      );
    }

    const improvedDescription = await callGroqChat({
      messages: [
        {
          role: 'system',
          content:
            "Tu es un écrivain de voyage. Réécris le texte fourni en français pour le rendre plus évocateur, immersif et personnel, en 1 à 3 phrases maximum. Préserve le sens d'origine. Réponds uniquement avec le texte réécrit, sans préfixe ni commentaire.",
        },
        { role: 'user', content: description.trim() },
      ],
      temperature: 0.7,
      max_tokens: 400,
    });

    if (!improvedDescription || !improvedDescription.trim()) {
      return NextResponse.json({ error: 'Réponse vide du modèle.' }, { status: 502 });
    }

    return NextResponse.json({ improvedDescription: improvedDescription.trim() });
  } catch (err: any) {
    console.error('[improve-description] Unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Erreur interne.' }, { status: 500 });
  }
}
