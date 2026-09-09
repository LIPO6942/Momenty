import { countries } from "./countries";
import { getCountry, getFlagEmojiByCode } from "./utils";

export interface DestinationAssets {
  countryCode: string;
  countryName: string;
  flagUrl: string;
  flagSvgUrl: string;
  flagEmoji: string;
  clichePhoto: string;
  landmarkName: string;
}

// Photos clichés emblématiques de haute qualité pour les destinations majeures
const CURATED_DESTINATION_PHOTOS: Record<string, { photo: string; landmark: string }> = {
  FR: {
    photo: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1600&q=80",
    landmark: "Tour Eiffel, Paris"
  },
  IT: {
    photo: "https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=1600&q=80",
    landmark: "Colisée, Rome"
  },
  ES: {
    photo: "https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=1600&q=80",
    landmark: "Sagrada Familia, Barcelone"
  },
  JP: {
    photo: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1600&q=80",
    landmark: "Mont Fuji & Kyoto"
  },
  MA: {
    photo: "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?auto=format&fit=crop&w=1600&q=80",
    landmark: "Médina & Architecture, Maroc"
  },
  GR: {
    photo: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1600&q=80",
    landmark: "Santorin & Mer Égée"
  },
  GB: {
    photo: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1600&q=80",
    landmark: "Big Ben & Pont de Londres"
  },
  US: {
    photo: "https://images.unsplash.com/photo-1485738422979-f5c462d49f74?auto=format&fit=crop&w=1600&q=80",
    landmark: "Statue de la Liberté, New York"
  },
  PT: {
    photo: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1600&q=80",
    landmark: "Tramway & Ruelles de Lisbonne"
  },
  TH: {
    photo: "https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1600&q=80",
    landmark: "Temples & Baies de Thaïlande"
  },
  EG: {
    photo: "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1600&q=80",
    landmark: "Grandes Pyramides de Gizeh"
  },
  ID: {
    photo: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1600&q=80",
    landmark: "Rizières & Temples de Bali"
  },
  CA: {
    photo: "https://images.unsplash.com/photo-1503614472-8c93d56e92ce?auto=format&fit=crop&w=1600&q=80",
    landmark: "Lac Louise, Rocheuses Canadiennes"
  },
  CH: {
    photo: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1600&q=80",
    landmark: "Mont Cervin & Alpes Suisses"
  },
  DE: {
    photo: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1600&q=80",
    landmark: "Château de Neuschwanstein"
  },
  TR: {
    photo: "https://images.unsplash.com/photo-1527838832700-5059252407fa?auto=format&fit=crop&w=1600&q=80",
    landmark: "Montgolfières de Cappadoce"
  },
  DZ: {
    photo: "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=1600&q=80",
    landmark: "Casbah & Dunes du Sahara"
  },
  TN: {
    photo: "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1600&q=80",
    landmark: "Sidi Bou Saïd & Carthage"
  },
  MX: {
    photo: "https://images.unsplash.com/photo-1512813195386-6cf811ad3542?auto=format&fit=crop&w=1600&q=80",
    landmark: "Pyramide Chichén Itzá"
  },
  BR: {
    photo: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=1600&q=80",
    landmark: "Le Christ Rédempteur, Rio"
  },
  AU: {
    photo: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1600&q=80",
    landmark: "Opéra de Sydney"
  },
  NL: {
    photo: "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=1600&q=80",
    landmark: "Canaux & Moulins d'Amsterdam"
  },
  IS: {
    photo: "https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=1600&q=80",
    landmark: "Cascades & Aurores Boréales"
  },
  VN: {
    photo: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1600&q=80",
    landmark: "Baie d'Ha Long"
  },
  NO: {
    photo: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1600&q=80",
    landmark: "Fjords de Norvège"
  },
  AE: {
    photo: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=80",
    landmark: "Burj Khalifa, Dubaï"
  },
  AT: {
    photo: "https://images.unsplash.com/photo-1516550893923-42d28e5677af?auto=format&fit=crop&w=1600&q=80",
    landmark: "Hallstatt & Palais Viennois"
  },
  HR: {
    photo: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1600&q=80",
    landmark: "Remparts de Dubrovnik"
  },
  PE: {
    photo: "https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=1600&q=80",
    landmark: "Machu Picchu"
  },
  IN: {
    photo: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1600&q=80",
    landmark: "Taj Mahal, Agra"
  },
  CN: {
    photo: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=1600&q=80",
    landmark: "La Grande Muraille de Chine"
  },
  KR: {
    photo: "https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=1600&q=80",
    landmark: "Palais Gyeongbokgung, Séoul"
  },
  ZA: {
    photo: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=1600&q=80",
    landmark: "Montagne de la Table, Le Cap"
  },
  CO: {
    photo: "https://images.unsplash.com/photo-1583566160301-2eed98718339?auto=format&fit=crop&w=1600&q=80",
    landmark: "Ruelles colorées de Carthagène"
  },
  CU: {
    photo: "https://images.unsplash.com/photo-1500759285222-a95626b934cb?auto=format&fit=crop&w=1600&q=80",
    landmark: "Voitures classiques à La Havane"
  },
  AR: {
    photo: "https://images.unsplash.com/photo-1589909202802-8f4aadce1849?auto=format&fit=crop&w=1600&q=80",
    landmark: "Buenos Aires & Chutes d'Iguazú"
  },
  BE: {
    photo: "https://images.unsplash.com/photo-1559113513-d5e09c78b9dd?auto=format&fit=crop&w=1600&q=80",
    landmark: "Canaux de Bruges & Grand-Place"
  },
  IE: {
    photo: "https://images.unsplash.com/photo-1590089415225-401ed6f9db8e?auto=format&fit=crop&w=1600&q=80",
    landmark: "Falaises de Moher & Nature"
  },
  SE: {
    photo: "https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=1600&q=80",
    landmark: "Gamla Stan, Stockholm"
  },
  DK: {
    photo: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1600&q=80",
    landmark: "Nyhavn, Copenhague"
  },
  JO: {
    photo: "https://images.unsplash.com/photo-1579606032834-d3434685ff41?auto=format&fit=crop&w=1600&q=80",
    landmark: "Le Trésor de Pétra"
  },
  MY: {
    photo: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=1600&q=80",
    landmark: "Tours Petronas, Kuala Lumpur"
  },
  SG: {
    photo: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1600&q=80",
    landmark: "Marina Bay Sands & Supertrees"
  },
  NZ: {
    photo: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=80",
    landmark: "Paysages spectaculaires de Nouvelle-Zélande"
  },
  CZ: {
    photo: "https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&w=1600&q=80",
    landmark: "Pont Charles, Prague"
  },
  HU: {
    photo: "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1600&q=80",
    landmark: "Parlement de Budapest"
  },
  PL: {
    photo: "https://images.unsplash.com/photo-1519197924294-4ba991a11128?auto=format&fit=crop&w=1600&q=80",
    landmark: "Vieille ville de Cracovie"
  },
  RO: {
    photo: "https://images.unsplash.com/photo-1584646098378-0874589d76b1?auto=format&fit=crop&w=1600&q=80",
    landmark: "Château de Bran, Transylvanie"
  },
  FI: {
    photo: "https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=1600&q=80",
    landmark: "Laponie & Forêts Finlandaises"
  },
  MU: {
    photo: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1600&q=80",
    landmark: "Le Morne Brabant & Lagons de l'Île Maurice"
  },
  CR: {
    photo: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80",
    landmark: "Volcan Arenal & Forêt Tropicale, Costa Rica"
  },
  LK: {
    photo: "https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=1600&q=80",
    landmark: "Rocher de Sigiriya & Plantations de thé, Sri Lanka"
  },
  PH: {
    photo: "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1600&q=80",
    landmark: "Lagons d'El Nido & Plages, Philippines"
  },
  MV: {
    photo: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1600&q=80",
    landmark: "Villas sur pilotis & Atolls turquoise, Maldives"
  },
  SC: {
    photo: "https://images.unsplash.com/photo-1589979481223-deb893043163?auto=format&fit=crop&w=1600&q=80",
    landmark: "Anse Source d'Argent & Rochers Granitiques, Seychelles"
  },
  DO: {
    photo: "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=1600&q=80",
    landmark: "Plages de Punta Cana & Île Saona, Rép. Dominicaine"
  },
  SN: {
    photo: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1600&q=80",
    landmark: "Île de Gorée & Lac Rose, Sénégal"
  },
  KE: {
    photo: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1600&q=80",
    landmark: "Safari Masaï Mara & Kilimandjaro, Kenya"
  },
  TZ: {
    photo: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1600&q=80",
    landmark: "Plages de Zanzibar & Parc du Serengeti, Tanzanie"
  },
  CL: {
    photo: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1600&q=80",
    landmark: "Torres del Paine & Désert d'Atacama, Chili"
  },
  MT: {
    photo: "https://images.unsplash.com/photo-1563298723-dcfebaa392e3?auto=format&fit=crop&w=1600&q=80",
    landmark: "Cité fortifiée de La Valette, Malte"
  },
  CY: {
    photo: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1600&q=80",
    landmark: "Rocher d'Aphrodite & Côtes de Chypre"
  },
  MC: {
    photo: "https://images.unsplash.com/photo-1533929736458-ca588d08c8be?auto=format&fit=crop&w=1600&q=80",
    landmark: "Port Hercule & Le Rocher, Monaco"
  },
  QA: {
    photo: "https://images.unsplash.com/photo-1568084680786-a84f91d1153c?auto=format&fit=crop&w=1600&q=80",
    landmark: "Skyline de Doha & Corniche, Qatar"
  },
  SA: {
    photo: "https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?auto=format&fit=crop&w=1600&q=80",
    landmark: "Al-Ula & Mada'in Saleh, Arabie Saoudite"
  },
  LB: {
    photo: "https://images.unsplash.com/photo-1579606032834-d3434685ff41?auto=format&fit=crop&w=1600&q=80",
    landmark: "Temples de Baalbek & Rochers des Pigeons, Liban"
  },
  OM: {
    photo: "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=1600&q=80",
    landmark: "Grande Mosquée & Dunes de Wahiba, Oman"
  },
  KH: {
    photo: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
    landmark: "Cité sacrée d'Angkor Wat, Cambodge"
  },
  NP: {
    photo: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1600&q=80",
    landmark: "Sommets de l'Himalaya & Katmandou, Népal"
  },
  TW: {
    photo: "https://images.unsplash.com/photo-1508247967583-7d982ea01526?auto=format&fit=crop&w=1600&q=80",
    landmark: "Tour Taipei 101 & Marchés traditionnels, Taïwan"
  },
  HK: {
    photo: "https://images.unsplash.com/photo-1506970845036-3d290572644e?auto=format&fit=crop&w=1600&q=80",
    landmark: "Victoria Harbour & Victoria Peak, Hong Kong"
  },
  LU: {
    photo: "https://images.unsplash.com/photo-1584646098378-0874589d76b1?auto=format&fit=crop&w=1600&q=80",
    landmark: "Pont Adolphe & Vieille Ville, Luxembourg"
  },
  SK: {
    photo: "https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&w=1600&q=80",
    landmark: "Château de Bratislava & Hautes Tatras, Slovaquie"
  },
  SI: {
    photo: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80",
    landmark: "Lac de Bled & Île Sainte-Marie, Slovénie"
  },
  RS: {
    photo: "https://images.unsplash.com/photo-1516550893923-42d28e5677af?auto=format&fit=crop&w=1600&q=80",
    landmark: "Forteresse de Kalemegdan, Belgrade, Serbie"
  },
  ME: {
    photo: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1600&q=80",
    landmark: "Bouches de Kotor & Mer Adriatique, Monténégro"
  },
  AL: {
    photo: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1600&q=80",
    landmark: "Riviera Albanaise & Cité de Berat, Albanie"
  },
  GE: {
    photo: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=80",
    landmark: "Église Sainte-Trinité de Guerguéti, Géorgie"
  },
  MG: {
    photo: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
    landmark: "Allée des Baobabs & Nosy Be, Madagascar"
  },
  CI: {
    photo: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1600&q=80",
    landmark: "Basilique Notre-Dame de Yamoussoukro, Côte d'Ivoire"
  },
  CM: {
    photo: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1600&q=80",
    landmark: "Mont Cameroun & Chutes d'Ekom Nkam, Cameroun"
  },
  IL: {
    photo: "https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&w=1600&q=80",
    landmark: "Vieille Ville de Jérusalem & Dôme du Rocher"
  },
  RU: {
    photo: "https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1600&q=80",
    landmark: "Place Rouge & Cathédrale Saint-Basile, Moscou"
  }
};

