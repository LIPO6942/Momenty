import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getCountry = (loc: string) => {
  if (!loc) return "";
  const parts = loc.split(",");
  const rawCountry = parts.length > 1 ? parts[parts.length - 1].trim() : parts[0].trim();
  if (!rawCountry) return "";

  const lower = rawCountry.toLowerCase();
  const aliases: Record<string, string> = {
    "russia": "Russie",
    "russie": "Russie",
    "russian federation": "Russie",
    "malaysia": "Malaisie",
    "malaisie": "Malaisie",
    "tunisia": "Tunisie",
    "tunisie": "Tunisie",
    "turkey": "Turquie",
    "turquie": "Turquie",
    "turkiye": "Turquie",
    "indonesia": "Indonésie",
    "indonesie": "Indonésie",
    "indonésie": "Indonésie",
    "thailand": "Thaïlande",
    "thaïlande": "Thaïlande",
    "thailande": "Thaïlande",
    "philippines": "Philippines",
    "singapore": "Singapour",
    "singapour": "Singapour",
    "maroc": "Maroc",
    "morocco": "Maroc",
    "algeria": "Algérie",
    "algérie": "Algérie",
    "egypt": "Égypte",
    "égypte": "Égypte",
    "spain": "Espagne",
    "espagne": "Espagne",
    "italy": "Italie",
    "italie": "Italie",
    "germany": "Allemagne",
    "allemagne": "Allemagne",
    "england": "Royaume-Uni",
    "uk": "Royaume-Uni",
    "united kingdom": "Royaume-Uni",
    "royaume-uni": "Royaume-Uni",
    "usa": "États-Unis",
    "united states": "États-Unis",
    "états-unis": "États-Unis",
    "suisse": "Suisse",
    "switzerland": "Suisse",
    "belgium": "Belgique",
    "belgique": "Belgique",
    "china": "Chine",
    "chine": "Chine",
    "japan": "Japon",
    "japon": "Japon",
    "south korea": "Corée du Sud",
    "corée du sud": "Corée du Sud",
    "brazil": "Brésil",
    "brésil": "Brésil",
    "mexico": "Mexique",
    "mexique": "Mexique",
    "canada": "Canada",
    "netherlands": "Pays-Bas",
    "pays-bas": "Pays-Bas",
    "nederland": "Pays-Bas",
    "holland": "Pays-Bas",
    "hollande": "Pays-Bas"
  };

  if (aliases[lower]) return aliases[lower];

  return rawCountry.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

export const getCity = (loc: string) => {
  if (!loc) return "";
  const parts = loc.split(",");
  const rawCity = parts[0].trim();
  const lower = rawCity.toLowerCase();
  
  const aliases: Record<string, string> = {
    "kuala lampur": "Kuala Lumpur",
    "kuala lumpur": "Kuala Lumpur",
  };
  
  if (aliases[lower]) return aliases[lower];

  return rawCity.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

export const getPhotoFilterCss = (filter?: string): string | undefined => {
  if (!filter) return undefined;

  switch (filter) {
    case 'bw':
      return 'grayscale(1) contrast(1.15)';
    case 'sepia':
      return 'sepia(1) contrast(1.1)';
    case 'vibrant':
      return 'saturate(1.4) contrast(1.1)';
    case 'vintage':
      return 'sepia(0.85) contrast(1.25) saturate(0.7) brightness(0.9)';
    case 'cinema':
      return 'sepia(0.25) contrast(1.2) brightness(1.08) saturate(1.1)';
    case 'grain':
      return 'contrast(1.1) saturate(0.85) brightness(0.95)';
    default:
      return undefined;
  }
};

// Format date for instant title: "15 Sept 25"
export const formatInstantDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    return format(date, 'd MMM yy', { locale: fr }).replace('.', '');
  } catch {
    return '';
  }
};

// Abbreviate city names for display
export const abbreviateCity = (city: string): string => {
  if (!city) return '';

  const lower = city.toLowerCase();

  // Common abbreviations
  const abbreviations: Record<string, string> = {
    'saint-petersbourg': 'St-Petersbourg',
    'saint petersbourg': 'St-Petersbourg',
    'saint-petersburg': 'St-Petersbourg',
    'saint petersburg': 'St-Petersbourg',
    'saint-pierre': 'St-Pierre',
    'saint pierre': 'St-Pierre',
    'sainte-': 'Ste-',
    'sainte ': 'Ste-',
    'saint-': 'St-',
    'saint ': 'St-',
  };

  // Check for exact matches first
  if (abbreviations[lower]) return abbreviations[lower];

  // Check for prefix matches
  for (const [prefix, abbr] of Object.entries(abbreviations)) {
    if (lower.startsWith(prefix)) {
      return city.replace(new RegExp(`^${prefix}`, 'i'), abbr);
    }
  }

  return city;
};

// Format instant title: "ville, pays (date)"
export const formatInstantTitle = (location: string, dateString: string): string => {
  const city = abbreviateCity(getCity(location));
  const country = getCountry(location);
  const date = formatInstantDate(dateString);

  if (!city && !country) return '';
  if (!date) return `${city}${city && country ? ', ' : ''}${country}`;

  return `${city}${city && country ? ', ' : ''}${country} (${date})`;
};
