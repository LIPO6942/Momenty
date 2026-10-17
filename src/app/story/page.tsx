"use client";

import { useState, useContext, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TimelineContext } from '@/context/timeline-context';
import type { GeneratedStory, Instant } from '@/lib/types';
import {
    Loader2,
    Wand2,
    Edit,
    Trash2,
    BookText,
    Check,
    ChevronsUpDown,
    Volume2,
    VolumeX,
    Sparkles,
    Compass,
    Smile,
    BookOpen,
    Quote,
    Share2,
    Copy,
    Maximize2,
    MapPin,
    Calendar,
    Clock,
    Camera,
    Play,
} from 'lucide-react';
import Image from 'next/image';
import { saveStory, getStories, deleteStory as deleteStoryFromDB } from '@/lib/firestore';
import { getProfile } from '@/lib/idb';
import type { ProfileData } from '@/lib/idb';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { cn, getCountry } from '@/lib/utils';
import { getDestinationAssets } from '@/lib/destination-assets';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/context/auth-context';

export interface CuratedStoryVoice {
    id: 'femme-1' | 'femme-2' | 'homme-1' | 'homme-2';
    name: string;
    gender: 'femme' | 'homme';
    genderEmoji: string;
    label: string;
    description: string;
    pitch: number;
    rate: number;
}

const CURATED_VOICES: CuratedStoryVoice[] = [
    {
        id: 'femme-1',
        name: 'Chloé',
        gender: 'femme',
        genderEmoji: '👩',
        label: 'Chloé (Femme)',
        description: 'Voix douce, chaleureuse & poétique',
        pitch: 1.05,
        rate: 0.95,
    },
    {
        id: 'femme-2',
        name: 'Léa',
        gender: 'femme',
        genderEmoji: '👩',
        label: 'Léa (Femme)',
        description: 'Voix claire, spontanée & lumineuse',
        pitch: 1.15,
        rate: 1.0,
    },
    {
        id: 'homme-1',
        name: 'Alexandre',
        gender: 'homme',
        genderEmoji: '👨',
        label: 'Alexandre (Homme)',
        description: 'Voix posée, narrative & captivante',
        pitch: 0.88,
        rate: 0.92,
    },
    {
        id: 'homme-2',
        name: 'Julien',
        gender: 'homme',
        genderEmoji: '👨',
        label: 'Julien (Homme)',
        description: 'Voix amicale, dynamique & aventurière',
        pitch: 0.95,
        rate: 0.98,
    },
];

const STORY_TONES = [
    { id: 'poetique', label: 'Poétique', icon: Sparkles, desc: 'Lumières, sensations & émotions' },
    { id: 'aventure', label: 'Aventurier', icon: Compass, desc: 'Exploration, rythme & découvertes' },
    { id: 'humour', label: 'Fun & Décalé', icon: Smile, desc: 'Humour, spontanéité & anecdotes' },
    { id: 'intime', label: 'Carnet Secret', icon: BookOpen, desc: 'Récit introspectif & sincère' },
];

const COUNTRY_FLAGS: Record<string, { name: string; emoji: string; colors: string[] }> = {
    FR: { name: 'France', emoji: '🇫🇷', colors: ['#002395', '#FFFFFF', '#ED2939'] },
    IT: { name: 'Italie', emoji: '🇮🇹', colors: ['#009246', '#FFFFFF', '#CE2B37'] },
    ES: { name: 'Espagne', emoji: '🇪🇸', colors: ['#AA151B', '#F1BF00', '#AA151B'] },
    MA: { name: 'Maroc', emoji: '🇲🇦', colors: ['#C1272D', '#006233'] },
    TN: { name: 'Tunisie', emoji: '🇹🇳', colors: ['#E70013', '#FFFFFF'] },
    DZ: { name: 'Algérie', emoji: '🇩🇿', colors: ['#006233', '#FFFFFF', '#D21034'] },
    JP: { name: 'Japon', emoji: '🇯🇵', colors: ['#FFFFFF', '#BC002D'] },
    DE: { name: 'Allemagne', emoji: '🇩🇪', colors: ['#1A1A1A', '#DD0000', '#FFCE00'] },
    GB: { name: 'Royaume-Uni', emoji: '🇬🇧', colors: ['#012169', '#C8102E', '#FFFFFF'] },
    US: { name: 'États-Unis', emoji: '🇺🇸', colors: ['#3C3B6E', '#FFFFFF', '#B22234'] },
    GR: { name: 'Grèce', emoji: '🇬🇷', colors: ['#0D5EAF', '#FFFFFF'] },
    PT: { name: 'Portugal', emoji: '🇵🇹', colors: ['#006600', '#FF0000'] },
    BE: { name: 'Belgique', emoji: '🇧🇪', colors: ['#1A1A1A', '#FDDA24', '#EF3340'] },
    CH: { name: 'Suisse', emoji: '🇨🇭', colors: ['#D52B1E', '#FFFFFF'] },
    NL: { name: 'Pays-Bas', emoji: '🇳🇱', colors: ['#AE1C28', '#FFFFFF', '#21468B'] },
    TR: { name: 'Turquie', emoji: '🇹🇷', colors: ['#E30A17', '#FFFFFF'] },
    BR: { name: 'Brésil', emoji: '🇧🇷', colors: ['#009739', '#FEDD00', '#012169'] },
    ID: { name: 'Indonésie', emoji: '🇮🇩', colors: ['#CE1126', '#FFFFFF'] },
    TH: { name: 'Thaïlande', emoji: '🇹🇭', colors: ['#A51931', '#F4F5F8', '#2D2A4A'] },
    CA: { name: 'Canada', emoji: '🇨🇦', colors: ['#FF0000', '#FFFFFF', '#FF0000'] },
    EG: { name: 'Égypte', emoji: '🇪🇬', colors: ['#C8102E', '#FFFFFF', '#000000'] },
    AE: { name: 'Émirats Arabes Unis', emoji: '🇦🇪', colors: ['#00732F', '#FFFFFF', '#000000', '#FF0000'] },
    SN: { name: 'Sénégal', emoji: '🇸🇳', colors: ['#00853F', '#FDEF42', '#E31B23'] },
    CI: { name: "Côte d'Ivoire", emoji: '🇨🇮', colors: ['#F77F00', '#FFFFFF', '#009E60'] },
    MX: { name: 'Mexique', emoji: '🇲🇽', colors: ['#006847', '#FFFFFF', '#CE1126'] },
    VN: { name: 'Vietnam', emoji: '🇻🇳', colors: ['#DA251D', '#FFFF00'] },
    IN: { name: 'Inde', emoji: '🇮🇳', colors: ['#FF9933', '#FFFFFF', '#128807'] },
    IE: { name: 'Irlande', emoji: '🇮🇪', colors: ['#169B62', '#FFFFFF', '#FF883E'] },
    HR: { name: 'Croatie', emoji: '🇭🇷', colors: ['#FF0000', '#FFFFFF', '#171796'] },
    AT: { name: 'Autriche', emoji: '🇦🇹', colors: ['#ED2939', '#FFFFFF', '#ED2939'] },
    SE: { name: 'Suède', emoji: '🇸🇪', colors: ['#006AA7', '#FECC00'] },
    NO: { name: 'Norvège', emoji: '🇳🇴', colors: ['#BA0C2F', '#FFFFFF', '#00205B'] },
    DK: { name: 'Danemark', emoji: '🇩🇰', colors: ['#C60C30', '#FFFFFF'] },
    IS: { name: 'Islande', emoji: '🇮🇸', colors: ['#02529C', '#FFFFFF', '#DC1E35'] },
    AU: { name: 'Australie', emoji: '🇦🇺', colors: ['#00008B', '#FF0000', '#FFFFFF'] },
};

