'use server';
/**
 * @fileOverview An AI flow to improve a description.
 *
 * - improveDescription - A function that handles the description improvement process.
 * - ImproveDescriptionInput - The input type for the improveDescription function.
 * - ImproveDescriptionOutput - The return type for the improveDescription function.
 */

import {z} from 'zod';

const ImproveDescriptionInputSchema = z.object({
  description: z.string().describe('The description to improve.'),
});
export type ImproveDescriptionInput = z.infer<typeof ImproveDescriptionInputSchema>;

const ImproveDescriptionOutputSchema = z.object({
  improvedDescription: z.string().describe('The improved, poetic, and evocative description in French.'),
});
export type ImproveDescriptionOutput = z.infer<typeof ImproveDescriptionOutputSchema>;

function renderPrompt(input: ImproveDescriptionInput): string {
  return `Tu es un écrivain de voyage. Réécris ce texte en français pour le rendre plus évocateur, immersif et personnel, en 1 à 3 phrases.

Texte d'origine:
"""
${input.description}
"""

Réponds uniquement avec le texte réécrit, sans préfixe ni commentaires.`;
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
    body: JSON.stringify({ model, messages: [ { role: 'system', content: "Tu réécris en français, style carnet de voyage, concis et évocateur." }, { role: 'user', content: prompt } ], temperature: 0.6, stream: false })
  });
  if (!res.ok) { const t = await res.text().catch(() => ''); throw new Error(`Groq error ${res.status}: ${t}`);} 
  const data = await res.json();
  return (data?.choices?.[0]?.message?.content ?? '').toString();
}

export async function improveDescription(input: ImproveDescriptionInput): Promise<ImproveDescriptionOutput> {
  ImproveDescriptionInputSchema.parse(input);
  const prompt = renderPrompt(input);
  const useGroq = !!process.env.GROQ_API_KEY;
  const model = useGroq ? (process.env.GROQ_MODEL || 'llama-3.1-8b-instant') : 'llama3.1:8b';
  const raw = useGroq ? await callGroq(prompt, model) : await callOllama(prompt, model);
  const improvedDescription = raw.trim();
  return { improvedDescription };
}
