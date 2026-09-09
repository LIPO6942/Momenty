import { NextRequest, NextResponse } from 'next/server';
import { callGroqChat } from '@/lib/groq';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface InstantForStoryInput {
  title?: string;
  description?: string;
  location?: string;
  emotion?: string | string[];
  photos?: string[] | null;
  day?: string;
}

interface GenerateStoryRequestBody {
  instants: InstantForStoryInput[];
  companionType?: string;
  companionName?: string;
  userFirstName?: string;
  userAge?: string | number;
  userGender?: string;
}

function renderStoryPrompt(input: GenerateStoryRequestBody): string {
  const narratorLines: string[] = [];
  if (input.userFirstName) narratorLines.push(`- Le narrateur s'appelle ${input.userFirstName}.`);
  if (input.userAge) narratorLines.push(`- Âge : ${input.userAge} ans.`);
  if (input.userGender) narratorLines.push(`- Genre : ${input.userGender}.`);

  const voyageCtx = input.companionName
    ? `- Je voyage avec ${input.companionType || 'mon compagnon'}, nommé(e) ${input.companionName}. Le récit doit être écrit à la première personne du pluriel ("nous").`
    : `- Je voyage en solo. Le récit doit être écrit à la première personne du singulier ("je").`;

  const safeInstants = Array.isArray(input.instants) ? input.instants : [];
  const instantsBlock = safeInstants
    .map((inst, index) => {
      const day = inst.day || `Moment ${index + 1}`;
      const title = inst.title || 'Moment capturé';
      const desc = inst.description || '(Sans description)';
      const location = inst.location || 'Lieu non spécifié';
      const emotions = Array.isArray(inst.emotion)
        ? inst.emotion.join(', ')
        : (inst.emotion || 'Aucune émotion particulière');
      const photoCount = Array.isArray(inst.photos) ? inst.photos.length : 0;
      const photoNote = photoCount > 0 ? `  - ${photoCount} photo(s) prise(s)` : '';

      return [
        `- ${day} :`,
        `  - Titre : ${title}`,
        `  - Description : ${desc}`,
        `  - Lieu : ${location}`,
        `  - Émotion(s) : ${emotions}`,
        photoNote,
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  return `Tu es un écrivain de voyage poétique et concis. Ta mission est de transformer une série de moments (notes, souvenirs, émotions) en un récit de voyage immersif, chaleureux, réaliste et bien structuré en français.

Le récit ne doit PAS dépasser 3 ou 4 paragraphes au total. Sois évocateur, synthétique et va à l'essentiel.

Contexte du narrateur:
${narratorLines.length > 0 ? narratorLines.join('\n') : '- Voyageur passionné.'}

Contexte du voyage:
${voyageCtx}

Moments vécus à raconter:
${instantsBlock || '- Quelques moments mémorables du séjour.'}

Consignes:
1. Rédige une histoire fluide et harmonieuse reliant ces moments.
2. Évite les listes à puces. Raconte une vraie histoire vécue.
3. Commence par un titre principal percutant en Markdown (ex: # ...).
4. Plante le décor dans le premier paragraphe, développe l'atmosphère et les ressentis, puis termine par une note inspirante.
5. Réponds directement avec le texte formaté en Markdown, sans préambule ni méta-commentaire.`;
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateStoryRequestBody = await req.json();
    const { instants } = body || {};

    if (!Array.isArray(instants) || instants.length === 0) {
      return NextResponse.json(
        { error: "Veuillez sélectionner au moins un moment pour générer l'histoire." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Clé API Groq non configurée sur Vercel (GROQ_API_KEY manquante).' },
        { status: 503 }
      );
    }

    const prompt = renderStoryPrompt(body);

    const story = await callGroqChat({
      messages: [
        {
          role: 'system',
          content: 'Tu es un écrivain de voyage talentueux qui rédige de magnifiques récits concis en français.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2500,
    });

    if (!story || !story.trim()) {
      return NextResponse.json(
        { error: "L'IA a retourné une réponse vide. Veuillez réessayer." },
        { status: 502 }
      );
    }

    return NextResponse.json({ story: story.trim() });
  } catch (error: any) {
    console.error('[story/generate] Erreur:', error);
    return NextResponse.json(
      { error: error?.message || "Une erreur est survenue lors de la génération de l'histoire." },
      { status: 500 }
    );
  }
}
