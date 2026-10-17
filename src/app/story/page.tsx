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
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/context/auth-context';

const STORY_TONES = [
    { id: 'poetique', label: 'Poétique', icon: Sparkles, desc: 'Lumières, sensations & émotions' },
    { id: 'aventure', label: 'Aventurier', icon: Compass, desc: 'Exploration, rythme & découvertes' },
    { id: 'humour', label: 'Fun & Décalé', icon: Smile, desc: 'Humour, spontanéité & anecdotes' },
    { id: 'intime', label: 'Carnet Secret', icon: BookOpen, desc: 'Récit introspectif & sincère' },
];

const cleanTitle = (raw: string) => {
    return raw.replace(/^#+\s*/, '').trim();
};

const getReadingTime = (text: string) => {
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.round(words / 160));
    return `${minutes} min de lecture`;
};

const formatStoryDate = (dateStr: string) => {
    try {
        return format(parseISO(dateStr), 'd MMMM yyyy', { locale: fr });
    } catch {
        return dateStr;
    }
};

const StoryReader = ({ text }: { text: string }) => {
    const rawParagraphs = text.split(/\n+/).map(p => p.trim()).filter(Boolean);
    const hasMarkdownTitle = rawParagraphs[0]?.startsWith('#');
    const contentParagraphs = hasMarkdownTitle ? rawParagraphs.slice(1) : rawParagraphs;

    return (
        <div className="space-y-4 font-serif text-base sm:text-lg leading-relaxed sm:leading-loose text-foreground/90">
            {contentParagraphs.map((para, idx) => {
                const isQuote = para.startsWith('>') || (para.startsWith('«') && para.endsWith('»'));
                if (isQuote) {
                    const cleanQuote = para.replace(/^>\s*/, '').replace(/^«|»$/g, '').trim();
                    return (
                        <div
                            key={idx}
                            className="my-5 px-5 py-3.5 border-l-4 border-amber-500 bg-amber-500/10 rounded-r-xl italic flex gap-3 text-foreground"
                        >
                            <Quote className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <p className="font-medium text-base sm:text-lg leading-relaxed">
                                « {cleanQuote} »
                            </p>
                        </div>
                    );
                }

                // First paragraph gets the literary Drop Cap (Lettrine)
                if (idx === 0 && para.length > 3) {
                    const firstChar = para.charAt(0);
                    const rest = para.slice(1);
                    return (
                        <p key={idx} className="text-justify font-serif text-foreground/90">
                            <span className="float-left text-5xl sm:text-6xl font-serif font-black text-amber-600 dark:text-amber-400 mr-3 mb-0 leading-none select-none drop-shadow-sm">
                                {firstChar}
                            </span>
                            {rest}
                        </p>
                    );
                }

                return (
                    <p key={idx} className="text-justify font-serif text-foreground/90">
                        {para}
                    </p>
                );
            })}
        </div>
    );
};

interface StoryDisplayProps {
    story: GeneratedStory;
    isSpeaking: boolean;
    onToggleSpeech: () => void;
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
        <div className="space-y-6">
            {/* Hero Cover Banner if photos exist, or stylish gradient banner */}
            {photos.length > 0 ? (
                <div className="relative h-48 sm:h-60 w-full rounded-2xl overflow-hidden shadow-md group">
                    <Image
                        src={photos[0]}
                        alt={story.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/15" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge className="bg-amber-500/90 hover:bg-amber-500 text-white border-none font-semibold text-xs shadow-sm">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatStoryDate(story.date)}
                            </Badge>
                            {locations.length > 0 && (
                                <Badge variant="secondary" className="bg-white/20 backdrop-blur-md text-white border-none text-xs">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {locations.slice(0, 2).join(', ')}{locations.length > 2 ? ` +${locations.length - 2}` : ''}
                                </Badge>
                            )}
                            <Badge variant="secondary" className="bg-white/20 backdrop-blur-md text-white border-none text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {getReadingTime(story.story)}
                            </Badge>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-md line-clamp-2">
                            {cleanTitle(story.title)}
                        </h3>
                    </div>
                </div>
            ) : (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-primary/10 to-transparent border border-amber-500/20">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge className="bg-primary/90 text-primary-foreground text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatStoryDate(story.date)}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {getReadingTime(story.story)}
                        </Badge>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                        {cleanTitle(story.title)}
                    </h3>
                </div>
            )}

