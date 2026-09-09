import type { Activity, DayPlan, ItineraryOutput, TravelInfo } from '@/lib/types';

export const VALID_ACTIVITY_TYPES: Activity['type'][] = [
  'Musée',
  'Monument',
  'Restaurant',
  'Activité',
  'Parc',
  'Shopping',
  'Soirée',
  'Baignade',
  'Autre',
];

/**
 * Normalise intelligemment le type d'activité retourné par le LLM pour qu'il corresponde
 * toujours aux icônes et types attendus par le composant d'affichage.
 */
export function normalizeActivityType(type: unknown): Activity['type'] {
  if (!type || typeof type !== 'string') return 'Autre';
  const lower = type.toLowerCase().trim();

  if (
    lower.includes('musée') ||
    lower.includes('musee') ||
    lower.includes('museum') ||
    lower.includes('art') ||
    lower.includes('galerie') ||
    lower.includes('exposition')
  ) {
    return 'Musée';
  }

  if (
    lower.includes('monument') ||
    lower.includes('château') ||
    lower.includes('chateau') ||
    lower.includes('historique') ||
    lower.includes('temple') ||
    lower.includes('cathédrale') ||
    lower.includes('cathedrale') ||
    lower.includes('palais') ||
    lower.includes('ruines')
  ) {
    return 'Monument';
  }

  if (
    lower.includes('restaurant') ||
    lower.includes('resto') ||
    lower.includes('café') ||
    lower.includes('cafe') ||
    lower.includes('gastronomie') ||
    lower.includes('dîner') ||
    lower.includes('diner') ||
    lower.includes('déjeuner') ||
    lower.includes('dejeuner') ||
    lower.includes('food') ||
    lower.includes('bar') ||
    lower.includes('dégustation') ||
    lower.includes('degustation')
  ) {
    return 'Restaurant';
  }

  if (
    lower.includes('parc') ||
    lower.includes('jardin') ||
    lower.includes('nature') ||
    lower.includes('forêt') ||
    lower.includes('foret') ||
    lower.includes('montagne')
  ) {
    return 'Parc';
  }

  if (
    lower.includes('shopping') ||
    lower.includes('boutique') ||
    lower.includes('marché') ||
    lower.includes('marche') ||
    lower.includes('souk') ||
    lower.includes('achats')
  ) {
    return 'Shopping';
  }

  if (
    lower.includes('soirée') ||
    lower.includes('soiree') ||
    lower.includes('fête') ||
    lower.includes('fete') ||
    lower.includes('nuit') ||
    lower.includes('spectacle') ||
    lower.includes('concert') ||
    lower.includes('club')
  ) {
    return 'Soirée';
  }

  if (
    lower.includes('baignade') ||
    lower.includes('plage') ||
    lower.includes('mer') ||
    lower.includes('piscine') ||
    lower.includes('crique') ||
    lower.includes('snorkeling')
  ) {
    return 'Baignade';
  }

  if (
    lower.includes('activité') ||
    lower.includes('activite') ||
    lower.includes('balade') ||
    lower.includes('promenade') ||
    lower.includes('visite') ||
    lower.includes('randonnée') ||
    lower.includes('randonnee') ||
    lower.includes('tour') ||
    lower.includes('sport') ||
    lower.includes('excursion')
  ) {
    return 'Activité';
  }

  for (const valid of VALID_ACTIVITY_TYPES) {
    if (lower === valid.toLowerCase()) return valid;
  }

  return 'Autre';
}

/**
 * Normalise le mode de transport pour TravelInfo.
 */
export function normalizeTravelMode(mode: unknown): TravelInfo['mode'] {
  if (!mode || typeof mode !== 'string') return 'Voiture';
  const lower = mode.toLowerCase().trim();

  if (
    lower.includes('train') ||
    lower.includes('métro') ||
    lower.includes('metro') ||
    lower.includes('tgv') ||
    lower.includes('rail')
  ) {
    return 'Train';
  }

  if (
    lower.includes('avion') ||
    lower.includes('vol') ||
    lower.includes('flight') ||
    lower.includes('plane')
  ) {
    return 'Avion';
  }

  if (
    lower.includes('bus') ||
    lower.includes('car') ||
    lower.includes('navette') ||
    lower.includes('shuttle')
  ) {
    return 'Bus';
  }

  if (
    lower.includes('bateau') ||
    lower.includes('ferry') ||
    lower.includes('boat') ||
    lower.includes('ship') ||
    lower.includes('croisière')
  ) {
    return 'Bateau';
  }

  return 'Voiture';
}

/**
 * Extrait le JSON d'une réponse brute LLM (avec ou sans balises markdown).
 */
export function extractJsonFromText(rawText: string): any {
  const fenceMatch = rawText.match(/```json[\s\S]*?```/i) || rawText.match(/```[\s\S]*?```/);
  const candidate = fenceMatch ? fenceMatch[0].replace(/```json|```/gi, '').trim() : rawText.trim();

  let jsonText = candidate;
  const first = candidate.indexOf('{');
  const last = candidate.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    jsonText = candidate.slice(first, last + 1);
  }

  return JSON.parse(jsonText);
}

/**
 * Assainit et valide la structure de l'itinéraire pour garantir sa conformité sans faille.
 */
export function sanitizeItinerary(raw: any, defaultCountry: string): ItineraryOutput {
  const title = typeof raw?.title === 'string' && raw.title.trim()
    ? raw.title.trim()
    : `Votre itinéraire d'aventure - ${defaultCountry}`;

  const rawItinerary = Array.isArray(raw?.itinerary) ? raw.itinerary : [];

  const itinerary: DayPlan[] = rawItinerary.map((dayItem: any, index: number) => {
    const day = Number(dayItem?.day) || index + 1;
    const date = typeof dayItem?.date === 'string' ? dayItem.date : `Jour ${day}`;
    const city = typeof dayItem?.city === 'string' && dayItem.city.trim() ? dayItem.city.trim() : defaultCountry;
    const theme = typeof dayItem?.theme === 'string' && dayItem.theme.trim() ? dayItem.theme.trim() : 'Découverte et exploration';

    const rawActivities = Array.isArray(dayItem?.activities) ? dayItem.activities : [];
    const activities: Activity[] = rawActivities.map((act: any) => ({
      time: typeof act?.time === 'string' && act.time.trim() ? act.time.trim() : 'Journée',
      description: typeof act?.description === 'string' && act.description.trim() ? act.description.trim() : 'Visite libre et découverte.',
      type: normalizeActivityType(act?.type),
    }));

    if (activities.length === 0) {
      activities.push({
        time: 'Journée',
        description: `Visite et découverte de ${city}`,
        type: 'Activité',
      });
    }

    let travelInfo: TravelInfo | undefined = undefined;
    if (dayItem?.travelInfo && typeof dayItem.travelInfo === 'object') {
      const desc = dayItem.travelInfo.description;
      if (typeof desc === 'string' && desc.trim()) {
        travelInfo = {
          mode: normalizeTravelMode(dayItem.travelInfo.mode),
          description: desc.trim(),
        };
      }
    }

    return {
      day,
      date,
      city,
      theme,
      activities,
      travelInfo,
    };
  });

  return {
    title,
    itinerary,
  };
}
