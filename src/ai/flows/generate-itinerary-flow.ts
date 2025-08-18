
'use server';
/**
 * @fileOverview An AI flow to generate a travel itinerary.
 *
 * - generateItinerary - A function that handles the itinerary generation process.
 * - GenerateItineraryInput - The input type for the generateItinerary function.
 * - GenerateItineraryOutput - The return type for the generateItinerary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

export const GenerateItineraryInputSchema = z.object({
  country: z.string().describe("Le pays de destination."),
  cities: z.array(z.string()).optional().describe("Liste optionnelle des villes spécifiques à visiter."),
  startDate: z.string().describe("La date de début du voyage (format ISO 8601)."),
  endDate: z.string().describe("La date de fin du voyage (format ISO 8601)."),
});
export type GenerateItineraryInput = z.infer<typeof GenerateItineraryInputSchema>;


const ActivitySchema = z.object({
    time: z.string().describe("Le moment de la journée (ex: Matin, Après-midi, Soir)."),
    description: z.string().describe("Description concise de l'activité (ex: Visite du Musée du Louvre)."),
    type: z.enum(["Musée", "Monument", "Restaurant", "Activité", "Parc", "Shopping", "Autre"]).describe("Le type d'activité."),
});

const DayPlanSchema = z.object({
    day: z.number().describe("Le numéro du jour dans l'itinéraire (ex: 1, 2, 3)."),
    date: z.string().describe("La date du jour au format 'jour mois année' (ex: '25 juillet 2024')."),
    city: z.string().describe("La ville principale pour cette journée."),
    theme: z.string().describe("Un thème ou un titre pour la journée (ex: Découverte historique, Aventure culinaire)."),
    activities: z.array(ActivitySchema).describe("La liste des activités pour la journée."),
});


export const GenerateItineraryOutputSchema = z.object({
  title: z.string().describe("Un titre global pour l'itinéraire (ex: 'Votre aventure de 10 jours en Italie')."),
  itinerary: z.array(DayPlanSchema).describe("La liste des plans journaliers pour l'itinéraire."),
});
export type GenerateItineraryOutput = z.infer<typeof GenerateItineraryOutputSchema>;


export async function generateItinerary(input: GenerateItineraryInput): Promise<GenerateItineraryOutput> {
  return generateItineraryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateItineraryPrompt',
  input: {schema: GenerateItineraryInputSchema},
  output: {schema: GenerateItineraryOutputSchema},
  prompt: `Tu es un expert en voyages et un planificateur d'itinéraires exceptionnel. Ta mission est de créer un itinéraire de voyage optimisé, réaliste et inspirant en français.

**Contexte du voyage :**
- Destination principale : {{{country}}}
{{#if cities}}
- Villes spécifiques à inclure si possible : {{#each cities}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}
- Date de début : {{{startDate}}}
- Date de fin : {{{endDate}}}

**Instructions :**
1.  Calcule la durée totale du voyage en jours.
2.  Crée un itinéraire logique jour par jour. Si plusieurs villes sont spécifiées, organise le trajet de manière cohérente (ex: du nord au sud).
3.  Pour chaque jour, définis un thème, la ville principale, et propose 2 à 3 activités (matin, après-midi, soir). Varie les types d'activités (culture, gastronomie, nature, détente, etc.).
4.  Rédige des descriptions courtes et percutantes pour chaque activité.
5.  Le titre général doit être engageant et mentionner la durée et le pays.
6.  Assure-toi que le format de sortie est un JSON qui correspond parfaitement au schéma fourni.
`,
});

const generateItineraryFlow = ai.defineFlow(
  {
    name: 'generateItineraryFlow',
    inputSchema: GenerateItineraryInputSchema,
    outputSchema: GenerateItineraryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
