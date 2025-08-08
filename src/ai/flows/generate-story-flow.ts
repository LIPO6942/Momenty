
'use server';
/**
 * @fileOverview An AI flow to generate a travel story from a day's instants.
 *
 * - generateStory - A function that handles the story generation process.
 * - GenerateStoryInput - The input type for the generateStory function.
 * - GenerateStoryOutput - The return type for the generateStory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const InstantForStorySchema = z.object({
  title: z.string(),
  description: z.string(),
  location: z.string(),
  emotion: z.union([z.string(), z.array(z.string())]),
  photo: z.string().optional().describe(
      "A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});

const GenerateStoryInputSchema = z.object({
  day: z.string().describe("La date du jour pour l'histoire, ex: '20 juillet 2024'."),
  instants: z.array(InstantForStorySchema).describe("Une liste des moments (notes, photos) de la journée."),
  companionType: z.string().optional().describe("Le type de compagnon de voyage (ex: 'Ami(e)', 'Solo')."),
  companionName: z.string().optional().describe("Le nom du compagnon de voyage."),
  userFirstName: z.string().optional().describe("Le prénom de l'utilisateur."),
  userAge: z.string().optional().describe("L'âge de l'utilisateur."),
  userGender: z.string().optional().describe("Le genre de l'utilisateur (Homme, Femme)."),
});
export type GenerateStoryInput = z.infer<typeof GenerateStoryInputSchema>;

const GenerateStoryOutputSchema = z.object({
  story: z.string().describe("L'histoire concise et narrative de la journée, formatée en Markdown."),
});
export type GenerateStoryOutput = z.infer<typeof GenerateStoryOutputSchema>;

export async function generateStory(input: GenerateStoryInput): Promise<GenerateStoryOutput> {
  return generateStoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStoryPrompt',
  input: {schema: GenerateStoryInputSchema},
  output: {schema: GenerateStoryOutputSchema},
  prompt: `Tu es un écrivain de voyage poétique et concis. Ta mission est de transformer une série de moments (notes, photos, émotions) d'une journée en un récit de voyage immersif, court, réaliste et bien structuré.

Le récit doit être en français, ne doit pas dépasser 4 ou 5 paragraphes.

**Contexte du narrateur:**
{{#if userFirstName}}
- Le narrateur s'appelle {{userFirstName}}.
{{/if}}
{{#if userAge}}
- Il/Elle a {{userAge}} ans.
{{/if}}
{{#if userGender}}
- C'est un(e) {{userGender}}.
{{/if}}
Adapte subtilement le ton et les réflexions en fonction de ce profil, sans jamais le mentionner directement.

**Contexte du voyage pour la journée du {{day}} :**
{{#if companionName}}
- Je voyage avec {{companionType}}, qui s'appelle {{companionName}}. Le ton doit être à la première personne du pluriel ("nous", "notre journée", etc.).
{{else}}
- Je voyage en solo. Le ton doit être à la première personne du singulier ("je", "mon exploration", etc.).
{{/if}}

**Voici les moments de la journée :**

{{#each instants}}
- Moment :
  - Titre: {{{title}}}
  - Description: {{{description}}}
  - Lieu: {{{location}}}
  - Émotion(s) ressentie(s): {{#each emotion}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{#unless emotion.length}}{{{emotion}}}{{/unless}}
  {{#if photo}}
  - Photo: {{media url=photo}}
  {{/if}}
{{/each}}

**Instructions :**
Rédige une histoire fluide, réaliste et captivante qui relie ces moments. Base-toi sur le contenu visuel des photos pour décrire les scènes et l'atmosphère. Utilise les notes et les émotions pour donner vie au récit.
Commence par une introduction qui plante le décor (le lieu principal de la journée). Ensuite, décris les moments forts de manière chronologique. Termine par une conclusion qui résume le sentiment général de la journée.

Sois bref mais poétique. Le résultat doit être un texte unique et personnel.

Structure la réponse en Markdown, avec un titre principal pour l'histoire. Par exemple :

# Une journée à Tozeur

{{#if companionName}}
Le soleil se levait à peine, et déjà la chaleur promettait une journée intense pour {{companionName}} et moi...
{{else}}
Le soleil se levait à peine, et déjà la chaleur promettait une journée intense pour mon aventure en solitaire...
{{/if}}

...puis tu continues le récit...
`,
});

const generateStoryFlow = ai.defineFlow(
  {
    name: 'generateStoryFlow',
    inputSchema: GenerateStoryInputSchema,
    outputSchema: GenerateStoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
