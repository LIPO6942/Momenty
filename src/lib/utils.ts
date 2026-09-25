import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { countries } from "./countries";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Mapping des villes et zones connues vers leur pays souverain
export const CITY_TO_COUNTRY: Record<string, string> = {
  // Tunisie (zones Kharjet & villes)
  "gammarth": "Tunisie",
  "hammamet": "Tunisie",
  "la marsa": "Tunisie",
  "marsa": "Tunisie",
  "sidi bou said": "Tunisie",
  "sidi bou saïd": "Tunisie",
  "carthage": "Tunisie",
  "tunis": "Tunisie",
  "sousse": "Tunisie",
  "djerba": "Tunisie",
  "bizerte": "Tunisie",
  "nabeul": "Tunisie",
  "monastir": "Tunisie",
  "sfax": "Tunisie",
  "tozeur": "Tunisie",
  "kélibia": "Tunisie",
  "kelibia": "Tunisie",
  "haouaria": "Tunisie",
  "el haouaria": "Tunisie",
  "ghar el melh": "Tunisie",
  "zaghouan": "Tunisie",
  "el menzah": "Tunisie",
  "el manar": "Tunisie",
  "ennasr": "Tunisie",
  "ariana": "Tunisie",
  "ain zaghouan": "Tunisie",
  "ain zaghouan nord": "Tunisie",
  "el aouina": "Tunisie",
  "l'aouina": "Tunisie",
  "les berges du lac": "Tunisie",
  "les berges du lac 1": "Tunisie",
  "les berges du lac 2": "Tunisie",
  "lac 1": "Tunisie",
  "lac 2": "Tunisie",
  "centre ville": "Tunisie",
  "korbous": "Tunisie",
  "tabarka": "Tunisie",
  "mahdia": "Tunisie",
  "kairouan": "Tunisie",
  "zarzis": "Tunisie",
  "douz": "Tunisie",
  "matmata": "Tunisie",
  "tataouine": "Tunisie",
  "gabes": "Tunisie",
  "gabès": "Tunisie",
  "béja": "Tunisie",
  "beja": "Tunisie",
  "jendouba": "Tunisie",
  "le kef": "Tunisie",
  "kef": "Tunisie",
  "siliana": "Tunisie",
  "gafsa": "Tunisie",
  "sidi bouzid": "Tunisie",
  "kasserine": "Tunisie",
  "médenine": "Tunisie",
  "medenine": "Tunisie",
  "kebili": "Tunisie",
  "kébili": "Tunisie",
  "manouba": "Tunisie",
  "ben arous": "Tunisie",
  "radès": "Tunisie",
  "rades": "Tunisie",
  "ezzahra": "Tunisie",
  "hammam lif": "Tunisie",
  "mourouj": "Tunisie",
  "el mourouj": "Tunisie",

  // Grandes villes mondiales courantes
  "paris": "France",
  "lyon": "France",
  "marseille": "France",
  "nice": "France",
  "bordeaux": "France",
  "strasbourg": "France",
  "toulouse": "France",
  "rome": "Italie",
  "milan": "Italie",
  "venise": "Italie",
  "venice": "Italie",
  "florence": "Italie",
  "naples": "Italie",
  "barcelone": "Espagne",
  "barcelona": "Espagne",
  "madrid": "Espagne",
  "séville": "Espagne",
  "londres": "Royaume-Uni",
  "london": "Royaume-Uni",
  "new york": "États-Unis",
  "los angeles": "États-Unis",
  "miami": "États-Unis",
  "dubai": "Émirats arabes unis",
  "dubaï": "Émirats arabes unis",
  "istanbul": "Turquie",
  "tokyo": "Japon",
  "casablanca": "Maroc",
  "marrakech": "Maroc",
  "rabat": "Maroc",
  "alger": "Algérie",
  "oran": "Algérie",
  "le caire": "Égypte",
  "grand baie": "Maurice",
  "port louis": "Maurice",
  "port-louis": "Maurice",
  "portlouis": "Maurice",
  "flic en flac": "Maurice",
  "chamarel": "Maurice",
  "curepipe": "Maurice",
  "beau bassin": "Maurice",
  "kuala lumpur": "Malaisie",
  "kuala lampur": "Malaisie",
  "kulala lumpur": "Malaisie",
  "kulala lampur": "Malaisie",
  "kualalumpur": "Malaisie",
  "kuala-lumpur": "Malaisie",
};

