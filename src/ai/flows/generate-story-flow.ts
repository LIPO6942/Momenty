
'use server';
/**
 * @fileOverview An AI flow to generate a travel story from a day's instants.
 *
 * - generateStory - A function that handles the story generation process.
 * - GenerateStoryInput - The input type for the generateStory function.
 * - GenerateStoryOutput - The return type for the generateStory function.
 */

import {z} from 'zod';

const InstantForStorySchema = z.object({
  title: z.string(),
  description: z.string(),
  location: z.string(),
  emotion: z.union([z.string(), z.array(z.string())]),
  photos: z.array(z.string()).optional().describe(
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

function renderStoryPrompt(input: GenerateStoryInput): string {
  const narratorLines: string[] = [];
  if (input.userFirstName) narratorLines.push(`- Le narrateur s'appelle ${input.userFirstName}.`);
  if (input.userAge) narratorLines.push(`- Il/Elle a ${input.userAge} ans.`);
  if (input.userGender) narratorLines.push(`- C'est un(e) ${input.userGender}.`);

  const voyageCtx = input.companionName
    ? `- Je voyage avec ${input.companionType ?? 'compagnon'}, qui s'appelle ${input.companionName}. Le ton doit être à la première personne du pluriel ("nous").`
    : `- Je voyage en solo. Le ton doit être à la première personne du singulier ("je").`;

  const instantsBlock = (input.instants || [])
    .map((inst: { title: string; description: string; location: string; emotion: string | string[]; photos?: string[]; day: string }) => {
      const emotions = Array.isArray(inst.emotion)
        ? inst.emotion.join(', ')
        : inst.emotion;
      const photos = inst.photos && inst.photos.length
        ? `  - Photos: ${inst.photos.length} image(s) fournie(s) en data URI (le modèle ne peut pas les voir, utilisez seulement les titres/descriptions/émotions).`
        : '';
      return [
        `- Moment du ${inst.day}:`,
        `  - Titre: ${inst.title}`,
        `  - Description: ${inst.description}`,
        `  - Lieu: ${inst.location}`,
        `  - Émotion(s) ressentie(s): ${emotions}`,
        photos,
      ].filter(Boolean).join('\n');
    })
    .join('\n');

  return `Tu es un écrivain de voyage poétique et TRÈS concis. Ta mission est de transformer une série de moments (notes, photos, émotions) d'une ou plusieurs journées en un récit de voyage immersif, très court, réaliste et bien structuré.

Le récit doit être en français, et ne doit PAS dépasser 3 ou 4 paragraphes au total. Sois synthétique et va à l'essentiel.

**Contexte du narrateur:**
${narratorLines.join('\n')}
Adapte subtilement le ton et les réflexions en fonction de ce profil, sans jamais le mentionner directement.

**Contexte du voyage :**
${voyageCtx}

**Voici les moments à synthétiser :**
${instantsBlock}

**Instructions :**
Rédige une histoire fluide, réaliste et captivante qui relie ces moments. Ne fais pas un compte rendu chronologique détaillé. Au lieu de cela, capture l'essence et l'atmosphère générale de la période.
Commence par une introduction qui plante le décor. Ensuite, décris les moments les plus marquants. Termine par une conclusion qui résume le sentiment général de l'expérience.

Sois bref mais poétique. Le résultat doit être un texte unique et personnel.

Structure la réponse en Markdown, avec un titre principal pour l'histoire.`;
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
  // Ollama returns { response: string, ... }
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
        { role: 'system', content: "Tu es un écrivain de voyage poétique et concis." },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
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

export async function generateStory(input: GenerateStoryInput): Promise<GenerateStoryOutput> {
  // Validate input minimally with zod schema
  GenerateStoryInputSchema.parse(input);
  const prompt = renderStoryPrompt(input);
  const useGroq = !!process.env.GROQ_API_KEY;
  const raw = useGroq ? await callGroq(prompt) : await callOllama(prompt);
  const story = raw.trim();
  return { story };
}