function colorsToStripeCss(colors: string[]): string {
    if (!colors || colors.length === 0) return 'linear-gradient(90deg, #D97706, #3B82F6)';
    if (colors.length === 1) return colors[0];
    const step = 100 / colors.length;
    const stops = colors.map((col, idx) => {
        const start = (idx * step).toFixed(1);
        const end = ((idx + 1) * step).toFixed(1);
        return `${col} ${start}%, ${col} ${end}%`;
    });
    return `linear-gradient(90deg, ${stops.join(', ')})`;
}

interface StoryCountryTheme {
    stripeCss: string;
    primaryColor: string;
    emojis: string;
    countryLabel: string;
    hasCountries: boolean;
}

function getStoryCountriesTheme(story: GeneratedStory): StoryCountryTheme {
    const rawCountryNames = story.instants
        .map(i => i.location ? getCountry(i.location) : '')
        .filter(Boolean);

    const uniqueNames = Array.from(new Set(rawCountryNames)) as string[];

    const foundCountries: { code: string; name: string; emoji: string; colors: string[] }[] = [];

    for (const name of uniqueNames) {
        const assets = getDestinationAssets(name);
        const code = assets.countryCode?.toUpperCase();
        if (code && COUNTRY_FLAGS[code]) {
            foundCountries.push({
                code,
                name: COUNTRY_FLAGS[code].name || assets.countryName,
                emoji: COUNTRY_FLAGS[code].emoji || assets.flagEmoji,
                colors: COUNTRY_FLAGS[code].colors,
            });
        } else if (code) {
            foundCountries.push({
                code,
                name: assets.countryName || name,
                emoji: assets.flagEmoji || '🌍',
                colors: ['#D97706', '#2563EB'],
            });
        }
    }

    if (foundCountries.length === 0) {
        return {
            stripeCss: 'linear-gradient(90deg, #D97706 0%, #F59E0B 50%, #3B82F6 100%)',
            primaryColor: '#D97706',
            emojis: '🌍',
            countryLabel: 'Voyage',
            hasCountries: false,
        };
    }

    const allColors = foundCountries.flatMap(c => c.colors);
    return {
        stripeCss: colorsToStripeCss(allColors),
        primaryColor: foundCountries[0].colors[0] || '#D97706',
        emojis: foundCountries.map(c => c.emoji).join(' '),
        countryLabel: foundCountries.map(c => c.name).join(' • '),
        hasCountries: true,
    };
}

const cleanTitle = (raw: string) => {
    return raw.replace(/^#+\s*/, '').trim();
};

const isDateString = (str: string): boolean => {
    if (!str) return false;
    const clean = str
        .replace(/^#+\s*/, '')
        .replace(/^[*_~`]+|[*_~`]+$/g, '')
        .replace(/^(date\s*:\s*)/i, '')
        .trim()
        .toLowerCase();
    if (!clean) return true;
    if (/^(du|le|au|ce|en)\s+\d+/i.test(clean)) return true;
    if (/^(journée\s+(du\s+)?|récit\s+(du\s+)?|jour\s+\d+|étape\s+\d+)/i.test(clean)) return true;
    if (/^(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)[,\s]+\d+/i.test(clean)) return true;
    if (/^(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\b/i.test(clean)) return true;
    if (/^\d{1,2}\s+(janv|févr|fevr|mars|avr|mai|juin|juil|août|aout|sept|oct|nov|déc|dec|\d{1,2})/i.test(clean)) return true;
    if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(clean)) return true;
    if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}/.test(clean)) return true;
    return false;
};

const hasDateInTitle = (title: string, dateStr: string): boolean => {
    if (!title) return false;
    if (isDateString(title)) return true;
    const clean = cleanTitle(title).toLowerCase();
    const formatted = formatStoryDate(dateStr).toLowerCase();
    if (formatted && clean.includes(formatted)) return true;
    if (dateStr && clean.includes(dateStr.toLowerCase())) return true;
    return false;
};

const getReadingTime = (text: string) => {
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.round(words / 160));
    return `${minutes} min`;
};

const formatStoryDate = (dateStr: string) => {
    try {
        return format(parseISO(dateStr), 'd MMMM yyyy', { locale: fr });
    } catch {
        return dateStr;
    }
};

/**
 * Resolves the underlying speech synthesis voice from the system based on the curated persona
 */
