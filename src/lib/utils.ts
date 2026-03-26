import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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
    "indonesia": "Indonésie",
    "indonesie": "Indonésie",
    "indonésie": "Indonésie",
    "thailand": "Thaïlande",
    "thaïlande": "Thaïlande",
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
    "belgique": "Belgique"
  };

  if (aliases[lower]) return aliases[lower];

  return rawCountry.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

export const getCity = (loc: string) => {
  if (!loc) return "";
  const parts = loc.split(",");
  const city = parts[0].trim();
  return city.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};
