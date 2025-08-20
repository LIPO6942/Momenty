
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
    type: z.enum(["Musée", "Monument", "Restaurant", "Activité", "Parc", "Shopping", "Autre", "Soirée"]).describe("Le type d'activité."),
});

const DayPlanSchema = z.object({
    day: z.number().describe("Le numéro du jour dans l'itinéraire (ex: 1, 2, 3)."),
    date: z.string().describe("La date du jour au format 'jour mois année' (ex: '25 juillet 2024')."),
    city: z.string().describe("La ville principale pour cette journée."),
    theme: z.string().describe("Un thème ou un titre pour la journée (ex: Découverte historique, Aventure culinaire)."),
    activities: z.array(ActivitySchema).describe("La liste des activités pour la journée."),
});


const GenerateItineraryOutputSchema = z.object({
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
  prompt: `Tu es un expert en voyages et un planificateur d'itinéraires exceptionnel, doté d'une touche personnelle. Ta mission est de créer un itinéraire de voyage optimisé, réaliste et inspirant en français, en adaptant le ton au contexte du voyage.

**Contexte du voyage :**
- Destination principale : {{{country}}}
{{#if cities}}
- Villes spécifiques à inclure avec la durée souhaitée : 
  {{#each cities}}
  - {{name}} ({{days}} jour(s))
  {{/each}}
- La répartition des jours entre les villes est une contrainte forte. Tu dois la respecter.
{{/if}}
- Date de début : {{{startDate}}}
- Date de fin : {{{endDate}}}

**Contexte des voyageurs :**
{{#if companionType}}
- Type de voyage : Avec {{companionType}}{{#if companionName}}, nommé(e) {{companionName}}{{/if}}.
{{else}}
- Type de voyage : Solo
{{/if}}

**Instructions :**
1.  Calcule la durée totale du voyage en jours.
2.  Si une liste de villes avec des durées est fournie, respecte cette répartition. Organise le trajet de manière cohérente (ex: du nord au sud).
3.  Pour chaque jour, définis un thème, la ville principale, et propose 2 à 3 activités (matin, après-midi, soir). Varie les types d'activités (culture, gastronomie, nature, détente, etc.).
4.  **Adapte le ton** :
    - Si le voyage est avec un(e) **'Conjoint(e)'**, rends le titre et les descriptions plus romantiques. Ex: "Notre escapade amoureuse en Italie", "Dîner romantique avec vue".
    - Si le voyage est avec un **'Parent'**, utilise un ton affectueux et attentionné. Ex: "Merveilleux souvenirs en famille en Grèce", "Promenade paisible dans les jardins".
    - Si le voyage est avec un(e) **'Ami(e)'**, utilise un ton plus fun et dynamique. Ex: "L'aventure entre amis au Japon !", "Soirée festive dans le quartier de Shibuya".
    - Si le voyage est en **'Solo'**, utilise un ton inspirant et d'exploration personnelle. Ex: "Mon exploration en solitaire du Pérou", "Méditation face au Machu Picchu".
5.  Le titre général doit refléter ce ton personnalisé, tout en mentionnant la durée et le pays.
6.  Rédige des descriptions courtes et percutantes pour chaque activité.
7.  Assure-toi que le format de sortie est un JSON qui correspond parfaitement au schéma fourni.
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
