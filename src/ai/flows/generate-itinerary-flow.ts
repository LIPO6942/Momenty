
'use server';
/**
 * @fileOverview An AI flow to generate a travel itinerary.
 *
 * - generateItinerary - A function that handles the itinerary generation process.
 * - GenerateItineraryInput - The input type for the generateItinerary function.
 * - GenerateItineraryOutput - The return type for the generateItinerary function.
 */

import {z} from 'zod';
import type { ItineraryOutput } from '@/lib/types';


const CityWithDaysSchema = z.object({
    name: z.string().describe("Le nom de la ville."),
    days: z.number().positive().describe("Le nombre de jours à passer dans cette ville."),
});

const GenerateItineraryInputSchema = z.object({
  country: z.string().describe("Le pays de destination."),
  cities: z.array(CityWithDaysSchema).optional().describe("Liste optionnelle des villes spécifiques à visiter avec la durée du séjour pour chacune."),
  startDate: z.string().describe("La date de début du voyage (format ISO 8601)."),
  endDate: z.string().describe("La date de fin du voyage (format ISO 8601)."),
  companionType: z.string().optional().describe("Le type de compagnon de voyage (ex: 'Ami(e)', 'Solo', 'Conjoint(e)', 'Parent')."),
  companionName: z.string().optional().describe("Le nom du compagnon de voyage."),
});
export type GenerateItineraryInput = z.infer<typeof GenerateItineraryInputSchema>;


const ActivitySchema = z.object({
    time: z.string().describe("Le moment de la journée (ex: Matin, Après-midi, Soir)."),
    description: z.string().describe("Description concise de l'activité (ex: Visite du Musée du Louvre)."),
    type: z.enum(["Musée", "Monument", "Restaurant", "Activité", "Parc", "Shopping", "Soirée", "Baignade", "Autre"]).describe("Le type d'activité."),
});

const TravelInfoSchema = z.object({
    mode: z.enum(["Train", "Avion", "Voiture", "Bus", "Bateau"]).describe("Le mode de transport pour se rendre à la prochaine ville."),
    description: z.string().describe("Brève description du trajet (ex: 'Train à grande vitesse vers Florence').")
});

const DayPlanSchema = z.object({
    day: z.number().describe("Le numéro du jour dans l'itinéraire (ex: 1, 2, 3)."),
    date: z.string().describe("La date du jour au format 'jour mois année' (ex: '25 juillet 2024')."),
    city: z.string().describe("La ville principale pour cette journée."),
    theme: z.string().describe("Un thème ou un titre pour la journée (ex: Découverte historique, Aventure culinaire)."),
    activities: z.array(ActivitySchema).describe("La liste des activités pour la journée."),
    travelInfo: TravelInfoSchema.optional().describe("Si c'est le dernier jour dans une ville avant de passer à la suivante, décris ici le trajet prévu."),
});


const GenerateItineraryOutputSchema = z.object({
  title: z.string().describe("Un titre global pour l'itinéraire (ex: 'Votre aventure de 10 jours en Italie')."),
  itinerary: z.array(DayPlanSchema).describe("La liste des plans journaliers pour l'itinéraire."),
});
export type GenerateItineraryOutput = z.infer<typeof GenerateItineraryOutputSchema>;