export const COUNTRY_ALIASES: Record<string, string> = {
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
  "hollande": "Pays-Bas",
  "croatie": "Croatie",
  "croatia": "Croatie",
  "maurice": "Maurice",
  "ile maurice": "Maurice",
  "île maurice": "Maurice",
  "iles maurice": "Maurice",
  "îles maurice": "Maurice",
  "iles maurices": "Maurice",
  "îles maurices": "Maurice",
  "mauritius": "Maurice",
};

/**
 * Vérifie si un nom correspond bien à un pays reconnu (et non à une ville ou un lieu arbitraire).
 */
export const isRecognizedCountry = (countryName: string): boolean => {
  if (!countryName) return false;
  const lower = countryName.trim().toLowerCase();
  if (COUNTRY_ALIASES[lower]) return true;
  return countries.some(
    c => c.label.toLowerCase() === lower || 
         c.enLabel.toLowerCase() === lower || 
         c.value.toLowerCase() === lower
  );
};

export const getCountry = (loc: string): string => {
  if (!loc) return "";
  const parts = loc.split(",").map(p => p.trim()).filter(Boolean);
  if (parts.length === 0) return "";

  // 1. Vérifier si l'un des composants de droite à gauche correspond à un pays ou une ville connue
  for (let i = parts.length - 1; i >= 0; i--) {
    const partLower = parts[i].toLowerCase();
    if (COUNTRY_ALIASES[partLower]) return COUNTRY_ALIASES[partLower];
    if (CITY_TO_COUNTRY[partLower]) return CITY_TO_COUNTRY[partLower];
    const countryMatch = countries.find(
      c => c.label.toLowerCase() === partLower || 
           c.enLabel.toLowerCase() === partLower || 
           c.value.toLowerCase() === partLower
    );
    if (countryMatch) return countryMatch.label;
  }

  // 2. Vérifier la chaîne complète
  const fullLower = loc.trim().toLowerCase();
  if (COUNTRY_ALIASES[fullLower]) return COUNTRY_ALIASES[fullLower];
  if (CITY_TO_COUNTRY[fullLower]) return CITY_TO_COUNTRY[fullLower];

  // 3. Si plusieurs parties, prendre la dernière partie
  const rawCountry = parts[parts.length - 1];
  return rawCountry.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

export const CITY_ALIASES: Record<string, string> = {
  "kuala lumpur": "Kuala Lumpur",
  "kuala lampur": "Kuala Lumpur",
  "kulala lumpur": "Kuala Lumpur",
  "kulala lampur": "Kuala Lumpur",
  "kualalumpur": "Kuala Lumpur",
  "kuala-lumpur": "Kuala Lumpur",
  "port-louis": "Port Louis",
  "portlouis": "Port Louis",
  "port louis": "Port Louis",
};

export const normalizeCityName = (raw: string): string => {
  if (!raw) return "";
  const cleaned = raw.trim();
  const lower = cleaned.toLowerCase();
  if (CITY_ALIASES[lower]) {
    return CITY_ALIASES[lower];
  }
  return cleaned
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

export const getCity = (loc: string): string => {
  if (!loc) return "";
  const parts = loc.split(",").map(p => p.trim()).filter(Boolean);
  if (parts.length === 0) return "";

  // Si un seul composant et qu'il s'agit d'un pays reconnu (ex: "Îles Maurice", "Maurice", "France", "Tunisie")
  // alors ce n'est PAS une ville
  if (parts.length === 1 && (isRecognizedCountry(parts[0]) || COUNTRY_ALIASES[parts[0].toLowerCase()])) {
    return "";
  }

  // Si le format est "Sortie Kharjet, Gammarth", la ville est "Gammarth"
  if (parts[0].toLowerCase().startsWith("sortie kharjet") && parts.length > 1) {
    const raw = parts[1];
    if (isRecognizedCountry(raw) || COUNTRY_ALIASES[raw.toLowerCase()]) return "";
    return normalizeCityName(raw);
  }

  // Si format "Spot, Ville, Pays" (3+ composants), la ville est l'avant-dernière
  if (parts.length >= 3) {
    const candidate = parts[parts.length - 2];
    if (isRecognizedCountry(candidate) || COUNTRY_ALIASES[candidate.toLowerCase()]) return "";
    return normalizeCityName(candidate);
  }

  // Si format "Ville, Pays" où la 2e partie est un pays reconnu
  if (parts.length === 2 && (isRecognizedCountry(parts[1]) || COUNTRY_ALIASES[parts[1].toLowerCase()])) {
    const raw = parts[0];
    if (isRecognizedCountry(raw) || COUNTRY_ALIASES[raw.toLowerCase()]) return "";
    return normalizeCityName(raw);
  }

  // Si format "Spot, Ville" où la 2e partie est une ville connue
  if (parts.length === 2 && CITY_TO_COUNTRY[parts[1].toLowerCase()]) {
    const raw = parts[1];
    return normalizeCityName(raw);
  }

  // Si format à 2 composants et que les 2 sont des pays reconnus (ex: "Îles Maurice, Maurice")
  if (parts.length === 2 && 
      (isRecognizedCountry(parts[0]) || COUNTRY_ALIASES[parts[0].toLowerCase()]) && 
      (isRecognizedCountry(parts[1]) || COUNTRY_ALIASES[parts[1].toLowerCase()])) {
    return "";
  }

  const rawCity = parts[0];
  if (isRecognizedCountry(rawCity) || COUNTRY_ALIASES[rawCity.toLowerCase()]) {
    // Si la 1ère partie est un pays et la 2e partie n'en est pas un, tester la 2e partie
    if (parts.length > 1 && !isRecognizedCountry(parts[1]) && !COUNTRY_ALIASES[parts[1].toLowerCase()]) {
      return normalizeCityName(parts[1]);
    }
    return "";
  }

  return normalizeCityName(rawCity);
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
    const text = format(date, 'd MMM yy', { locale: fr }).replace(/\./g, '');
    return text.replace(/\b([a-z])/g, (_, char) => char.toUpperCase());
  } catch {
    return '';
  }
};

const normalizeForAbbreviation = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

// Abbreviate city names for display
export const abbreviateCity = (city: string): string => {
  if (!city) return '';

  const normalized = normalizeForAbbreviation(city);

  const exactAbbreviations: Record<string, string> = {
    'saint-petersbourg': 'St-Petersbourg',
    'saint petersbourg': 'St-Petersbourg',
    'saint-petersburg': 'St-Petersbourg',
    'saint petersburg': 'St-Petersbourg',
    'saint-pierre': 'St-Pierre',
    'saint pierre': 'St-Pierre',
    'monte-carlo': 'Mte Carlo',
    'monte carlo': 'Mte Carlo',
  };

  if (exactAbbreviations[normalized]) return exactAbbreviations[normalized];

  const prefixAbbreviations: Record<string, string> = {
    'sainte-': 'Ste-',
    'sainte ': 'Ste-',
    'saint-': 'St-',
    'saint ': 'St-',
  };

  for (const [prefix, abbr] of Object.entries(prefixAbbreviations)) {
    if (normalized.startsWith(prefix)) {
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

// Convert ISO 2-letter country code to emoji flag
export function getFlagEmojiByCode(countryCode: string): string {
  if (!countryCode) return "";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map(char => 127397 + char.charCodeAt(0));
  try {
    return String.fromCodePoint(...codePoints);
  } catch (e) {
    return "";
  }
}

// Get flag emoji from country name
export function getFlagEmoji(countryName: string): string {
  if (!countryName) return "";
  const normalized = getCountry(countryName).trim().toLowerCase();
  
  // Search in countries database
  const match = countries.find(
    c => c.label.toLowerCase() === normalized || 
         c.enLabel.toLowerCase() === normalized ||
         c.value.toLowerCase() === normalized
  );
  
  if (match) {
    return getFlagEmojiByCode(match.value);
  }
  
  // Hardcoded fallback for common names just in case
  const commonFallbacks: Record<string, string> = {
    "france": "FR",
    "maroc": "MA",
    "algérie": "DZ",
    "tunisie": "TN",
    "espagne": "ES",
    "italie": "IT",
    "allemagne": "DE",
    "royaume-uni": "GB",
    "états-unis": "US",
    "usa": "US",
    "canada": "CA",
    "belgique": "BE",
    "suisse": "CH",
    "japon": "JP",
    "chine": "CN",
    "pays-bas": "NL",
    "croatie": "HR",
    "croatia": "HR",
    "maurice": "MU",
    "mauritius": "MU",
    "îles maurice": "MU",
    "iles maurice": "MU",
    "îles maurices": "MU",
    "iles maurices": "MU"
  };
  
  const code = commonFallbacks[normalized];
  if (code) {
    return getFlagEmojiByCode(code);
  }
  
  return "";
}

