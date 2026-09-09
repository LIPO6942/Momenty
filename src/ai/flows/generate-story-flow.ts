'use server';
/**
 * @fileOverview Flow IA pour générer une histoire de voyage à partir d'instants.
 */

import { z } from 'zod';
import { callGroqChat } from '@/lib/groq';

const InstantForStorySchema = z.object({
  title: z.string().optional().default(''),
  description: z.string().optional().default(''),
  location: z.string().optional().default(''),
  emotion: z.union([z.string(), z.array(z.string())]).optional().default(''),
  photos: z.array(z.string()).optional().nullable(),
  day: z.string().optional().default(''),
});

const GenerateStoryInputSchema = z.object({
  instants: z.array(InstantForStorySchema).describe("Une liste des moments (notes, photos) de la ou des journée(s)."),
  companionType: z.string().optional(),
  companionName: z.string().optional(),
  userFirstName: z.string().optional(),
  userAge: z.union([z.string(), z.number()]).optional(),
  userGender: z.string().optional(),
});
export type GenerateStoryInput = z.infer<typeof GenerateStoryInputSchema>;

const GenerateStoryOutputSchema = z.object({
  story: z.string().describe("L'histoire très concise et narrative de la journée, formatée en Markdown."),
});
export type GenerateStoryOutput = z.infer<typeof GenerateStoryOutputSchema>;

function renderStoryPrompt(input: GenerateStoryInput): string {
  const narratorLines: string[] = [];
  if (input.userFirstName) narratorLines.push(`- Le narrateur s'appelle ${input.userFirstName}.`);
  if (input.userAge) narratorLines.push(`- Âge : ${input.userAge} ans.`);
  if (input.userGender) narratorLines.push(`- Genre : ${input.userGender}.`);

  const voyageCtx = input.companionName
    ? `- Je voyage avec ${input.companionType ?? 'mon compagnon'}, qui s'appelle ${input.companionName}. Le ton doit être à la première personne du pluriel ("nous").`
    : `- Je voyage en solo. Le ton doit être à la première personne du singulier ("je").`;

  const instantsBlock = (input.instants || [])
    .map((inst) => {
      const emotions = Array.isArray(inst.emotion)
        ? inst.emotion.join(', ')
        : (inst.emotion || '');
      const photos = inst.photos && inst.photos.length
        ? `  - Photos: ${inst.photos.length} image(s) capturée(s)`
        : '';
      return [
        `- Moment du ${inst.day || 'séjour'}:`,
        `  - Titre: ${inst.title || 'Sans titre'}`,
        `  - Description: ${inst.description || 'Sans description'}`,
        `  - Lieu: ${inst.location || 'Lieu non spécifié'}`,
        `  - Émotion(s) ressentie(s): ${emotions || 'Non spécifiée'}`,
        photos,
      ].filter(Boolean).join('\n');
    })
    .join('\n');

  return `Tu es un écrivain de voyage poétique et TRÈS concis. Ta mission est de transformer une série de moments (notes, photos, émotions) d'une ou plusieurs journées en un récit de voyage immersif, court, réaliste et bien structuré.

Le récit doit être en français, et ne doit PAS dépasser 3 ou 4 paragraphes au total. Sois synthétique et va à l'essentiel.

Contexte du narrateur:
${narratorLines.join('\n')}

Contexte du voyage :
${voyageCtx}

Voici les moments à synthétiser :
${instantsBlock}

Instructions :
Rédige une histoire fluide, réaliste et captivante qui relie ces moments. Ne fais pas un compte rendu chronologique détaillé. Au lieu de cela, capture l'essence et l'atmosphère générale de la période.
Commence par une introduction qui plante le décor. Ensuite, décris les moments les plus marquants. Termine par une conclusion qui résume le sentiment général de l'expérience.

Structure la réponse en Markdown, avec un titre principal pour l'histoire.`;
}

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

export async function generateStory(input: GenerateStoryInput): Promise<GenerateStoryOutput> {
  const validatedInput = GenerateStoryInputSchema.parse(input);
  const prompt = renderStoryPrompt(validatedInput);
  const useGroq = !!process.env.GROQ_API_KEY;

  let raw: string;
  if (useGroq) {
    raw = await callGroqChat({
      messages: [
        { role: 'system', content: 'Tu es un écrivain de voyage poétique et concis.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2500,
    });
  } else {
    raw = await callOllama(prompt);
  }

  const story = raw.trim();
  return { story };
}
