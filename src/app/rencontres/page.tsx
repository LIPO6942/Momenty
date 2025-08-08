
"use client";

import { useState, useEffect, useContext } from "react";
import Image from "next/image";
import { type Encounter } from "@/lib/idb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { MapPin, Trash2, Users, Edit, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TimelineContext } from "@/context/timeline-context";
import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { EditEncounterDialog } from "@/components/timeline/edit-encounter-dialog";

export default function EncountersPage() {
  const { encounters, deleteEncounter } = useContext(TimelineContext);
  const { toast } = useToast();

  const handleDelete = (id: string) => {
    deleteEncounter(id);
    toast({
        title: "Rencontre supprimée",
        description: "Le souvenir de cette rencontre a été retiré de votre journal.",
    })
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 min-h-screen">
      <div className="py-16 space-y-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Users className="h-8 w-8 text-primary"/>
            Mes Rencontres
        </h1>
        <p className="text-muted-foreground">Les personnes qui ont marqué votre voyage.</p>
      </div>

      {encounters.length > 0 ? (
        <div className="grid md:grid-cols-1 gap-8">
          {encounters.map((encounter) => (
            <Card key={encounter.id} className="overflow-hidden">
                 {encounter.photo && (
                    <Image
                        src={encounter.photo}
                        alt={`Photo liée à ${encounter.name}`}
                        width={600}
                        height={300}
                        className="w-full h-48 object-cover"
                        data-ai-hint="person portrait"
                    />
                 )}
                 <CardHeader className="flex flex-row items-center gap-4">
                    <Avatar className="h-16 w-16">
                        {encounter.photo && <AvatarImage src={encounter.photo} alt={encounter.name} />}
                        <AvatarFallback className="text-2xl bg-primary/20">
                            {encounter.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                        <CardTitle className="text-2xl">{encounter.name}</CardTitle>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                            <MapPin className="h-4 w-4" />
                            Rencontré(e) à {encounter.location}
                        </p>
                    </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon">
                                <MoreVertical className="h-5 w-5" />
                           </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <EditEncounterDialog encounterToEdit={encounter}>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    <span>Modifier</span>
                                </DropdownMenuItem>
                            </EditEncounterDialog>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>Supprimer</span>
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Supprimer cette rencontre ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Cette action est irréversible et supprimera définitivement le souvenir de cette rencontre de votre journal.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(encounter.id)}>
                                        Supprimer
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </DropdownMenuContent>
                    </DropdownMenu>
                 </CardHeader>
              <CardContent className="pt-0">
                <p className="text-foreground/80 italic mb-4">"{encounter.description}"</p>
                <div className="text-xs text-muted-foreground flex justify-between items-center">
                    <span>{format(parseISO(encounter.date), "d MMMM yyyy", { locale: fr })}</span>
                    <div className="flex gap-2 flex-wrap">
                        {(Array.isArray(encounter.emotion) ? encounter.emotion : [encounter.emotion]).map(e => (
                             <Badge key={e} variant="outline">{e}</Badge>
                        ))}
                    </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <p className="text-muted-foreground">Aucune rencontre enregistrée pour le moment.</p>
          <p className="text-sm text-muted-foreground/80 mt-2">
            Utilisez le bouton '+' et l'icône de rencontre pour en ajouter une.
          </p>
        </div>
      )}
    </div>
  );
}
