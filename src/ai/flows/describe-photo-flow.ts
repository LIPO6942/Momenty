
'use server';
/**
 * @fileOverview An AI flow to describe a photo.
 *
 * - describePhoto - A function that handles the photo description process.
 * - DescribePhotoInput - The input type for the describePhoto function.
 * - DescribePhotoOutput - The return type for the describePhoto function.
 */

import {z} from 'zod';

const DescribePhotoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to analyze, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DescribePhotoInput = z.infer<typeof DescribePhotoInputSchema>;

const DescribePhotoOutputSchema = z.object({
  description: z.string().describe('Une légende courte, poétique et évocatrice pour la photo, en français, dans le style d\'un post pour les réseaux sociaux. La légende doit capturer l\'atmosphère et l\'émotion du moment en 1 ou 2 phrases. Par exemple : "Bleu intense et calme absolu. Se perdre dans les ruelles de Sidi Bou Said."'),
  location: z.string().describe('Le lieu (ville, pays) où la photo a probablement été prise. Si inconnu, laisser vide.')
});
export type DescribePhotoOutput = z.infer<typeof DescribePhotoOutputSchema>;

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
        { role: 'system', content: "Tu rédiges des légendes de voyage poétiques et concises en français." },
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

function renderPrompt(_: DescribePhotoInput): string {
  // Option 1 (pas de vision réelle): on génère une légende générique guidée
  return `Tu ne peux PAS voir la photo transmise. Écris néanmoins une légende courte (1 à 2 phrases), poétique et évocatrice en français, adaptée à un post réseaux sociaux de voyage. Si tu devais deviner un lieu plausible (ville, pays), propose-le, sinon laisse vide.

Réponds UNIQUEMENT en JSON valide au format exact suivant:
{
  "description": string,
  "location": string
}`;
}

function extractJson(text: string): any {
  const fence = text.match(/```json[\s\S]*?```/i) || text.match(/```[\s\S]*?```/);
  const candidate = fence ? fence[0].replace(/```json|```/gi, '').trim() : text.trim();
  const first = candidate.indexOf('{');
  const last = candidate.lastIndexOf('}');
  const jsonText = (first !== -1 && last !== -1 && last > first) ? candidate.slice(first, last + 1) : candidate;
  return JSON.parse(jsonText);
}

export async function describePhoto(input: DescribePhotoInput): Promise<DescribePhotoOutput> {
  DescribePhotoInputSchema.parse(input);
  const prompt = renderPrompt(input);
  const useGroq = !!process.env.GROQ_API_KEY;
  const model = useGroq ? (process.env.GROQ_MODEL || 'llama-3.1-8b-instant') : 'llama3.1:8b';
  const raw = useGroq ? await callGroq(prompt, model) : await callOllama(prompt, model);
  let parsed: unknown;
  try {
    parsed = extractJson(raw);
  } catch {
    // Fallback: retourner tout le texte comme description
    parsed = { description: raw.trim(), location: '' };
  }
  const validated = DescribePhotoOutputSchema.parse(parsed);
  return validated;
}
