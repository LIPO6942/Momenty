
"use client";

import { useState, useContext, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TimelineContext } from '@/context/timeline-context';
import { generateStory } from '@/ai/flows/generate-story-flow';
import type { GeneratedStory, Instant } from '@/lib/types';
import { Loader2, Wand2, Edit, Trash2, BookText } from 'lucide-react';
import Image from 'next/image';
import { saveStory, getStories, deleteStory as deleteStoryFromDB } from '@/lib/idb';
import { Textarea } from '@/components/ui/textarea';
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
import { Separator } from '@/components/ui/separator';

const StoryPreview = ({ story }: { story: string }) => {
    const html = story
      .split('\n')
      .map(line => {
        if (line.startsWith('# ')) {
          return `<h1 class="text-2xl font-bold mb-4">${line.substring(2)}</h1>`;
        }
        if (line.trim() === '') {
            return '<br />';
        }
        return `<p class="mb-2 leading-relaxed">${line}</p>`;
      })
      .join('');
  
    return <div dangerouslySetInnerHTML={{ __html: html }} className="prose dark:prose-invert max-w-none" />;
};

const StoryDisplay = ({ story }: { story: GeneratedStory }) => {
    const photos = story.instants.filter(i => i.photo);
    const notes = story.instants.filter(i => i.type === 'note' && i.description);
    
    return (
        <div className="space-y-4">
            <StoryPreview story={story.story} />

            {photos.length > 0 && (
                 <ScrollArea className="w-full whitespace-nowrap rounded-lg">
                    <div className="flex w-max space-x-4 p-1">
                        {photos.map((instant) => (
                           instant.photo && (
                            <div key={instant.id} className="flex-shrink-0">
                                <Image
                                    src={instant.photo}
                                    alt={instant.title}
                                    width={80}
                                    height={80}
                                    className="aspect-square h-fit w-full rounded-md object-cover"
                                />
                             </div>
                           )
                        ))}
                    </div>
                     <ScrollBar orientation="horizontal" />
                </ScrollArea>
            )}

            {notes.length > 0 && (
                <>
                <Separator/>
                <div className='space-y-2'>
                    <h4 className="font-semibold text-sm text-muted-foreground">Notes originales</h4>
                    <div className="space-y-2 text-sm text-foreground/80">
                        {notes.map(note => (
                            <div key={note.id} className="flex gap-2 items-start">
                                <BookText className="h-4 w-4 mt-1 flex-shrink-0" />
                                <span>{note.description}</span>
                            </div>
                        ))}
                    </div>
                </div>
                </>
            )}
        </div>
    )
}

export default function StoryPage() {
    const { groupedInstants } = useContext(TimelineContext);
    const { toast } = useToast();
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [stories, setStories] = useState<GeneratedStory[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState<GeneratedStory | null>(null);
    const [editText, setEditText] = useState("");

    useEffect(() => {
        const loadStories = async () => {
            const loadedStories = await getStories();
            setStories(loadedStories);
        };
        loadStories();
    }, []);

    const dayOptions = useMemo(() => {
        return Object.keys(groupedInstants).map(dayKey => ({
            value: dayKey,
            label: groupedInstants[dayKey].title
        }));
    }, [groupedInstants]);

    const handleGenerateStory = async () => {
        if (!selectedDay || !groupedInstants[selectedDay]) return;

        setIsLoading(true);
        try {
            const dayData = groupedInstants[selectedDay];
            const instantsForStory = dayData.instants.map(i => ({
                title: i.title,
                description: i.description,
                location: i.location,
                emotion: i.emotion,
                photo: i.photo ? 'yes' : undefined
            }));

            const result = await generateStory({
                day: dayData.title,
                instants: instantsForStory
            });
            
             // Clean instants before saving to IndexedDB
            const cleanInstants = dayData.instants.map(i => {
                const { icon, color, ...rest } = i;
                return rest;
            });

            const newStory: GeneratedStory = {
                id: selectedDay,
                date: selectedDay,
                title: dayData.title,
                story: result.story,
                instants: cleanInstants,
            };

            await saveStory(newStory);
            // For the state, we can use the original instants with all their properties
            setStories(prev => [...prev.filter(s => s.id !== selectedDay), {...newStory, instants: dayData.instants}].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            toast({ title: "Histoire générée et sauvegardée !" });

        } catch (error) {
            console.error("Failed to generate story:", error);
            toast({ variant: "destructive", title: "La génération a échoué." });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleEditStory = (story: GeneratedStory) => {
        setIsEditing(story);
        setEditText(story.story);
    };

    const handleSaveEdit = async () => {
        if (!isEditing) return;
        const updatedStory = { ...isEditing, story: editText };
        await saveStory(updatedStory);
        setStories(prev => prev.map(s => s.id === updatedStory.id ? updatedStory : s).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setIsEditing(null);
        toast({ title: "Histoire mise à jour." });
    };

    const handleDeleteStory = async (storyId: string) => {
        await deleteStoryFromDB(storyId);
        setStories(prev => prev.filter(s => s.id !== storyId));
        toast({ title: "Histoire supprimée." });
    };

    const selectedDayInstants = selectedDay ? groupedInstants[selectedDay]?.instants : [];

    return (
        <div className="container mx-auto max-w-2xl px-4 py-8 min-h-screen">
            <div className="py-16 space-y-2">
                <h1 className="text-3xl font-bold text-foreground">Générateur d'Histoires</h1>
                <p className="text-muted-foreground">Transformez vos journées de voyage en récits captivants.</p>
            </div>

            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>1. Créez ou recréez une histoire</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Select onValueChange={setSelectedDay} value={selectedDay || ""}>
                        <SelectTrigger>
                            <SelectValue placeholder="Choisissez une date..." />
                        </SelectTrigger>
                        <SelectContent>
                            {dayOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {selectedDay && (
                        <div className='pt-2'>
                             <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-4">
                                {selectedDayInstants?.map(instant => (
                                    instant.photo && (
                                        <Image key={instant.id} src={instant.photo} alt={instant.title} width={100} height={100} className="rounded-md object-cover aspect-square" />
                                    )
                                ))}
                             </div>
                             <Button onClick={handleGenerateStory} disabled={isLoading} className="w-full">
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Wand2 className="mr-2 h-4 w-4" />
                                )}
                                {stories.some(s => s.id === selectedDay) ? 'Régénérer l\'histoire' : 'Générer mon histoire'}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="space-y-6">
                 <h2 className="text-2xl font-bold text-foreground">Mes Histoires</h2>
                {stories.length > 0 ? stories.map(story => (
                    <Card key={story.id}>
                        <CardContent className="p-6">
                            <StoryDisplay story={story} />
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditStory(story)}>
                                <Edit className="mr-2 h-4 w-4" /> Modifier
                            </Button>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                        <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Cette action est irréversible. L'histoire sera définitivement supprimée.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteStory(story.id)}>
                                        Supprimer
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardFooter>
                    </Card>
                )) : (
                    <p className="text-muted-foreground text-center py-8">Aucune histoire générée pour le moment.</p>
                )}
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditing !== null} onOpenChange={(open) => !open && setIsEditing(null)}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Modifier l'histoire</DialogTitle>
                    </DialogHeader>
                    <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="min-h-[400px] my-4"
                    />
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="ghost">Annuler</Button>
                        </DialogClose>
                        <Button onClick={handleSaveEdit}>Enregistrer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