const DEFAULT_FALLBACK_PHOTO = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1600&q=80";

const COMMON_COUNTRY_ALIASES: Record<string, string> = {
  france: "FR",
  maroc: "MA",
  morocco: "MA",
  algérie: "DZ",
  algerie: "DZ",
  algeria: "DZ",
  tunisie: "TN",
  tunisia: "TN",
  espagne: "ES",
  spain: "ES",
  italie: "IT",
  italy: "IT",
  allemagne: "DE",
  germany: "DE",
  royaumeuni: "GB",
  royaume_uni: "GB",
  royaume_uni_angleterre: "GB",
  "royaume-uni": "GB",
  angleterre: "GB",
  england: "GB",
  uk: "GB",
  "états-unis": "US",
  "etats-unis": "US",
  etatsunis: "US",
  usa: "US",
  "united states": "US",
  canada: "CA",
  belgique: "BE",
  belgium: "BE",
  suisse: "CH",
  switzerland: "CH",
  japon: "JP",
  japan: "JP",
  chine: "CN",
  china: "CN",
  brésil: "BR",
  bresil: "BR",
  brazil: "BR",
  paysbas: "NL",
  "pays-bas": "NL",
  netherlands: "NL",
  grèce: "GR",
  grece: "GR",
  greece: "GR",
  portugal: "PT",
  thaïlande: "TH",
  thailande: "TH",
  thailand: "TH",
  égypte: "EG",
  egypte: "EG",
  egypt: "EG",
  indonésie: "ID",
  indonesie: "ID",
  indonesia: "ID",
  turquie: "TR",
  turkey: "TR",
  mexique: "MX",
  mexico: "MX",
  australie: "AU",
  australia: "AU",
  islande: "IS",
  iceland: "IS",
  vietnam: "VN",
  norvège: "NO",
  norvege: "NO",
  norway: "NO",
  dubai: "AE",
  dubaï: "AE",
  "émirats arabes unis": "AE",
  "emirats arabes unis": "AE",
  uae: "AE",
  autriche: "AT",
  austria: "AT",
  croatie: "HR",
  croatia: "HR",
  pérou: "PE",
  perou: "PE",
  peru: "PE",
  inde: "IN",
  india: "IN",
  "corée du sud": "KR",
  "coree du sud": "KR",
  "south korea": "KR",
  "afrique du sud": "ZA",
  "south africa": "ZA",
  colombie: "CO",
  colombia: "CO",
  cuba: "CU",
  argentine: "AR",
  argentina: "AR",
  irlande: "IE",
  ireland: "IE",
  suède: "SE",
  suede: "SE",
  sweden: "SE",
  danemark: "DK",
  denmark: "DK",
  jordanie: "JO",
  jordan: "JO",
  malaisie: "MY",
  malaysia: "MY",
  singapour: "SG",
  singapore: "SG",
  "nouvelle-zélande": "NZ",
  "nouvelle-zelande": "NZ",
  "new zealand": "NZ",
  maurice: "MU",
  "ile maurice": "MU",
  "île maurice": "MU",
  "iles maurice": "MU",
  "îles maurice": "MU",
  "iles maurices": "MU",
  "îles maurices": "MU",
  mauritius: "MU",
  "costa rica": "CR",
  costarica: "CR",
  "sri lanka": "LK",
  srilanka: "LK",
  philippines: "PH",
  maldives: "MV",
  seychelles: "SC",
  "république dominicaine": "DO",
  "republique dominicaine": "DO",
  dominican: "DO",
  sénégal: "SN",
  senegal: "SN",
  kenya: "KE",
  tanzanie: "TZ",
  tanzania: "TZ",
  zanzibar: "TZ",
  chili: "CL",
  chile: "CL",
  malte: "MT",
  malta: "MT",
  chypre: "CY",
  cyprus: "CY",
  monaco: "MC",
  qatar: "QA",
  "arabie saoudite": "SA",
  "saudi arabia": "SA",
  liban: "LB",
  lebanon: "LB",
  oman: "OM",
  cambodge: "KH",
  cambodia: "KH",
  népal: "NP",
  nepal: "NP",
  taïwan: "TW",
  taiwan: "TW",
  "hong kong": "HK",
  hongkong: "HK",
  luxembourg: "LU",
  slovaquie: "SK",
  slovakia: "SK",
  slovénie: "SI",
  slovenie: "SI",
  slovenia: "SI",
  serbie: "RS",
  serbia: "RS",
  monténégro: "ME",
  montenegro: "ME",
  albanie: "AL",
  albania: "AL",
  géorgie: "GE",
  georgie: "GE",
  georgia: "GE",
  madagascar: "MG",
  "côte d'ivoire": "CI",
  "cote d'ivoire": "CI",
  cameroun: "CM",
  cameroon: "CM",
  israël: "IL",
  israel: "IL",
  russie: "RU",
  russia: "RU"
};

