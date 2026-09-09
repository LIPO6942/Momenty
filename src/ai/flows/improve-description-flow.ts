'use server';
/**
 * @fileOverview An AI flow to improve a description.
 */

import { z } from 'zod';
import { callGroqChat } from '@/lib/groq';

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
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Ollama error ${res.status}: ${t}`);
  }
  const data = await res.json();
  return (data.response ?? '').toString();
}

export async function improveDescription(input: ImproveDescriptionInput): Promise<ImproveDescriptionOutput> {
  ImproveDescriptionInputSchema.parse(input);
  const prompt = renderPrompt(input);
  const useGroq = !!process.env.GROQ_API_KEY;

  let raw: string;
  if (useGroq) {
    raw = await callGroqChat({
      messages: [
        { role: 'system', content: 'Tu réécris en français, style carnet de voyage, concis et évocateur.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 400,
    });
  } else {
    raw = await callOllama(prompt);
  }

  const improvedDescription = raw.trim();
  return { improvedDescription };
}
