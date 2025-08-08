
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
  day: z.string().describe("La date à laquelle ce moment a eu lieu, ex: '20 juillet 2024'."),
});

const GenerateStoryInputSchema = z.object({
  instants: z.array(InstantForStorySchema).describe("Une liste des moments (notes, photos) de la ou des journée(s)."),
  companionType: z.string().optional().describe("Le type de compagnon de voyage (ex: 'Ami(e)', 'Solo')."),
  companionName: z.string().optional().describe("Le nom du compagnon de voyage."),
  userFirstName: z.string().optional().describe("Le prénom de l'utilisateur."),
  userAge: z.string().optional().describe("L'âge de l'utilisateur."),
  userGender: z.string().optional().describe("Le genre de l'utilisateur (Homme, Femme)."),
});
export type GenerateStoryInput = z.infer<typeof GenerateStoryInputSchema>;

const GenerateStoryOutputSchema = z.object({
  story: z.string().describe("L'histoire très concise et narrative de la journée, formatée en Markdown."),
});
export type GenerateStoryOutput = z.infer<typeof GenerateStoryOutputSchema>;

export async function generateStory(input: GenerateStoryInput): Promise<GenerateStoryOutput> {
  return generateStoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStoryPrompt',
  input: {schema: GenerateStoryInputSchema},
  output: {schema: GenerateStoryOutputSchema},
  prompt: `Tu es un écrivain de voyage poétique et TRÈS concis. Ta mission est de transformer une série de moments (notes, photos, émotions) d'une ou plusieurs journées en un récit de voyage immersif, très court, réaliste et bien structuré.

Le récit doit être en français, et ne doit PAS dépasser 3 ou 4 paragraphes au total. Sois synthétique et va à l'essentiel.

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

**Contexte du voyage :**
{{#if companionName}}
- Je voyage avec {{companionType}}, qui s'appelle {{companionName}}. Le ton doit être à la première personne du pluriel ("nous", "notre journée", etc.).
{{else}}
- Je voyage en solo. Le ton doit être à la première personne du singulier ("je", "mon exploration", etc.).
{{/if}}

**Voici les moments à synthétiser :**

{{#each instants}}
- Moment du {{day}}:
  - Titre: {{{title}}}
  - Description: {{{description}}}
  - Lieu: {{{location}}}
  - Émotion(s) ressentie(s): {{#if emotion.length}}{{#each emotion}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}{{{emotion}}}{{/if}}
  {{#if photo}}
  - Photo: {{media url=photo}}
  {{/if}}
{{/each}}

**Instructions :**
Rédige une histoire fluide, réaliste et captivante qui relie ces moments. Ne fais pas un compte rendu chronologique détaillé. Au lieu de cela, capture l'essence et l'atmosphère générale de la période. 
Base-toi sur le contenu visuel des photos et les émotions pour donner vie au récit. 
Commence par une introduction qui plante le décor. Ensuite, décris les moments les plus marquants. Termine par une conclusion qui résume le sentiment général de l'expérience.

Sois bref mais poétique. Le résultat doit être un texte unique et personnel.

Structure la réponse en Markdown, avec un titre principal pour l'histoire.
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
