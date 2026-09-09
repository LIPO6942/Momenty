/**
 * @fileOverview Client Groq partagé et résilient pour toutes les fonctionnalités IA de Momenty.
 * 
 * - Détection dynamique du meilleur modèle disponible sur le compte Groq.
 * - Gestion automatique du cache de modèle pour éviter les requêtes inutiles.
 * - Support du mode JSON natif Groq et contrôle fin de max_tokens.
 * - Repli automatique en cas de modèle indisponible ou saturé.
 */

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqChatOptions {
  messages: GroqMessage[];
  temperature?: number;
  max_tokens?: number;
  jsonMode?: boolean;
}

// Cache du modèle actif en mémoire
let cachedModel: { model: string; timestamp: number } | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

const PREFERRED_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-70b-versatile',
  'llama-3.1-8b-instant',
  'gemma2-9b-it',
  'gemma-7b-it',
  'llama3-70b-8192',
  'llama3-8b-8192',
  'mixtral-8x7b-32768',
];

/**
 * Récupère le premier modèle textuel actif et performant disponible sur le compte Groq.
 */
export async function getAvailableGroqModel(apiKey: string): Promise<string> {
  if (process.env.GROQ_MODEL) {
    return process.env.GROQ_MODEL;
  }

  const now = Date.now();
  if (cachedModel && now - cachedModel.timestamp < CACHE_TTL_MS) {
    return cachedModel.model;
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (res.ok) {
      const data = await res.json();
      const ids: string[] = (data?.data ?? []).map((m: any) => m.id as string);

      for (const p of PREFERRED_MODELS) {
        if (ids.includes(p)) {
          cachedModel = { model: p, timestamp: now };
          return p;
        }
      }

      // Sélectionner le premier modèle textuel (exclure whisper/vision spécifique/audio/tts)
      const textModel = ids.find(
        (id) => !id.includes('whisper') && !id.includes('tts') && !id.includes('vision')
      );
      if (textModel) {
        cachedModel = { model: textModel, timestamp: now };
        return textModel;
      }
    }
  } catch (e) {
    console.warn('[groq] Impossible de lister les modèles Groq, utilisation du modèle par défaut:', e);
  }

  return 'llama-3.3-70b-versatile';
}

/**
 * Envoie une requête de complétion à Groq avec gestion d'erreurs et repli si nécessaire.
 */
export async function callGroqChat(options: GroqChatOptions): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('Clé API Groq non configurée (GROQ_API_KEY manquante).');
  }

  const primaryModel = await getAvailableGroqModel(apiKey);
  const modelsToTry = [primaryModel];

  // Si le premier modèle échoue avec une erreur 404/400 (décommissionné ou non supporté), prévoir un fallback
  if (primaryModel !== 'llama-3.1-8b-instant') {
    modelsToTry.push('llama-3.1-8b-instant');
  }
  if (primaryModel !== 'llama-3.3-70b-versatile') {
    modelsToTry.push('llama-3.3-70b-versatile');
  }

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      const body: Record<string, any> = {
        model,
        messages: options.messages,
        temperature: options.temperature ?? 0.5,
        stream: false,
      };

      if (options.max_tokens) {
        body.max_tokens = options.max_tokens;
      }

      if (options.jsonMode) {
        body.response_format = { type: 'json_object' };
      }

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => res.statusText);
        console.error(`[groq] Erreur ${res.status} avec le modèle ${model}:`, errText);

        // Si le modèle n'existe pas ou erreur spécifique au modèle, tenter le modèle suivant
        if (res.status === 404 || res.status === 400) {
          lastError = new Error(`Groq ${res.status} (${model}): ${errText}`);
          continue;
        }

        throw new Error(`Erreur Groq ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content ?? '';
      return content.trim();
    } catch (err: any) {
      lastError = err;
      if (modelsToTry.indexOf(model) === modelsToTry.length - 1) {
        throw err;
      }
    }
  }

  throw lastError || new Error("Échec de l'appel Groq après plusieurs tentatives.");
}