            {/* Interactive Audio & Actions Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/20 backdrop-blur-sm">
                <div className="flex items-center gap-2">
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

                    {isSpeaking && (
                        <div className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300 font-medium ml-1">
                            <span className="inline-block w-1.5 h-3 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <span className="inline-block w-1.5 h-4 bg-amber-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <span className="inline-block w-1.5 h-3 bg-amber-500 rounded-full animate-bounce" />
                            <span className="ml-1 text-[11px] hidden sm:inline">Conteur audio actif</span>
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

            {/* Carnet de Voyage Paper View */}
            <div className="relative rounded-2xl p-5 sm:p-8 bg-gradient-to-br from-amber-50/70 via-background to-orange-50/30 dark:from-zinc-900/80 dark:via-zinc-900/40 dark:to-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 shadow-sm overflow-hidden">
                {/* Decorative bookmark ribbon effect */}
                <div className="absolute top-0 right-8 w-6 h-8 bg-amber-500/80 rounded-b-sm shadow-sm" />

                <StoryReader text={story.story} />
            </div>

            {/* Photo Polaroid Collection */}
            {photos.length > 0 && (
                <div className="mt-6 pt-4">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h4 className="font-bold text-sm sm:text-base flex items-center gap-2 text-foreground">
                            <Camera className="h-4 w-4 text-amber-600" />
                            Clichés du voyage ({photos.length})
                        </h4>
                        <span className="text-[11px] text-muted-foreground">Cliquez pour agrandir</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {photos.map((photo, index) => {
                            const rotations = ['rotate-1', '-rotate-1', 'rotate-2', '-rotate-2', 'rotate-0'];
                            const rot = rotations[index % rotations.length];
                            return (
                                <div
                                    key={index}
                                    onClick={() => onSelectPhoto(photo)}
                                    className={cn(
                                        "group relative bg-card p-2 pb-4 rounded-xl shadow-sm hover:shadow-lg border border-border/60 transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1 hover:rotate-0",
                                        rot
                                    )}
                                >
                                    <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-muted">
                                        <Image
                                            src={photo}
                                            alt={`Souvenir ${index + 1}`}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                                            <Maximize2 className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                                        </div>
                                    </div>
                                    <div className="pt-2 text-center">
                                        <span className="text-[10px] text-muted-foreground font-serif tracking-wider uppercase">
                                            Cliché #{index + 1}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Original Notes / Field Journal */}
            {notes.length > 0 && (
                <div className="mt-4 p-4 rounded-xl bg-muted/40 border border-border/40 space-y-2.5">
                    <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <BookText className="h-3.5 w-3.5 text-primary" />
                        Notes originales de terrain
                    </h4>
                    <div className="space-y-1.5 text-sm text-foreground/80">
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
    const [openAccordionItem, setOpenAccordionItem] = useState<string | undefined>();
    const [userProfile, setUserProfile] = useState<Omit<ProfileData, 'id'> | null>(null);
    const [isDaySelectorOpen, setIsDaySelectorOpen] = useState(false);
    const [manualCompanionType, setManualCompanionType] = useState<string>("");
    const [manualCompanionName, setManualCompanionName] = useState<string>("");
    const [selectedTone, setSelectedTone] = useState<string>('poetique');
    const [speakingStoryId, setSpeakingStoryId] = useState<string | null>(null);
    const [copiedStoryId, setCopiedStoryId] = useState<string | null>(null);
    const [selectedLightboxPhoto, setSelectedLightboxPhoto] = useState<string | null>(null);

    // Stop audio on unmount
    useEffect(() => {
        return () => {
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

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
        utterance.rate = 0.95;
        utterance.pitch = 1.0;

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
        if (hydratedStories.length > 0 && !openAccordionItem) {
            setOpenAccordionItem(hydratedStories[0].id);
        }
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
        <div className="container mx-auto max-w-2xl px-4 pt-24 sm:pt-28 pb-12 min-h-screen">
            {/* Header Block */}
            <div className="pt-1 pb-3 text-center space-y-1.5 mb-6">
                <Badge variant="outline" className="border-primary/40 text-primary gap-1.5 px-3 py-1 bg-primary/5 rounded-full text-xs font-medium">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    Carnet de Voyage IA
                </Badge>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                    Générateur d'Histoires
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                    Transformez vos journées en récits de voyage vivants, illustrés et captivants.
                </p>
            </div>

            {/* Creation Card (Step 1) */}
            <Card className="mb-8 border-border/70 shadow-sm overflow-hidden bg-card/90 backdrop-blur-sm">
                <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <Wand2 className="h-4 w-4 text-primary" />
                        1. Créer ou recréer une histoire
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
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
                        <div className="space-y-4 pt-1 animate-in fade-in-50 duration-300">
                            {/* Photo Filmstrip */}
                            {selectedDaysPhotos.length > 0 && (
                                <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
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
                                className="w-full mt-2 h-11 font-medium bg-gradient-to-r from-primary via-amber-600 to-primary text-white shadow-md shadow-primary/20 hover:opacity-95 transition-all"
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

            {/* Stories Collection Section (The core request) */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        Mes Récits ({stories.length})
                    </h2>
                    {stories.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                            {stories.length} histoire{stories.length > 1 ? 's' : ''} dans votre carnet
                        </span>
                    )}
                </div>

                {stories.length > 0 ? (
                    <Accordion
                        type="single"
                        collapsible
                        value={openAccordionItem}
                        onValueChange={setOpenAccordionItem}
                        className="w-full space-y-4"
                    >
                        {stories.map(story => {
                            const firstPhoto = story.instants.flatMap(i => i.photos || []).find(Boolean);
                            const readingTime = getReadingTime(story.story);

                            return (
                                <AccordionItem
                                    key={story.id}
                                    value={story.id}
                                    className="border border-border/70 rounded-2xl overflow-hidden shadow-sm bg-card hover:border-primary/40 transition-colors"
                                >
                                    <AccordionTrigger className="p-4 hover:no-underline w-full text-left [&[data-state=open]>div>.story-preview-thumb]:opacity-0">
                                        <div className="flex items-center justify-between w-full pr-3 gap-3">
                                            <div className="space-y-1 min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                                        {formatStoryDate(story.date)}
                                                    </span>
                                                    <span className="text-[11px] text-muted-foreground">
                                                        • {readingTime}
                                                    </span>
                                                </div>
                                                <h3 className="font-bold text-base sm:text-lg text-foreground truncate">
                                                    {cleanTitle(story.title)}
                                                </h3>
                                            </div>

                                            {/* Small thumbnail for collapsed view */}
                                            {firstPhoto && (
                                                <div className="story-preview-thumb relative h-12 w-12 shrink-0 rounded-lg overflow-hidden border border-border/60 shadow-sm transition-opacity">
                                                    <Image src={firstPhoto} alt="" fill className="object-cover" />
                                                </div>
                                            )}
                                        </div>
                                    </AccordionTrigger>

                                    <AccordionContent className="pt-0 pb-6 px-4 sm:px-6">
                                        <StoryDisplay
                                            story={story}
                                            isSpeaking={speakingStoryId === story.id}
                                            onToggleSpeech={() => toggleStorySpeech(story)}
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
                    <div className="text-center py-12 px-4 border border-dashed rounded-2xl border-border/80 bg-muted/10 space-y-3">
                        <div className="h-12 w-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <BookOpen className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-medium text-foreground">
                            {user ? "Votre carnet de récits est encore vierge." : "Connectez-vous pour voir vos histoires."}
                        </p>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                            Sélectionnez une ou plusieurs journées plus haut pour donner vie à vos premiers souvenirs de voyage.
                        </p>
                    </div>
                )}
            </div>

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