function renderItineraryPrompt(input: GenerateItineraryInput): string {
  const citiesBlock = input.cities && input.cities.length
    ? `- Villes spécifiques à inclure avec la durée souhaitée:\n${input.cities.map((c: { name: string; days: number }) => `  - ${c.name} (${c.days} jour(s))`).join('\n')}\n- La répartition des jours entre les villes est une contrainte forte. Tu dois la respecter.`
    : '- Aucune ville spécifique imposée. Répartis intelligemment les jours.';

  const traveler = input.companionType
    ? `- Type de voyage: Avec ${input.companionType}${input.companionName ? `, nommé(e) ${input.companionName}` : ''}.`
    : '- Type de voyage: Solo';

  return `Tu es un expert en voyages et un planificateur d'itinéraires exceptionnel, doté d'une touche personnelle. Ta mission est de créer un itinéraire de voyage optimisé, réaliste et inspirant en français, en adaptant le ton au contexte du voyage.

Contexte du voyage:
- Destination principale: ${input.country}
${citiesBlock}
- Date de début: ${input.startDate}
- Date de fin: ${input.endDate}

Contexte des voyageurs:
${traveler}

Instructions:
1. Calcule la durée totale du voyage en jours.
2. Si une liste de villes avec des durées est fournie, respecte cette répartition. Organise le trajet de manière cohérente (ex: du nord au sud).
3. Pour chaque jour, définis un thème, la ville principale, et propose 2 à 3 activités (matin, après-midi, soir). Varie les types d'activités (culture, gastronomie, nature, détente, etc.).
4. Lorsque l'itinéraire implique de changer de ville, ajoute une information de transport. Sur la dernière journée passée dans une ville, remplis l'objet travelInfo { mode: "Train"|"Avion"|"Voiture"|"Bus"|"Bateau", description: string }. N'ajoute pas de travelInfo pour le tout dernier jour.
5. Adapte le ton au type de voyage (Romantique si Conjoint(e), Familial si Parent, Dynamique si Ami(e), Introspectif si Solo). Le titre global doit refléter ce ton, mentionner la durée et le pays.
6. Les descriptions des activités doivent être courtes et percutantes.
7. Retourne UNIQUEMENT un JSON valide correspondant exactement au schéma suivant:
{
  "title": string,
  "itinerary": [
    {
      "day": number,
      "date": string,
      "city": string,
      "theme": string,
      "activities": [ { "time": string, "description": string, "type": "Musée"|"Monument"|"Restaurant"|"Activité"|"Parc"|"Shopping"|"Soirée"|"Baignade"|"Autre" } ],
      "travelInfo"?: { "mode": "Train"|"Avion"|"Voiture"|"Bus"|"Bateau", "description": string }
    }
  ]
}`;
}

async function callOllama(prompt: string, model = 'llama3.1:8b'): Promise<string> {
  const res = await fetch('http://127.0.0.1:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false })
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Ollama error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return (data.response ?? '').toString();
}

async function callGroq(prompt: string, model = 'llama-3.1-8b-instant'): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY manquant.');
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: "Tu es un expert en voyages et un planificateur d'itinéraires exceptionnel." },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      stream: false,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Groq error ${res.status}: ${text}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content ?? '';
  return content.toString();
}

function extractJson(text: string): any {
  // Try to extract the first JSON object in the response
  const fenceMatch = text.match(/```json[\s\S]*?```/i) || text.match(/```[\s\S]*?```/);
  const candidate = fenceMatch ? fenceMatch[0].replace(/```json|```/gi, '').trim() : text.trim();
  // Find first and last braces heuristically if needed
  let jsonText = candidate;
  const first = candidate.indexOf('{');
  const last = candidate.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    jsonText = candidate.slice(first, last + 1);
  }
  return JSON.parse(jsonText);
}

export async function generateItinerary(input: GenerateItineraryInput): Promise<ItineraryOutput> {
  GenerateItineraryInputSchema.parse(input);
  const prompt = renderItineraryPrompt(input);
  const useGroq = !!process.env.GROQ_API_KEY;
  const model = useGroq ? (process.env.GROQ_MODEL || 'llama-3.1-8b-instant') : 'llama3.1:8b';
  const raw = useGroq ? await callGroq(prompt, model) : await callOllama(prompt, model);
  let parsed: unknown;
  try {
    parsed = extractJson(raw);
  } catch (e) {
    throw new Error('Réponse du modèle invalide. Impossible de parser le JSON.');
  }
  const validated = GenerateItineraryOutputSchema.parse(parsed);
  return validated as ItineraryOutput;
}