/**
 * Normalise un nom de lieu ou pays pour obtenir le code pays ISO et les actifs associés.
 */
export function getDestinationAssets(countryOrLocation: string): DestinationAssets {
  const emptyResult: DestinationAssets = {
    countryCode: "UN",
    countryName: (typeof countryOrLocation === "string" ? countryOrLocation.trim() : "") || "Destination",
    flagUrl: "https://flagcdn.com/w160/un.png",
    flagSvgUrl: "https://flagcdn.com/un.svg",
    flagEmoji: "🌍",
    clichePhoto: DEFAULT_FALLBACK_PHOTO,
    landmarkName: "Voyage & Découverte"
  };

  if (!countryOrLocation || typeof countryOrLocation !== "string") {
    return emptyResult;
  }

  try {
    const cleanCountry = countryOrLocation ? getCountry(countryOrLocation).trim() : "";
    const normalized = cleanCountry.toLowerCase().replace(/['\s-]/g, "");
    emptyResult.countryName = cleanCountry || countryOrLocation.trim() || "Destination";

    let code = "";

    // 0. Si le paramètre est déjà un code ISO 2 lettres
    const trimmed = countryOrLocation.trim();
    if (trimmed.length === 2 && /^[a-zA-Z]{2}$/.test(trimmed)) {
      code = trimmed.toUpperCase();
    }

    // 1. Recherche par alias rapide
    if (!code) {
      code = COMMON_COUNTRY_ALIASES[cleanCountry.toLowerCase()] || COMMON_COUNTRY_ALIASES[normalized];
    }

    // 2. Recherche par correspondance de sous-chaîne dans le texte complet
    if (!code) {
      const rawLower = countryOrLocation.toLowerCase();
      for (const [alias, iso] of Object.entries(COMMON_COUNTRY_ALIASES)) {
        if (alias.length >= 3 && rawLower.includes(alias)) {
          code = iso;
          break;
        }
      }
    }

    // 3. Recherche dans le référentiel complet countries
    if (!code) {
      const rawLower = cleanCountry.toLowerCase();
      const match = countries.find(
        (c) =>
          c.label.toLowerCase() === rawLower ||
          c.enLabel.toLowerCase() === rawLower ||
          c.value.toLowerCase() === rawLower ||
          c.label.toLowerCase().replace(/['\s-]/g, "") === normalized ||
          c.enLabel.toLowerCase().replace(/['\s-]/g, "") === normalized
      );
      if (match) {
        code = match.value;
      }
    }

    // 4. Si toujours pas trouvé, vérifie si les 2 premières lettres de cleanCountry forment un code ISO
    if (!code) {
      if (cleanCountry.length === 2 && /^[a-zA-Z]{2}$/.test(cleanCountry)) {
        code = cleanCountry.toUpperCase();
      } else {
        return emptyResult;
      }
    }

    const upperCode = code.toUpperCase();
    const lowerCode = code.toLowerCase();

    // Nom lisible du pays
    const countryObj = countries.find((c) => c.value === upperCode);
    const countryName = countryObj ? countryObj.label : cleanCountry || upperCode;

    // Drapeau officiel FlagCDN
    const flagUrl = `https://flagcdn.com/w160/${lowerCode}.png`;
    const flagSvgUrl = `https://flagcdn.com/${lowerCode}.svg`;
    const flagEmoji = getFlagEmojiByCode(upperCode) || "🌍";

    // Photo cliché incontournable
    const curated = CURATED_DESTINATION_PHOTOS[upperCode];
    const clichePhoto = curated ? curated.photo : DEFAULT_FALLBACK_PHOTO;
    const landmarkName = curated ? curated.landmark : `${countryName} - Découverte`;

    return {
      countryCode: upperCode,
      countryName,
      flagUrl,
      flagSvgUrl,
      flagEmoji,
      clichePhoto,
      landmarkName
    };
  } catch (err) {
    console.error("getDestinationAssets error:", err);
    return emptyResult;
  }
}

/**
 * Recherche asynchrone d'une image de tourisme (fallback si destination hors du catalogue immédiat).
 */
export async function fetchDynamicDestinationPhoto(countryName: string): Promise<string | null> {
  try {
    const query = encodeURIComponent(`${countryName} tourism landmark`);
    const endpoint = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=pageimages&piprop=thumbnail&pithumbsize=1200&generator=search&gsrsearch=${query}&gsrlimit=1`;
    const res = await fetch(endpoint);
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data?.query?.pages;
    if (pages) {
      const firstPageKey = Object.keys(pages)[0];
      const source = pages[firstPageKey]?.thumbnail?.source;
      if (source && typeof source === "string" && source.startsWith("http")) {
        return source;
      }
    }
  } catch (err) {
    console.error("fetchDynamicDestinationPhoto error:", err);
  }
  return null;
}
