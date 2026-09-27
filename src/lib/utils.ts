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

// Format instant location only: "ville, pays" (sans date)
export const formatInstantLocation = (location: string): string => {
  const city = abbreviateCity(getCity(location));
  const country = getCountry(location);

  if (!city && !country) return '';
  return `${city}${city && country ? ', ' : ''}${country}`;
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

// ---------------------------------------------------------------------------
// Country background photos for timeline group headers
// Tunisia gets multiple photos that rotate per day (many entries expected).
// Other countries use 1–2 iconic shots.
// ---------------------------------------------------------------------------
const COUNTRY_BG_PHOTOS: Record<string, string[]> = {
  // Tunisie — plusieurs photos pour varier chaque journée
  "tunisie": [
    "1564507592333-c60657eea523", // Sidi Bou Said bleu & blanc
    "1539037116277-4db20889f2d4", // Dunes du Sahara
    "1578895101408-1a36b5e1efec", // Médina de Tunis
    "1548013146-72479768bada",    // Désert / paysage
    "1556103255-4443dbae8e5a",   // Côte méditerranéenne
    "1614551718538-e1e02e7dfb79", // Ruines romaines (El Jem)
    "1582555172866-f73bb12a2ab3", // Palmeraie / oasis
    "1560679735-c7f4fe2cc62c",   // Port de pêche tunisien
  ],
  // Autres pays — 1 ou 2 clichés emblématiques
  "france":    ["1502602898657-3e91760cbb34"], // Paris / Eiffel
  "italie":    ["1529260830199-42c24126f198"], // Rome / Colisée
  "espagne":   ["1543785734-4b6e564642f8"],  // Barcelone / Espagne
  "maroc":     ["1512632578888-169bbbc64f33"],// Marrakech souks
  "algerie":   ["1590756254933-2873d72a83b6"],// Algérie paysage
  "egypte":    ["1539650116574-75c0c6d73f6e"],// Pyramides
  "croatie":   ["1555990793-da04e4a4b4dd"], // Dubrovnik
  "grece":     ["1555993539-1732b0258235"], // Santorin
  "turquie":   ["1541432901042-2d8bd64b4a9b"],// Cappadoce
  "maurice":   ["1540202404-1b927e27fa8b"], // Lagon de Maurice
  "portugal":  ["1548707930-f208cb9ab5b8"], // Lisbonne
  "japon":     ["1528360983277-13d401cdc186"],// Tokyo / Japon
  "thaïlande": ["1528181304800-259b08848526"],// Thaïlande plage
  "senegal":   ["1583249598754-b7a2f59651fb"],// Sénégal
  "dubai":     ["1512453979798-5ea266f8880c"],// Dubaï skyline
  "usa":       ["1485738422979-f5ef3d362c28"],// NYC / USA
  "canada":    ["1494519870370-1b212fa4e0ac"],// Canada nature
  "london":    ["1513635269975-59663e0ac1ad"],// Londres
  "allemagne": ["1467269204908-d98c17d7f63d"],// Allemagne
  "pays-bas":  ["1512470876302-972faa2aa98a"],// Amsterdam
};

/**
 * Returns an Unsplash background photo URL for the given country name.
 * `seed` is a numeric value (e.g. derived from the dayKey) used to rotate
 * photos for countries that have multiple entries (esp. Tunisia).
 * Returns `null` if the country is unknown.
 */
export function getCountryBgPhoto(countryName: string, seed: number): string | null {
  if (!countryName) return null;

  // Normalize: lowercase + strip accents
  const norm = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const normalizedInput = norm(countryName);

  for (const [key, photoIds] of Object.entries(COUNTRY_BG_PHOTOS)) {
    const keyNorm = norm(key);
    if (normalizedInput.includes(keyNorm) || keyNorm.includes(normalizedInput)) {
      const idx = Math.abs(seed) % photoIds.length;
      return `https://images.unsplash.com/photo-${photoIds[idx]}?w=900&h=180&fit=crop&q=75`;
    }
  }

  return null;
}

