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
// Every country has multiple photos so daily rotation works everywhere.
// Tunisia gets the most (many entries expected).
// ---------------------------------------------------------------------------
const COUNTRY_BG_PHOTOS: Record<string, string[]> = {

  // ── Tunisie ── 8 photos variées (paysages larges emblématiques)
  "tunisie": [
    "1564507592333-c60657eea523", // Sidi Bou Said — maisons bleues & blanches
    "1516690561799-46d8f74f9244", // Médina de Tunis — ruelles colorées
    "1506905925346-21bda4d32df4", // Sahara tunisien — dunes dorées
    "1509316785289-025f5b846b35", // Désert & dunes au coucher du soleil
    "1471115853179-430bde9a9a7e", // Côte méditerranéenne turquoise
    "1586348943529-beaae6c28db9", // Chott el-Djerid — lac salé miroir
    "1519451241324-20b4ea2c4220", // Amphithéâtre d'El Jem — arènes romaines
    "1547036967-3530c2256d02", // Palmeraie de Tozeur — oasis
  ],

  // ── France ── 4 photos
  "france": [
    "1502602898657-3e91760cbb34", // Paris / Tour Eiffel
    "1520250497591-112f2f40a3f4", // Provence lavande
    "1499856871958-5b9627545d1a", // Rue parisienne
    "1504609813442-a8924e83f76e", // Mont-Saint-Michel
  ],

  // ── Italie ── 4 photos
  "italie": [
    "1529260830199-42c24126f198", // Rome / Colisée
    "1523906834658-6e24ef2386f9", // Venise canaux
    "1534445867742-43195f401b6c", // Côte Amalfitaine
    "1512343879966-a3abd00db0bd", // Toscane collines
  ],

  // ── Espagne ── 4 photos
  "espagne": [
    "1543785734-4b6e564642f8",   // Barcelone
    "1502602898506-b8e1e71a15a6", // Alhambra de Grenade
    "1558618666-fcd25c85cd64",   // Flamenco / Séville
    "1501854140801-50d01698950b", // Paysage espagnol
  ],

  // ── Maroc ── 3 photos
  "maroc": [
    "1512632578888-169bbbc64f33", // Marrakech souks
    "1548504769-900b70ed1519",   // Chefchaouen bleu
    "1547234935-80f7a3f6dbbd",   // Sahara marocain
  ],

  // ── Grèce ── 3 photos
  "grece": [
    "1555993539-1732b0258235",   // Santorin maisons bleues
    "1603565816030-6b389eeb23cb", // Athènes Acropole
    "1533105079780-92b9be482077", // Mykonos
  ],

  // ── Maurice ── 3 photos
  "maurice": [
    "1540202404-1b927e27fa8b",   // Lagon turquoise
    "1507525428034-b723cf961d3e", // Plage tropicale
    "1544551763-46a013bb70d5",   // Île verdoyante
  ],

  // ── Portugal ── 3 photos
  "portugal": [
    "1548707930-f208cb9ab5b8",   // Lisbonne tramway
    "1555881400-74d7acaacd47",   // Porto Douro
    "1513735492246-483525079686", // Sintra palais
  ],

  // ── Croatie ── 3 photos
  "croatie": [
    "1555990793-da04e4a4b4dd",   // Dubrovnik remparts
    "1562271887-f66a2e3eeaca",   // Plitvice lacs
    "1507608158173-1dcec673a103", // Côte dalmate
  ],

  // ── Turquie ── 3 photos
  "turquie": [
    "1541432901042-2d8bd64b4a9b", // Cappadoce ballons
    "1524231757912-21f4fe3a7200", // Bosphore Istanbul
    "1548159890-90e9b7023ee8",   // Hagia Sophia
  ],

  // ── Japon ── 3 photos
  "japon": [
    "1528360983277-13d401cdc186", // Tokyo Shibuya
    "1545569341-9eb8b30979d9",   // Mont Fuji cerisiers
    "1493976040374-85c8e12f0c0e", // Temple kyoto
  ],

  // ── Algérie ── 2 photos
  "algerie": [
    "1590756254933-2873d72a83b6", // Paysage algérien
    "1547483238-2313d0e8fdb4",   // Casbah d'Alger
  ],

  // ── Égypte ── 2 photos
  "egypte": [
    "1539650116574-75c0c6d73f6e", // Pyramides de Gizeh
    "1553913861-c0fddf2619b9",   // Louxor temple
  ],

  // ── Sénégal ── 2 photos
  "senegal": [
    "1583249598754-b7a2f59651fb", // Sénégal paysage
    "1568515387631-8b650bbcdb90", // Lac rose Retba
  ],

  // ── Thaïlande ── 2 photos
  "thaïlande": [
    "1528181304800-259b08848526", // Plage tropicale
    "1506461883276-594a12b11093", // Temple bangkok
  ],

  // ── Dubaï / Émirats ── 2 photos
  "dubai": [
    "1512453979798-5ea266f8880c", // Dubaï skyline
    "1546412414-e45e7e32f57c",   // Désert Émirats
  ],

  // ── États-Unis ── 2 photos
  "usa": [
    "1485738422979-f5ef3d362c28", // NYC skyline
    "1501594907352-04cda38ebc29", // Grand Canyon
  ],

  // ── Canada ── 2 photos
  "canada": [
    "1494519870370-1b212fa4e0ac", // Montagnes Rocheuses
    "1517137374823-b1929fb35c7c", // Niagara falls
  ],

  // ── Allemagne ── 2 photos
  "allemagne": [
    "1467269204908-d98c17d7f63d", // Château Neuschwanstein
    "1528360983277-13d401cdc186", // Berlin
  ],

  // ── Pays-Bas ── 2 photos
  "pays-bas": [
    "1512470876302-972faa2aa98a", // Amsterdam canaux
    "1558618047-3b6ab8af3bfe",   // Champs de tulipes
  ],

  // ── Russie ── 3 photos
  "russie": [
    "1513326738677-b964603b136d", // Moscou — Place Rouge & Saint-Basile
    "1547153467-a29f81614ac9",   // Saint-Pétersbourg — Hermitage & canaux
    "1520453803296-55360c2f43e4", // Lac Baïkal — panorama hivernal
  ],

  // ── Philippines ── 3 photos
  "philippines": [
    "1518509562399-e587c6b5e686", // El Nido Palawan — lagons turquoise
    "1504802635467-df54a8540fb9", // Rizières en terrasses Banaue
    "1565967752-082ae55f0a1d",   // Île tropicale au coucher du soleil
  ],

  // ── Indonésie ── 3 photos
  "indonesie": [
    "1537996134470-f30c9a5a2fd9", // Bali — rizières de Tegallalang
    "1580673971767-5d5c7b6da16e", // Temple Tanah Lot — coucher de soleil
    "1516690561799-46d8f74f9244", // Volcan / paysage naturel
  ],

  // ── Malaisie ── 3 photos
  "malaisie": [
    "1526481280693-3bfa7568e0f3", // Kuala Lumpur — Petronas Towers
    "1508964942454-1a3dd264c89d", // Langkawi — jungle et plages
    "1536003407894-a6b01e8bb8a4", // Cameron Highlands — thé vert
  ],

  // ── Vietnam ── 3 photos
  "vietnam": [
    "1528360983277-13d401cdc186", // Hanoï vieille ville
    "1570366583862-f91883a08cd6", // Baie d'Ha Long — karsts calcaires
    "1523731407965-2430cd12f5e4", // Rizières de Sapa en terrasses
  ],

  // ── Inde ── 3 photos
  "inde": [
    "1524492412937-b28074a5d7da", // Taj Mahal au lever du soleil
    "1477587458883-47145ed31602", // Rajasthan — palais colorés
    "1582560474978-80e5571cfd48", // Varanasi — rives du Gange
  ],

  // ── Chine ── 3 photos
  "chine": [
    "1508804185872-4aca6b37b01b", // Grande Muraille de Chine
    "1474181487882-5abf3f0ba6c2", // Shanghai — Pudong skyline
    "1513415431253-1a3b4df8f0d2", // Guilin — monts karstiques
  ],

  // ── Australie ── 2 photos
  "australie": [
    "1524293581917-878a6347a0ff", // Sydney Opera House
    "1529108190613-71e39534f300", // Uluru (Ayers Rock) coucher de soleil
  ],

  // ── Brésil ── 2 photos
  "bresil": [
    "1483729558449-99ef09a8c325", // Rio de Janeiro — Pain de Sucre
    "1518105779142-d975f22f1b0a", // Amazonie / forêt tropicale
  ],

  // ── Mexique ── 2 photos
  "mexique": [
    "1518638150340-f706e86654de", // Chichen Itza pyramides mayas
    "1512813195386-6cf811ad3542", // Plages de Tulum turquoise
  ],

  // ── Pérou ── 2 photos
  "perou": [
    "1526392060635-9d6019884377", // Machu Picchu — cité inca
    "1483728642387-6c3bdd6c93e5", // Montagne des 7 couleurs / Vinicunca
  ],

  // ── Suisse ── 2 photos
  "suisse": [
    "1527668752968-14dc70a786f8", // Alpes suisses enneigées
    "1506905925346-21bda4d32df4", // Lac de montagne alpin
  ],

  // ── Belgique ── 2 photos
  "belgique": [
    "1491557345352-5929e343eb89", // Bruges — canaux médiévaux
    "1559329671-f36cfab93c33",   // Bruxelles — Grand-Place
  ],

  // ── Autriche ── 2 photos
  "autriche": [
    "1516550135993-f73fe87e66b0", // Vienne — Schönbrunn
    "1531804054935-891670a93eb0", // Hallstatt — village alpin lacustre
  ],

  // ── Suède ── 2 photos
  "suede": [
    "1509356843962-f10d7f4892e8", // Stockholm — Gamla Stan
    "1531123897727-d4b0f6e52e40", // Aurores boréales Laponie
  ],

  // ── Pologne ── 2 photos
  "pologne": [
    "1506905925346-21bda4d32df4", // Cracovie — vieille ville
    "1558618666-fcd25c85cd64",   // Monts Tatras
  ],

  // ── Arménie ── 2 photos
  "armenie": [
    "1565999869598-50b64adf0b67", // Monastère Khor Virap et Ararat
    "1548014129-91283bdaf2f9",   // Paysage arménien montagneux
  ],

  // ── Géorgie ── 2 photos
  "georgie": [
    "1519671282429-b874cde7b7c2", // Tbilissi — vieille ville colorée
    "1551993429-b7b96d72b07a",   // Kazbegi — Trinité Gergeti & Caucase
  ],

};


/**
 * Returns an Unsplash background photo URL for the given country name.
 * `seed` is a numeric value (e.g. derived from the dayKey) used to rotate
 * photos — each day of the same country gets a different image.
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
      // w=900&h=200 matches the banner proportions; fit=crop ensures full cover
      return `https://images.unsplash.com/photo-${photoIds[idx]}?w=900&h=200&fit=crop&crop=entropy&q=75`;
    }
  }

  return null;
}

