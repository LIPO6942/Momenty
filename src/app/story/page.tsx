
"use client";

import { useState, useContext, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TimelineContext } from '@/context/timeline-context';
import { generateStory } from '@/ai/flows/generate-story-flow';
import type { Instant } from '@/lib/types';
import { Loader2, Wand2 } from 'lucide-react';
import Image from 'next/image';

const StoryPreview = ({ story }: { story: string }) => {
    // A simple markdown-to-html renderer
    const html = story
      .split('\n')
      .map(line => {
        if (line.startsWith('# ')) {
          return `<h1 class="text-2xl font-bold mb-4">${line.substring(2)}</h1>`;
        }
        if (line.trim() === '') {
            return '<br />';
        }
        return `<p class="mb-2">${line}</p>`;
      })
      .join('');
  
    return <div dangerouslySetInnerHTML={{ __html: html }} className="prose dark:prose-invert" />;
};

export default function StoryPage() {
    const { groupedInstants } = useContext(TimelineContext);
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [story, setStory] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const dayOptions = useMemo(() => {
        return Object.keys(groupedInstants).map(dayKey => ({
            value: dayKey,
            label: groupedInstants[dayKey].title
        }));
    }, [groupedInstants]);

    const handleGenerateStory = async () => {
        if (!selectedDay || !groupedInstants[selectedDay]) return;

        setIsLoading(true);
        setStory(null);
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
            setStory(result.story);
        } catch (error) {
            console.error("Failed to generate story:", error);
            // You might want to show a toast message here
        } finally {
            setIsLoading(false);
        }
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
                    <CardTitle>1. Sélectionnez une journée</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
            </Card>

            {selectedDay && (
                 <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>2. Ingrédients de votre histoire</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                            {selectedDayInstants?.map(instant => (
                                instant.photo && (
                                    <Image key={instant.id} src={instant.photo} alt={instant.title} width={100} height={100} className="rounded-md object-cover aspect-square" />
                                )
                            ))}
                        </div>
                        <ul className="list-disc pl-5 text-sm text-muted-foreground">
                            {selectedDayInstants?.map(instant => (
                                <li key={instant.id}>{instant.title} ({instant.emotion})</li>
                            ))}
                        </ul>
                         <Button onClick={handleGenerateStory} disabled={isLoading} className="w-full">
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Wand2 className="mr-2 h-4 w-4" />
                            )}
                            Générer mon histoire
                        </Button>
                    </CardContent>
                </Card>
            )}

            {isLoading && (
                <div className="text-center p-8">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    <p className="mt-4 text-muted-foreground">Votre histoire est en cours de rédaction...</p>
                </div>
            )}

            {story && (
                <Card>
                    <CardHeader>
                        <CardTitle>3. Votre Récit</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="p-4 bg-secondary/50 rounded-lg">
                           <StoryPreview story={story} />
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
