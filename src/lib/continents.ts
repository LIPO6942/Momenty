export const countryToContinent: Record<string, string> = {
  // Europe
  "France": "Europe", "Germany": "Europe", "Italy": "Europe", "Spain": "Europe", "United Kingdom": "Europe",
  "Portugal": "Europe", "Belgium": "Europe", "Netherlands": "Europe", "Switzerland": "Europe", "Austria": "Europe",
  "Greece": "Europe", "Sweden": "Europe", "Norway": "Europe", "Denmark": "Europe", "Finland": "Europe",
  "Ireland": "Europe", "Poland": "Europe", "Czech Republic": "Europe", "Hungary": "Europe", "Romania": "Europe",
  "Bulgaria": "Europe", "Croatia": "Europe", "Slovakia": "Europe", "Slovenia": "Europe", "Estonia": "Europe",
  "Latvia": "Europe", "Lithuania": "Europe", "Cyprus": "Europe", "Malta": "Europe", "Iceland": "Europe",
  "Russia": "Europe", "Ukraine": "Europe", "Belarus": "Europe", "Moldova": "Europe", "Albania": "Europe",
  "Serbia": "Europe", "Bosnia and Herzegovina": "Europe", "Montenegro": "Europe", "Macedonia": "Europe",
  "Andorra": "Europe", "Monaco": "Europe", "San Marino": "Europe", "Vatican City": "Europe",

  // Asia
  "China": "Asie", "Japan": "Asie", "South Korea": "Asie", "India": "Asie", "Thailand": "Asie",
  "Vietnam": "Asie", "Indonesia": "Asie", "Malaysia": "Asie", "Singapore": "Asie", "Philippines": "Asie",
  "Turkey": "Asie", "Saudi Arabia": "Asie", "United Arab Emirates": "Asie", "Israel": "Asie", "Jordan": "Asie",
  "Lebanon": "Asie", "Pakistan": "Asie", "Bangladesh": "Asie", "Sri Lanka": "Asie", "Nepal": "Asie",
  "Kazakhstan": "Asie", "Uzbekistan": "Asie", "Cambodia": "Asie", "Laos": "Asie", "Myanmar": "Asie",
  "Mongolia": "Asie", "Taiwan": "Asie", "Hong Kong": "Asie", "Armenia": "Asie", "Georgia": "Asie",
  "Azerbaijan": "Asie", "Qatar": "Asie", "Kuwait": "Asie", "Oman": "Asie",

  // Africa
  "Morocco": "Afrique", "Egypt": "Afrique", "South Africa": "Afrique", "Nigeria": "Afrique", "Kenya": "Afrique",
  "Algeria": "Afrique", "Tunisia": "Afrique", "Ethiopia": "Afrique", "Ghana": "Afrique", "Senegal": "Afrique",
  "Tanzania": "Afrique", "Uganda": "Afrique", "Madagascar": "Afrique", "Mauritius": "Afrique", "Ivory Coast": "Afrique",
  "Cameroon": "Afrique", "Angola": "Afrique", "Zambia": "Afrique", "Zimbabwe": "Afrique", "Namibia": "Afrique",

  // North America
  "United States": "Amérique du Nord", "Canada": "Amérique du Nord", "Mexico": "Amérique du Nord",
  "Cuba": "Amérique du Nord", "Jamaica": "Amérique du Nord", "Costa Rica": "Amérique du Nord", "Panama": "Amérique du Nord",
  "Guatemala": "Amérique du Nord", "Bahamas": "Amérique du Nord", "Dominican Republic": "Amérique du Nord",

  // South America
  "Brazil": "Amérique du Sud", "Argentina": "Amérique du Sud", "Chile": "Amérique du Sud", "Colombia": "Amérique du Sud",
  "Peru": "Amérique du Sud", "Uruguay": "Amérique du Sud", "Bolivia": "Amérique du Sud", "Ecuador": "Amérique du Sud",
  "Paraguay": "Amérique du Sud", "Venezuela": "Amérique du Sud",

  // Oceania
  "Australia": "Océanie", "New Zealand": "Océanie", "Fiji": "Océanie", "Papua New Guinea": "Océanie",
  "French Polynesia": "Océanie",

  // Antarctica
  "Antarctica": "Antarctique"
};

export const continents = [
  { id: "Europe", label: "Europe", totalCountries: 44, icon: "🏰" },
  { id: "Asie", label: "Asie", totalCountries: 48, icon: "⛩️" },
  { id: "Afrique", label: "Afrique", totalCountries: 54, icon: "🐘" },
  { id: "Amérique du Nord", label: "Amérique du Nord", totalCountries: 23, icon: "🗽" },
  { id: "Amérique du Sud", label: "Amérique du Sud", totalCountries: 12, icon: "⛰️" },
  { id: "Océanie", label: "Océanie", totalCountries: 14, icon: "🏄" },
  { id: "Antarctique", label: "Antarctique", totalCountries: 1, icon: "🐧" },
];

export const getExplorerGrade = (countryCount: number, cityCount: number) => {
  const total = countryCount + (cityCount / 3);
  if (total === 0) return { title: "Spectateur", icon: "👀", color: "text-gray-400" };
  if (total <= 2) return { title: "Petit Voyageur", icon: "🎒", color: "text-green-500" };
  if (total <= 5) return { title: "Nomade Curieux", icon: "📸", color: "text-blue-500" };
  if (total <= 12) return { title: "Grand Explorateur", icon: "🛶", color: "text-purple-500" };
  if (total <= 25) return { title: "Ambassadeur du Monde", icon: "🏛️", color: "text-amber-500" };
  return { title: "Légende Intemporelle", icon: "👑", color: "text-red-600 animate-pulse" };
};