function getSystemVoiceForPersona(
    personaId: CuratedStoryVoice['id'],
    systemVoices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
    if (systemVoices.length === 0) return null;

    const frenchVoices = systemVoices.filter(v => v.lang.toLowerCase().startsWith('fr'));
    const pool = frenchVoices.length > 0 ? frenchVoices : systemVoices;

    const femaleKeywords = ['julie', 'hortense', 'amelie', 'amélie', 'marie', 'audrey', 'aurelie', 'aurélie', 'denise', 'celine', 'female', 'femme'];
    const maleKeywords = ['paul', 'henri', 'thomas', 'nicolas', 'antoine', 'mathieu', 'male', 'homme'];

    const matchedFemales = pool.filter(v => femaleKeywords.some(k => v.name.toLowerCase().includes(k)));
    const matchedMales = pool.filter(v => maleKeywords.some(k => v.name.toLowerCase().includes(k)));

    if (personaId === 'femme-1') {
        return matchedFemales[0] || pool[0];
    }
    if (personaId === 'femme-2') {
        return matchedFemales[1] || matchedFemales[0] || pool[0];
    }
    if (personaId === 'homme-1') {
        return matchedMales[0] || pool[1] || pool[0];
    }
    if (personaId === 'homme-2') {
        return matchedMales[1] || matchedMales[0] || pool[1] || pool[0];
    }

    return pool[0];
}

/**
 * Animated photo slideshow & reel inside the folded banner
 */
