
'use server';
/**
 * @fileOverview An AI flow to categorize travel instants.
 *
 * - categorizeInstant - A function that handles the instant categorization process.
 * - CategorizeInstantInput - The input type for the categorizeInstant function.
 * - CategorizeInstantOutput - The return type for the categorizeInstant function.
 */

import {z} from 'zod';

const CategorizeInstantInputSchema = z.object({
  title: z.string().describe('The title of the instant.'),
  description: z.string().describe('The description of the instant.'),
  location: z.string().describe('The location of the instant (e.g., "Paris, France").'),
});
export type CategorizeInstantInput = z.infer<typeof CategorizeInstantInputSchema>;

const CategorizeInstantOutputSchema = z.object({
    categories: z.array(z.string()).describe('A list of up to 3 relevant categories for the instant. Must be chosen from: Gastronomie, Culture, Nature, Shopping, Art, Sport, Détente, Voyage, Plage, Séjour.'),
});
export type CategorizeInstantOutput = z.infer<typeof CategorizeInstantOutputSchema>;

function renderPrompt(input: CategorizeInstantInput): string {
  return `Tu es un assistant de journal de voyage. Catégorise l'événement ci-dessous avec jusqu'à 3 catégories pertinentes parmi: Gastronomie, Culture, Nature, Shopping, Art, Sport, Détente, Voyage, Plage, Séjour.

RÈGLE IMPORTANTE: Si la location contient 'Tunisie', considère cela comme local/séjour et N'UTILISE PAS la catégorie 'Voyage'.

Titre: ${input.title}
Description: ${input.description}
Lieu: ${input.location}

Réponds UNIQUEMENT en JSON valide du format exact:
{ "categories": string[] }`;
}

async function callOllama(prompt: string, model = 'llama3.1:8b'): Promise<string> {
  const res = await fetch('http://127.0.0.1:11434/api/generate', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model, prompt, stream: false })
  });
  if (!res.ok) { const t = await res.text().catch(() => ''); throw new Error(`Ollama error ${res.status}: ${t}`);} 
  const data = await res.json();
  return (data.response ?? '').toString();
}

async function callGroq(prompt: string, model = 'llama-3.1-8b-instant'): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY; if (!apiKey) throw new Error('GROQ_API_KEY manquant.');
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages: [ { role: 'system', content: "Tu rends des catégories claires en français, format JSON." }, { role: 'user', content: prompt } ], temperature: 0.2, stream: false })
  });
  if (!res.ok) { const t = await res.text().catch(() => ''); throw new Error(`Groq error ${res.status}: ${t}`);} 
  const data = await res.json();
  return (data?.choices?.[0]?.message?.content ?? '').toString();
}

function extractJson(text: string): any {
  const fence = text.match(/```json[\s\S]*?```/i) || text.match(/```[\s\S]*?```/);
  const candidate = fence ? fence[0].replace(/```json|```/gi, '').trim() : text.trim();
  const first = candidate.indexOf('{'); const last = candidate.lastIndexOf('}');
  const jsonText = (first !== -1 && last !== -1 && last > first) ? candidate.slice(first, last + 1) : candidate;
  return JSON.parse(jsonText);
}

export async function categorizeInstant(input: CategorizeInstantInput): Promise<CategorizeInstantOutput> {
  CategorizeInstantInputSchema.parse(input);
  const prompt = renderPrompt(input);
  const useGroq = !!process.env.GROQ_API_KEY;
  const model = useGroq ? (process.env.GROQ_MODEL || 'llama-3.1-8b-instant') : 'llama3.1:8b';
  const raw = useGroq ? await callGroq(prompt, model) : await callOllama(prompt, model);
  let parsed: unknown;
  try { parsed = extractJson(raw); } catch { parsed = { categories: ['Note'] }; }
  const validated = CategorizeInstantOutputSchema.parse(parsed);
  return validated;
}
