import { NextRequest, NextResponse } from 'next/server';
import { callGroqChat } from '@/lib/groq';
import { extractJsonFromText, sanitizeItinerary } from '@/lib/itinerary-utils';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { country, cities, startDate, endDate, companionType, companionName } = body || {};

    if (!country || typeof country !== 'string' || !country.trim()) {
      return NextResponse.json(
        { error: 'Veuillez préciser le pays de destination.' },
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

    const citiesBlock = Array.isArray(cities) && cities.length > 0
      ? `- Villes spécifiques à inclure avec la durée souhaitée:\n${cities.map((c: any) => `  - ${c.name} (${c.days || 1} jour(s))`).join('\n')}\n- La répartition des jours entre les villes est une contrainte forte. Tu dois la respecter.`
      : '- Aucune ville spécifique imposée. Répartis intelligemment les jours.';

    const traveler = companionType
      ? `- Type de voyage: Avec ${companionType}${companionName ? `, nommé(e) ${companionName}` : ''}.`
      : '- Type de voyage: Solo';

    const prompt = `Tu es un expert en voyages et un planificateur d'itinéraires exceptionnel. Crée un itinéraire de voyage optimisé, réaliste et inspirant en français.

Contexte du voyage:
- Destination principale: ${country}
${citiesBlock}
- Date de début: ${startDate || 'Non spécifiée'}
- Date de fin: ${endDate || 'Non spécifiée'}

Contexte des voyageurs:
${traveler}

Instructions:
1. Calcule la durée en jours selon les dates ou les villes fournies.
2. Si des villes sont spécifiées, respecte scrupuleusement la durée indiquée pour chacune.
3. Pour chaque jour, définis un thème, la ville principale, et 2 à 3 activités (matin, après-midi, soir).
4. Pour chaque activité, précise le type parmi: "Musée", "Monument", "Restaurant", "Activité", "Parc", "Shopping", "Soirée", "Baignade", "Autre".
5. Si l'on change de ville le jour suivant, ajoute "travelInfo" avec "mode" ("Train", "Avion", "Voiture", "Bus", "Bateau") et une "description" du trajet. N'ajoute pas de travelInfo pour le dernier jour.
6. Retourne UNIQUEMENT un JSON valide au format exact suivant:
{
  "title": "Titre inspirant de l'itinéraire",
  "itinerary": [
    {
      "day": 1,
      "date": "20 Juillet 2024",
      "city": "Paris",
      "theme": "Découverte des icônes",
      "activities": [
        { "time": "Matin", "description": "Balade au bord de la Seine", "type": "Activité" },
        { "time": "Après-midi", "description": "Visite du Musée du Louvre", "type": "Musée" },
        { "time": "Soir", "description": "Dîner dans un bistrot parisien", "type": "Restaurant" }
      ],
      "travelInfo": null
    }
  ]
}`;

    const rawResponse = await callGroqChat({
      messages: [
        {
          role: 'system',
          content: "Tu es un expert planificateur de voyage. Tu réponds UNIQUEMENT en JSON valide selon le schéma demandé, sans texte avant ni après.",
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.4,
      max_tokens: 3800,
      jsonMode: true,
    });

    let parsed: any;
    try {
      parsed = extractJsonFromText(rawResponse);
    } catch (parseErr) {
      console.error('[itineraries/generate] Erreur de parsing JSON:', parseErr, '\nRéponse brute:', rawResponse);
      return NextResponse.json(
        { error: "L'IA a retourné un format JSON incomplet ou invalide. Veuillez réessayer." },
        { status: 502 }
      );
    }

    const sanitized = sanitizeItinerary(parsed, country);
    return NextResponse.json({ itinerary: sanitized });
  } catch (error: any) {
    console.error('[itineraries/generate] Erreur inattendue:', error);
    return NextResponse.json(
      { error: error?.message || "Une erreur est survenue lors de la génération de l'itinéraire." },
      { status: 500 }
    );
  }
}