const BannerPhotosDefilantes = ({
    photos,
    onPhotoClick,
}: {
    photos: string[];
    onPhotoClick: (photo: string) => void;
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (photos.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % photos.length);
        }, 2500);
        return () => clearInterval(timer);
    }, [photos.length]);

    if (photos.length === 0) return null;

    return (
        <div
            className="flex items-center gap-2 shrink-0"
            onClick={(e) => {
                e.stopPropagation();
                onPhotoClick(photos[currentIndex]);
            }}
        >
            {/* Animated crossfading photo window */}
            <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-xl overflow-hidden border border-border/70 shadow-md bg-muted">
                {photos.map((photo, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "absolute inset-0 transition-opacity duration-700 ease-in-out",
                            idx === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                        )}
                    >
                        <Image src={photo} alt="" fill className="object-cover" />
                    </div>
                ))}

                {photos.length > 1 && (
                    <div className="absolute bottom-1 right-1 z-20 px-1 py-0.5 rounded bg-black/65 backdrop-blur-sm text-[9px] font-medium text-white leading-none">
                        {currentIndex + 1}/{photos.length}
                    </div>
                )}
            </div>

            {/* Mini horizontal strip */}
            {photos.length > 1 && (
                <div className="hidden sm:flex items-center gap-1.5 overflow-hidden max-w-[120px] opacity-75 hover:opacity-100 transition-opacity">
                    {photos.slice(0, 3).map((p, i) => (
                        <div
                            key={i}
                            onClick={(e) => {
                                e.stopPropagation();
                                onPhotoClick(p);
                            }}
                            className={cn(
                                "relative h-10 w-10 shrink-0 rounded-lg overflow-hidden border border-border/60 shadow-sm cursor-pointer transition-all",
                                i === currentIndex ? "ring-2 ring-primary scale-105" : "opacity-70 hover:opacity-100"
                            )}
                        >
                            <Image src={p} alt="" fill className="object-cover" />
                        </div>
                    ))}
                    {photos.length > 3 && (
                        <span className="text-[10px] text-muted-foreground font-semibold shrink-0">
                            +{photos.length - 3}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

/**
 * Renders 1 or 2 thumbnail photos side-by-side (côte à côte) at the end of a paragraph,
 * strictly adapting to mobile phone width without stacking vertically.
 */
const ParagraphPhotos = ({
    photos,
    onSelectPhoto,
}: {
    photos: string[];
    onSelectPhoto: (photo: string) => void;
}) => {
    if (!photos || photos.length === 0) return null;

    if (photos.length === 1) {
        return (
            <div className="py-2">
                <div
                    onClick={() => onSelectPhoto(photos[0])}
                    className="group relative w-28 sm:w-36 aspect-square rounded-xl overflow-hidden border border-border/70 shadow-sm hover:shadow-md cursor-pointer transition-all duration-300 hover:scale-105 bg-muted"
                    title="Cliquer pour agrandir"
                >
                    <Image
                        src={photos[0]}
                        alt=""
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                        <Maximize2 className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                    </div>
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[9px] text-white font-medium">
                        🔍 Agrandir
                    </div>
                </div>
            </div>
        );
    }

    // 2 photos strictly side by side (côte à côte) on mobile (grid grid-cols-2)
    // Guaranteed never to stack vertically even on small phone screens (iPhone SE, 360px Android)
    return (
        <div className="grid grid-cols-2 gap-2 sm:gap-3 py-2 w-full max-w-[270px] sm:max-w-sm">
            {photos.slice(0, 2).map((photo, pIdx) => (
                <div
                    key={pIdx}
                    onClick={() => onSelectPhoto(photo)}
                    className="group relative aspect-square w-full rounded-xl overflow-hidden border border-border/70 shadow-sm hover:shadow-md cursor-pointer transition-all duration-300 hover:scale-105 bg-muted"
                    title="Cliquer pour agrandir"
                >
                    <Image
                        src={photo}
                        alt=""
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                        <Maximize2 className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                    </div>
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[9px] text-white font-medium">
                        🔍 Agrandir
                    </div>
                </div>
            ))}
        </div>
    );
};

interface StoryReaderProps {
    text: string;
    photos: string[];
    onSelectPhoto: (photo: string) => void;
}

const StoryReader = ({ text, photos, onSelectPhoto }: StoryReaderProps) => {
    const rawParagraphs = text.split(/\n+/).map(p => p.trim()).filter(Boolean);

    // Strip ALL leading markdown titles, subtitles, dividers or redundant date headers at the start of story text
    let contentParagraphs = [...rawParagraphs];
    while (contentParagraphs.length > 0) {
        const first = contentParagraphs[0];
        const stripped = first.replace(/^#+\s*/, '').replace(/^[*_~`]+|[*_~`]+$/g, '').trim();
        if (
            first.startsWith('#') ||
            first.startsWith('---') ||
            first.startsWith('***') ||
            isDateString(first) ||
            isDateString(stripped) ||
            stripped.toLowerCase().startsWith('date') ||
            stripped.toLowerCase().startsWith('journée') ||
            stripped.toLowerCase().startsWith('récit')
        ) {
            contentParagraphs.shift();
        } else {
            break;
        }
    }

    // Distribute photos across paragraphs (maximum 2 photos per paragraph ending)
    const photosPerParagraph = useMemo(() => {
        const result: string[][] = Array.from({ length: contentParagraphs.length }, () => []);
        if (photos.length === 0 || contentParagraphs.length === 0) return result;

        let photoIdx = 0;
        // First pass: 1 photo per paragraph
        for (let i = 0; i < contentParagraphs.length && photoIdx < photos.length; i++) {
            result[i].push(photos[photoIdx]);
            photoIdx++;
        }
        // Second pass: 2nd photo per paragraph (strictly forms side-by-side pairs)
        for (let i = 0; i < contentParagraphs.length && photoIdx < photos.length; i++) {
            if (result[i].length < 2) {
                result[i].push(photos[photoIdx]);
                photoIdx++;
            }
        }
        return result;
    }, [contentParagraphs.length, photos]);

    return (
        <div className="space-y-5 font-serif text-base sm:text-lg leading-relaxed sm:leading-loose text-foreground/90">
            {contentParagraphs.map((para, idx) => {
                const isQuote = para.startsWith('>') || (para.startsWith('«') && para.endsWith('»'));
                const paraPhotos = photosPerParagraph[idx] || [];

                if (isQuote) {
                    const cleanQuote = para.replace(/^>\s*/, '').replace(/^«|»$/g, '').trim();
                    return (
                        <div key={idx} className="space-y-2.5">
                            <div className="my-4 px-4 sm:px-5 py-3 border-l-4 border-amber-500 bg-amber-500/10 rounded-r-xl italic flex gap-3 text-foreground">
                                <Quote className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <p className="font-medium text-base sm:text-lg leading-relaxed">
                                    « {cleanQuote} »
                                </p>
                            </div>
                            <ParagraphPhotos photos={paraPhotos} onSelectPhoto={onSelectPhoto} />
                        </div>
                    );
                }

                // First paragraph gets the literary Drop Cap (Lettrine)
                if (idx === 0 && para.length > 3) {
                    const firstChar = para.charAt(0);
                    const rest = para.slice(1);
                    return (
                        <div key={idx} className="space-y-2.5">
                            <p className="text-justify font-serif text-foreground/90">
                                <span className="float-left text-5xl sm:text-6xl font-serif font-black text-amber-600 dark:text-amber-400 mr-3 mb-0 leading-none select-none drop-shadow-sm">
                                    {firstChar}
                                </span>
                                {rest}
                            </p>
                            <ParagraphPhotos photos={paraPhotos} onSelectPhoto={onSelectPhoto} />
                        </div>
                    );
                }

                return (
                    <div key={idx} className="space-y-2.5">
                        <p className="text-justify font-serif text-foreground/90">
                            {para}
                        </p>
                        <ParagraphPhotos photos={paraPhotos} onSelectPhoto={onSelectPhoto} />
                    </div>
                );
            })}
        </div>
    );
};

interface StoryDisplayProps {
    story: GeneratedStory;
    isSpeaking: boolean;
    onToggleSpeech: () => void;
    onOpenVoiceSettings: () => void;
    currentPersona: CuratedStoryVoice;
    onCopy: () => void;
    onShare: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onSelectPhoto: (photo: string) => void;
    isCopied: boolean;
}

const StoryDisplay = ({
    story,
    isSpeaking,
    onToggleSpeech,
    onOpenVoiceSettings,
    currentPersona,
    onCopy,
    onShare,
    onEdit,
    onDelete,
    onSelectPhoto,
    isCopied,
}: StoryDisplayProps) => {
    const photos = useMemo(() => {
        const raw = story.instants.flatMap(i => i.photos || []).filter(Boolean) as string[];
        return Array.from(new Set(raw));
    }, [story.instants]);

    const locations = useMemo(() => {
        const locs = story.instants.map(i => i.location).filter(Boolean) as string[];
        return Array.from(new Set(locs));
    }, [story.instants]);

    const notes = useMemo(() => {
        return story.instants.filter(i => i.type === 'note' && i.description);
    }, [story.instants]);

    return (
        <div className="space-y-4 pt-1">
            {/* Subtle locations line if locations are defined (NO DUPLICATE DATE) */}
            {locations.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-1">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">Lieux : {locations.join(', ')}</span>
                </div>
            )}

            {/* Interactive Audio & Actions Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/20 backdrop-blur-sm">
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        size="sm"
                        variant={isSpeaking ? "default" : "outline"}
                        onClick={onToggleSpeech}
                        className={cn(
                            "rounded-full font-medium transition-all text-xs sm:text-sm",
                            isSpeaking
                                ? "bg-amber-600 hover:bg-amber-700 text-white animate-pulse"
                                : "border-amber-500/40 hover:bg-amber-500/10 text-foreground"
                        )}
                    >
                        {isSpeaking ? (
                            <>
                                <VolumeX className="h-4 w-4 mr-1.5 text-white" />
                                <span>Arrêter l'écoute</span>
                            </>
                        ) : (
                            <>
                                <Volume2 className="h-4 w-4 mr-1.5 text-amber-600 dark:text-amber-400" />
                                <span>Écouter le récit</span>
                            </>
                        )}
                    </Button>

                    {/* Change Voice Button: Shows current narrator */}
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onOpenVoiceSettings}
                        className="rounded-full text-xs font-medium text-muted-foreground hover:text-foreground h-8 px-2.5 border border-border/50"
                        title="Changer de conteur (2 femmes, 2 hommes)"
                    >
                        <span className="mr-1">{currentPersona.genderEmoji}</span>
                        <span>Voix : {currentPersona.name}</span>
                    </Button>

                    {isSpeaking && (
                        <div className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300 font-medium ml-1">
                            <span className="inline-block w-1.5 h-3 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <span className="inline-block w-1.5 h-4 bg-amber-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <span className="inline-block w-1.5 h-3 bg-amber-500 rounded-full animate-bounce" />
                            <span className="ml-1 text-[11px] hidden sm:inline">Conteur actif</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1.5 ml-auto">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onCopy}
                        className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                        title="Copier le texte"
                    >
                        {isCopied ? <Check className="h-3.5 w-3.5 text-green-600 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                        <span className="hidden sm:inline">{isCopied ? "Copié !" : "Copier"}</span>
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onShare}
                        className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                        title="Partager le récit"
                    >
                        <Share2 className="h-3.5 w-3.5 mr-1" />
                        <span className="hidden sm:inline">Partager</span>
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onEdit}
                        className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                        title="Modifier l'histoire"
                    >
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        <span className="hidden sm:inline">Modifier</span>
                    </Button>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
                                title="Supprimer"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer cette histoire ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Cette action est irréversible. Le récit sera définitivement retiré de votre carnet.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                    Supprimer
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            {/* Carnet de Voyage Paper View with inline photos at paragraph ends */}
            <div className="relative rounded-2xl p-5 sm:p-7 bg-gradient-to-br from-amber-50/70 via-background to-orange-50/30 dark:from-zinc-900/80 dark:via-zinc-900/40 dark:to-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 shadow-sm overflow-hidden">
                <div className="absolute top-0 right-8 w-6 h-8 bg-amber-500/80 rounded-b-sm shadow-sm" />
                <StoryReader
                    text={story.story}
                    photos={photos}
                    onSelectPhoto={onSelectPhoto}
                />
            </div>

            {/* Original Notes / Field Journal */}
            {notes.length > 0 && (
                <div className="mt-3 p-3.5 rounded-xl bg-muted/40 border border-border/40 space-y-2">
                    <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <BookText className="h-3.5 w-3.5 text-primary" />
                        Notes originales de terrain
                    </h4>
                    <div className="space-y-1 text-sm text-foreground/80">
                        {notes.map(note => (
                            <div key={note.id} className="flex gap-2 items-start pl-1">
                                <span className="text-amber-600 text-xs mt-0.5">•</span>
                                <span>{note.description}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function StoryPage() {
    const { groupedInstants, instants, activeTrip, activeStay } = useContext(TimelineContext);
    const { user } = useAuth();
    const { toast } = useToast();
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [stories, setStories] = useState<GeneratedStory[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState<GeneratedStory | null>(null);
    const [editText, setEditText] = useState("");

    // Stories folded/collapsed by default
    const [openAccordionItem, setOpenAccordionItem] = useState<string | undefined>(undefined);

    const [userProfile, setUserProfile] = useState<Omit<ProfileData, 'id'> | null>(null);
    const [isDaySelectorOpen, setIsDaySelectorOpen] = useState(false);
    const [manualCompanionType, setManualCompanionType] = useState<string>("");
    const [manualCompanionName, setManualCompanionName] = useState<string>("");
    const [selectedTone, setSelectedTone] = useState<string>('poetique');
    const [speakingStoryId, setSpeakingStoryId] = useState<string | null>(null);
    const [copiedStoryId, setCopiedStoryId] = useState<string | null>(null);
    const [selectedLightboxPhoto, setSelectedLightboxPhoto] = useState<string | null>(null);

    // Curated voice state: exactly 2 female voices and 2 male voices
    const [selectedVoiceId, setSelectedVoiceId] = useState<CuratedStoryVoice['id']>('femme-1');
    const [availableSystemVoices, setAvailableSystemVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [isVoiceDialogOpen, setIsVoiceDialogOpen] = useState<boolean>(false);
    const [testingPersonaId, setTestingPersonaId] = useState<string | null>(null);

    // Load available voices from system
    useEffect(() => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

        const updateVoices = () => {
            const all = window.speechSynthesis.getVoices();
            if (all.length === 0) return;
            setAvailableSystemVoices(all);

            const savedVoiceId = localStorage.getItem('momenty_story_curated_voice') as CuratedStoryVoice['id'] | null;
            if (savedVoiceId && CURATED_VOICES.some(v => v.id === savedVoiceId)) {
                setSelectedVoiceId(savedVoiceId);
            }
        };

        updateVoices();
        window.speechSynthesis.onvoiceschanged = updateVoices;

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);

    // Stop audio on unmount
    useEffect(() => {
        return () => {
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const currentPersona = useMemo(() => {
        return CURATED_VOICES.find(v => v.id === selectedVoiceId) || CURATED_VOICES[0];
    }, [selectedVoiceId]);

    const handlePreviewPersona = (persona: CuratedStoryVoice) => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();

        const sample = persona.gender === 'femme'
            ? `Bonjour, je suis ${persona.name}. Laissez-moi vous raconter vos plus beaux souvenirs de voyage.`
            : `Bonjour, je m'appelle ${persona.name}. Je serai votre conteur pour revivre cette aventure.`;

        const utterance = new SpeechSynthesisUtterance(sample);
        utterance.lang = 'fr-FR';

        const sysVoice = getSystemVoiceForPersona(persona.id, availableSystemVoices);
        if (sysVoice) utterance.voice = sysVoice;

        utterance.rate = persona.rate;
        utterance.pitch = persona.pitch;

        setTestingPersonaId(persona.id);
        utterance.onend = () => setTestingPersonaId(null);
        utterance.onerror = () => setTestingPersonaId(null);

        window.speechSynthesis.speak(utterance);
    };

    const toggleStorySpeech = (story: GeneratedStory) => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            toast({
                title: "Non supporté",
                description: "La synthèse vocale n'est pas disponible sur ce navigateur.",
            });
            return;
        }

        if (speakingStoryId === story.id) {
            window.speechSynthesis.cancel();
            setSpeakingStoryId(null);
            return;
        }

        window.speechSynthesis.cancel();

        const cleanSpeechText = story.story
            .replace(/^#+\s.*$/gm, '')
            .replace(/[*_~`]/g, '')
            .trim();

        const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
        utterance.lang = 'fr-FR';

        const sysVoice = getSystemVoiceForPersona(currentPersona.id, availableSystemVoices);
        if (sysVoice) utterance.voice = sysVoice;

        utterance.rate = currentPersona.rate;
        utterance.pitch = currentPersona.pitch;

        utterance.onend = () => setSpeakingStoryId(null);
        utterance.onerror = () => setSpeakingStoryId(null);

        window.speechSynthesis.speak(utterance);
        setSpeakingStoryId(story.id);
    };

    const handleCopyStory = async (story: GeneratedStory) => {
        try {
            const clean = `${cleanTitle(story.title)}\n\n${story.story.replace(/^#+\s/gm, '')}\n\n— Récit Momenty`;
            await navigator.clipboard.writeText(clean);
            setCopiedStoryId(story.id);
            toast({ title: "Histoire copiée dans le presse-papier !" });
            setTimeout(() => setCopiedStoryId(null), 2500);
        } catch {
            toast({ variant: "destructive", title: "Impossible de copier le texte." });
        }
    };

    const handleShareStory = async (story: GeneratedStory) => {
        const text = `${cleanTitle(story.title)}\n\n${story.story.replace(/^#+\s/gm, '')}\n\n— Écrit avec Momenty`;
        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({
                    title: cleanTitle(story.title),
                    text,
                });
            } catch {
                // user cancelled or share unsupported
            }
        } else {
            handleCopyStory(story);
        }
    };

    const loadStories = async () => {
        if (!user) return;
        const loadedStories = await getStories(user.uid);
        const hydratedStories = loadedStories.map(story => {
            const storyInstants = story.instants.map(i => instants.find(fullInstant => fullInstant.id === i.id)).filter(Boolean) as Instant[];
            return { ...story, instants: storyInstants };
        });
        setStories(hydratedStories);
    };

    useEffect(() => {
        const loadProfileData = async () => {
            const profile = await getProfile();
            setUserProfile(profile);
        };
        loadProfileData();

        if (user && instants.length > 0) {
            loadStories();
        }

        const handleStoriesUpdated = () => {
            if (user) loadStories();
        };

        window.addEventListener('stories-updated', handleStoriesUpdated);
        return () => {
            window.removeEventListener('stories-updated', handleStoriesUpdated);
        };
    }, [user, instants]);

    const dayOptions = useMemo(() => {
        return Object.keys(groupedInstants).map(dayKey => ({
            value: dayKey,
            label: groupedInstants[dayKey].title
        }));
    }, [groupedInstants]);

    const handleGenerateStory = async () => {
        if (selectedDays.length === 0 || !user) return;

        setIsLoading(true);
        try {
            const sortedDays = [...selectedDays].sort();
            const storyId = sortedDays.join('_');

            const dayDataArray = sortedDays.map(dayKey => groupedInstants[dayKey]);
            const allInstantsForStory = dayDataArray.flatMap(d => d.instants);

            const storyTitle = dayDataArray.length > 1
                ? `Du ${format(parseISO(dayDataArray[0].instants[0].date), 'd MMM', { locale: fr })} au ${format(parseISO(dayDataArray[dayDataArray.length - 1].instants[0].date), 'd MMM yyyy', { locale: fr })}`
                : dayDataArray[0].title;

            const instantsForPrompt = allInstantsForStory.map(i => {
                let formattedDay = 'Moment de voyage';
                try {
                    if (i.date) {
                        formattedDay = format(parseISO(i.date), "d MMMM yyyy", { locale: fr });
                    }
                } catch {
                    // ignore format error
                }
                return {
                    title: i.title || '',
                    description: i.description || '',
                    location: i.location || '',
                    emotion: i.emotion || '',
                    photos: i.photos || undefined,
                    day: formattedDay
                };
            });

            const activeContext = activeTrip || activeStay;

            const res = await fetch('/api/story/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    instants: instantsForPrompt,
                    companionType: manualCompanionType || activeContext?.companionType,
                    companionName: manualCompanionName || activeContext?.companionName,
                    userFirstName: userProfile?.firstName,
                    userAge: userProfile?.age,
                    userGender: userProfile?.gender,
                    storyTone: selectedTone,
                }),
            });

            const data = await res.json();
            if (!res.ok || data.error) {
                throw new Error(data.error || "L'IA n'a pas pu créer l'histoire.");
            }

            const storyText = data.story;

            const newStory: GeneratedStory = {
                id: storyId,
                date: sortedDays[0],
                title: storyTitle,
                story: storyText,
                instants: allInstantsForStory.map(({ icon, color, ...rest }) => rest),
            };

            await saveStory(user.uid, newStory);

            const fullNewStory = { ...newStory, instants: allInstantsForStory };

            setStories(prev => [fullNewStory, ...prev.filter(s => s.id !== storyId)]);
            setOpenAccordionItem(newStory.id);
            setManualCompanionType("");
            setManualCompanionName("");
            toast({ title: "Histoire générée et ajoutée à votre carnet !" });

        } catch (error: any) {
            console.error("Failed to generate story:", error);
            toast({
                variant: "destructive",
                title: "La génération a échoué.",
                description: error?.message || "Veuillez réessayer.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditStory = (story: GeneratedStory) => {
        setIsEditing(story);
        setEditText(story.story);
    };

    const handleSaveEdit = async () => {
        if (!isEditing || !user) return;

        const updatedStory: GeneratedStory = {
            ...isEditing,
            story: editText,
        };

        await saveStory(user.uid, updatedStory);

        setStories(prev => prev.map(s => s.id === updatedStory.id ? updatedStory : s));
        setIsEditing(null);
        toast({ title: "Histoire mise à jour." });
    };

    const handleDeleteStory = async (storyId: string) => {
        if (!user) return;
        if (speakingStoryId === storyId) {
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
            setSpeakingStoryId(null);
        }
        await deleteStoryFromDB(user.uid, storyId);
        setStories(prev => prev.filter(s => s.id !== storyId));
        toast({ title: "Histoire supprimée." });
    };

    const selectedDaysInstants = useMemo(() => {
        return selectedDays.flatMap(dayKey => groupedInstants[dayKey]?.instants || []);
    }, [selectedDays, groupedInstants]);

    const selectedDaysPhotos = useMemo(() => {
        const raw = selectedDaysInstants.flatMap(i => i.photos || []).filter(Boolean) as string[];
        return Array.from(new Set(raw));
    }, [selectedDaysInstants]);

    const toggleDaySelection = (dayKey: string) => {
        setSelectedDays(prev =>
            prev.includes(dayKey)
                ? prev.filter(d => d !== dayKey)
                : [...prev, dayKey]
        );
    };

    return (
        <div className="container mx-auto max-w-2xl px-4 pt-20 sm:pt-24 pb-12 min-h-screen">
            {/* Compact Header Block (Tagline removed to save space) */}
            <div className="pt-1 pb-1 text-center mb-3">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight flex items-center justify-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Générateur d'Histoires
                </h1>
            </div>

            {/* Creation Card (Step 1) */}
            <Card className="mb-4 sm:mb-5 border-border/70 shadow-sm overflow-hidden bg-card/90 backdrop-blur-sm">
                <CardHeader className="py-2.5 px-4 border-b border-border/40 bg-muted/20">
                    <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                        <Wand2 className="h-4 w-4 text-primary" />
                        Créer ou recréer une histoire
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3.5 p-4">
                    {/* Day Selector */}
                    <div>
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                            Période à raconter
                        </Label>
                        <Popover open={isDaySelectorOpen} onOpenChange={setIsDaySelectorOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={isDaySelectorOpen}
                                    className="w-full justify-between h-auto min-h-10 text-left border-border/70"
                                    disabled={!user}
                                >
                                    <div className="flex flex-wrap gap-1.5 py-0.5">
                                        {selectedDays.length === 0 && (
                                            <span className="text-muted-foreground text-xs sm:text-sm">
                                                Sélectionnez une ou plusieurs journées...
                                            </span>
                                        )}
                                        {selectedDays.map(dayKey => {
                                            const option = dayOptions.find(o => o.value === dayKey);
                                            return (
                                                <Badge
                                                    key={dayKey}
                                                    variant="secondary"
                                                    className="rounded-md text-xs py-0.5 px-2 bg-primary/15 text-primary border-none"
                                                >
                                                    {option?.label}
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Rechercher une journée..." />
                                    <CommandList>
                                        <CommandEmpty>Aucune date trouvée.</CommandEmpty>
                                        <CommandGroup>
                                            {dayOptions.map((option) => (
                                                <CommandItem
                                                    key={option.value}
                                                    value={option.label}
                                                    onSelect={() => toggleDaySelection(option.value)}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4 text-primary",
                                                            selectedDays.includes(option.value) ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {option.label}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Previews & Options once at least 1 day is selected */}
                    {selectedDays.length > 0 && (
                        <div className="space-y-3.5 pt-1 animate-in fade-in-50 duration-300">
                            {/* Photo Filmstrip */}
                            {selectedDaysPhotos.length > 0 && (
                                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                                        <span className="flex items-center gap-1.5 font-medium text-foreground">
                                            <Camera className="h-3.5 w-3.5 text-amber-600" />
                                            {selectedDaysPhotos.length} photo(s) prête(s) à être racontée(s)
                                        </span>
                                    </div>
                                    <ScrollArea className="w-full whitespace-nowrap">
                                        <div className="flex space-x-2 py-0.5">
                                            {selectedDaysPhotos.map((photo, index) => (
                                                <div
                                                    key={index}
                                                    className="relative h-14 w-14 shrink-0 rounded-lg overflow-hidden border border-border/60 shadow-sm"
                                                >
                                                    <Image src={photo} alt="" fill className="object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                        <ScrollBar orientation="horizontal" />
                                    </ScrollArea>
                                </div>
                            )}

                            {/* Tone Selector */}
                            <div>
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                                    Tonalité de l'histoire
                                </Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {STORY_TONES.map(tone => {
                                        const Icon = tone.icon;
                                        const isSelected = selectedTone === tone.id;
                                        return (
                                            <button
                                                key={tone.id}
                                                type="button"
                                                onClick={() => setSelectedTone(tone.id)}
                                                className={cn(
                                                    "flex flex-col items-start p-2.5 rounded-xl border text-left transition-all",
                                                    isSelected
                                                        ? "border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/40"
                                                        : "border-border/60 hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                <div className="flex items-center gap-1.5 font-bold text-xs">
                                                    <Icon className="h-3.5 w-3.5 shrink-0" />
                                                    <span>{tone.label}</span>
                                                </div>
                                                <span className="text-[10px] opacity-75 mt-0.5 line-clamp-1">{tone.desc}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Companion Selector */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                                    Compagnon(s) de voyage
                                </Label>
                                <Select value={manualCompanionType} onValueChange={setManualCompanionType}>
                                    <SelectTrigger className="h-9 text-xs sm:text-sm">
                                        <SelectValue placeholder="Solo, En couple, Famille, Ami(e)s..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="solo">Voyage en Solo</SelectItem>
                                        <SelectItem value="conjoint">En Couple / Conjoint(e)</SelectItem>
                                        <SelectItem value="ami">Avec des Ami(e)s</SelectItem>
                                        <SelectItem value="famille">En Famille</SelectItem>
                                    </SelectContent>
                                </Select>

                                {manualCompanionType && manualCompanionType !== "solo" && (
                                    <Input
                                        placeholder="Prénom ou surnom du compagnon (optionnel)"
                                        value={manualCompanionName}
                                        onChange={(e) => setManualCompanionName(e.target.value)}
                                        className="h-9 text-xs sm:text-sm"
                                    />
                                )}
                            </div>

                            {/* Submit Button */}
                            <Button
                                onClick={handleGenerateStory}
                                disabled={isLoading || !user}
                                className="w-full mt-2 h-10 font-medium bg-gradient-to-r from-primary via-amber-600 to-primary text-white shadow-md shadow-primary/20 hover:opacity-95 transition-all"
                            >
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Wand2 className="mr-2 h-4 w-4" />
                                )}
                                {stories.some(s => s.id === selectedDays.sort().join('_'))
                                    ? "Régénérer le récit"
                                    : "Générer mon récit de voyage"}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Stories List (Immediately displayed without redundant header text to maximize space) */}
            <div className="space-y-3">
                {stories.length > 0 ? (
                    <Accordion
                        type="single"
                        collapsible
                        value={openAccordionItem}
                        onValueChange={setOpenAccordionItem}
                        className="w-full space-y-3"
                    >
                        {stories.map(story => {
                            const storyPhotos = Array.from(
                                new Set(story.instants.flatMap(i => i.photos || []).filter(Boolean) as string[])
                            );
                            const readingTime = getReadingTime(story.story);
                            const flagTheme = getStoryCountriesTheme(story);
                            const titleHasDate = hasDateInTitle(story.title, story.date);

                            return (
                                <AccordionItem
                                    key={story.id}
                                    value={story.id}
                                    style={{
                                        borderLeft: `4px solid ${flagTheme.primaryColor}`,
                                    }}
                                    className="relative border border-border/70 rounded-2xl overflow-hidden shadow-sm bg-card hover:border-primary/40 transition-all duration-300"
                                >
                                    {/* Top Flag Stripe Ribbon for visited country/countries */}
                                    <div
                                        className="h-1.5 w-full shrink-0"
                                        style={{
                                            background: flagTheme.stripeCss,
                                        }}
                                    />

                                    {/* Folded Banner Trigger */}
                                    <AccordionTrigger className="p-3.5 sm:p-4 hover:no-underline w-full text-left">
                                        <div className="flex items-center justify-between w-full pr-2 gap-3">
                                            {/* Left details */}
                                            <div className="space-y-1.5 min-w-0 flex-1">
                                                {/* Meta Pills: Country Flag & Reading Time (NO DUPLICATE DATE) */}
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    {flagTheme.hasCountries && (
                                                        <span
                                                            className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border shadow-xs"
                                                            style={{
                                                                borderColor: `${flagTheme.primaryColor}40`,
                                                                backgroundColor: `${flagTheme.primaryColor}15`,
                                                                color: flagTheme.primaryColor,
                                                            }}
                                                        >
                                                            <span>{flagTheme.emojis}</span>
                                                            <span className="truncate max-w-[140px] sm:max-w-[200px]">
                                                                {flagTheme.countryLabel}
                                                            </span>
                                                        </span>
                                                    )}

                                                    {/* Show date pill ONLY if the title itself doesn't already contain or represent the date */}
                                                    {!titleHasDate && (
                                                        <span className="text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                                                            {formatStoryDate(story.date)}
                                                        </span>
                                                    )}

                                                    <span className="text-[11px] text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {readingTime}
                                                    </span>
                                                </div>

                                                {/* Main Title */}
                                                <h3 className="font-bold text-base sm:text-lg text-foreground truncate pr-1">
                                                    {cleanTitle(story.title)}
                                                </h3>
                                            </div>

                                            {/* Photo scrolling / slideshow inside folded banner */}
                                            <BannerPhotosDefilantes
                                                photos={storyPhotos}
                                                onPhotoClick={(photo) => setSelectedLightboxPhoto(photo)}
                                            />
                                        </div>
                                    </AccordionTrigger>

                                    {/* Unfolded Content (Carnet de voyage) */}
                                    <AccordionContent className="pt-0 pb-6 px-4 sm:px-6">
                                        <StoryDisplay
                                            story={story}
                                            isSpeaking={speakingStoryId === story.id}
                                            onToggleSpeech={() => toggleStorySpeech(story)}
                                            onOpenVoiceSettings={() => setIsVoiceDialogOpen(true)}
                                            currentPersona={currentPersona}
                                            onCopy={() => handleCopyStory(story)}
                                            onShare={() => handleShareStory(story)}
                                            onEdit={() => handleEditStory(story)}
                                            onDelete={() => handleDeleteStory(story.id)}
                                            onSelectPhoto={(photo) => setSelectedLightboxPhoto(photo)}
                                            isCopied={copiedStoryId === story.id}
                                        />
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                ) : (
                    <div className="text-center py-10 px-4 border border-dashed rounded-2xl border-border/80 bg-muted/10 space-y-2.5">
                        <div className="h-11 w-11 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <BookOpen className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-medium text-foreground">
                            {user ? "Votre carnet de récits est encore vierge." : "Connectez-vous pour voir vos histoires."}
                        </p>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                            Sélectionnez une ou plusieurs journées plus haut pour créer votre premier récit illustré.
                        </p>
                    </div>
                )}
            </div>

            {/* Voice Settings Dialog: Exactly 2 natural female voices and 2 natural male voices */}
            <Dialog open={isVoiceDialogOpen} onOpenChange={setIsVoiceDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <Volume2 className="h-5 w-5 text-primary" />
                            Choisir la Voix du Conteur
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3 py-2">
                        <p className="text-xs text-muted-foreground">
                            Sélectionnez la voix française qui vous accompagnera pour raconter vos aventures :
                        </p>

                        <div className="grid grid-cols-1 gap-2.5">
                            {CURATED_VOICES.map((persona) => {
                                const isSelected = selectedVoiceId === persona.id;
                                const isCurrentlyTesting = testingPersonaId === persona.id;

                                return (
                                    <div
                                        key={persona.id}
                                        onClick={() => {
                                            setSelectedVoiceId(persona.id);
                                            localStorage.setItem('momenty_story_curated_voice', persona.id);
                                        }}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200",
                                            isSelected
                                                ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40"
                                                : "border-border/60 hover:bg-muted/40"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl select-none">{persona.genderEmoji}</span>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm text-foreground">{persona.name}</span>
                                                    <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-normal">
                                                        {persona.gender === 'femme' ? "Voix féminine" : "Voix masculine"}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-0.5">{persona.description}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            {/* Preview button for this voice */}
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handlePreviewPersona(persona);
                                                }}
                                                className={cn(
                                                    "h-8 px-2.5 text-xs rounded-full border-border/70",
                                                    isCurrentlyTesting && "bg-primary text-primary-foreground animate-pulse"
                                                )}
                                                title={`Écouter un extrait de ${persona.name}`}
                                            >
                                                <Play className="h-3 w-3 mr-1" />
                                                <span>{isCurrentlyTesting ? "Écoute..." : "Tester"}</span>
                                            </Button>

                                            {isSelected && (
                                                <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                                    <Check className="h-3.5 w-3.5" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={() => setIsVoiceDialogOpen(false)} className="w-full sm:w-auto">
                            Confirmer cette voix
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Photo Lightbox Dialog */}
            <Dialog open={!!selectedLightboxPhoto} onOpenChange={(open) => !open && setSelectedLightboxPhoto(null)}>
                <DialogContent className="max-w-3xl p-2 bg-black/95 border-none text-white overflow-hidden rounded-2xl">
                    <div className="relative w-full h-[70vh] flex items-center justify-center">
                        {selectedLightboxPhoto && (
                            <Image
                                src={selectedLightboxPhoto}
                                alt="Vue grand format"
                                fill
                                className="object-contain"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Story Dialog */}
            <Dialog open={isEditing !== null} onOpenChange={(open) => !open && setIsEditing(null)}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Modifier le récit</DialogTitle>
                    </DialogHeader>
                    <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="min-h-[380px] my-3 font-serif text-sm sm:text-base leading-relaxed"
                    />
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="ghost">Annuler</Button>
                        </DialogClose>
                        <Button onClick={handleSaveEdit}>Enregistrer les modifications</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
