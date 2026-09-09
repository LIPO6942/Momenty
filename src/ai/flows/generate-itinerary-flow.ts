'use server';
/**
 * @fileOverview Flow IA pour générer un itinéraire de voyage.
 */

import { z } from 'zod';
import type { ItineraryOutput } from '@/lib/types';
import { callGroqChat } from '@/lib/groq';
import { extractJsonFromText, sanitizeItinerary } from '@/lib/itinerary-utils';

const CityWithDaysSchema = z.object({
  name: z.string().describe('Le nom de la ville.'),
  days: z.number().positive().describe('Le nombre de jours à passer dans cette ville.'),
});

const GenerateItineraryInputSchema = z.object({
  country: z.string().describe('Le pays de destination.'),
  cities: z.array(CityWithDaysSchema).optional().describe('Liste des villes avec la durée du séjour.'),
  startDate: z.string().optional().describe('La date de début du voyage.'),
  endDate: z.string().optional().describe('La date de fin du voyage.'),
  companionType: z.string().optional().describe('Le type de compagnon de voyage.'),
  companionName: z.string().optional().describe('Le nom du compagnon de voyage.'),
});
export type GenerateItineraryInput = z.infer<typeof GenerateItineraryInputSchema>;

async function callOllama(prompt: string, model = 'llama3.1:8b'): Promise<string> {
  const res = await fetch('http://127.0.0.1:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Ollama error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return (data.response ?? '').toString();
}

function renderPrompt(input: GenerateItineraryInput): string {
  const citiesBlock = input.cities && input.cities.length
    ? `- Villes spécifiques à inclure avec la durée souhaitée:\n${input.cities.map((c) => `  - ${c.name} (${c.days} jour(s))`).join('\n')}\n- La répartition des jours entre les villes est une contrainte forte. Tu dois la respecter.`
    : '- Aucune ville spécifique imposée. Répartis intelligemment les jours.';

  const traveler = input.companionType
    ? `- Type de voyage: Avec ${input.companionType}${input.companionName ? `, nommé(e) ${companionName}` : ''}.`
    : '- Type de voyage: Solo';

  return `Tu es un expert en voyages et un planificateur d'itinéraires exceptionnel. Crée un itinéraire de voyage optimisé, réaliste et inspirant en français.

Contexte du voyage:
- Destination principale: ${input.country}
${citiesBlock}
- Date de début: ${input.startDate || 'Non spécifiée'}
- Date de fin: ${input.endDate || 'Non spécifiée'}

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
}

export async function generateItinerary(input: GenerateItineraryInput): Promise<ItineraryOutput> {
  GenerateItineraryInputSchema.parse(input);
  const prompt = renderPrompt(input);
  const useGroq = !!process.env.GROQ_API_KEY;

  let raw: string;
  if (useGroq) {
    raw = await callGroqChat({
      messages: [
        {
          role: 'system',
          content: 'Tu es un expert planificateur de voyage. Tu réponds UNIQUEMENT en JSON valide selon le schéma demandé, sans texte avant ni après.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 3800,
      jsonMode: true,
    });
  } else {
    raw = await callOllama(prompt);
  }

  let parsed: unknown;
  try {
    parsed = extractJsonFromText(raw);
  } catch (e) {
    console.error('[generateItinerary] Impossible de parser le JSON brut:', raw);
    throw new Error("L'IA n'a pas pu créer d'itinéraire au format attendu. Veuillez réessayer.");
  }

  return sanitizeItinerary(parsed, input.country);
}
