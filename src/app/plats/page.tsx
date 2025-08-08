
"use client";

import { useContext } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { MapPin, Trash2, Utensils } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";

export default function PlatsPage() {
  const { dishes, deleteDish } = useContext(TimelineContext);
  const { toast } = useToast();

  const handleDelete = (id: string) => {
    deleteDish(id);
    toast({
        title: "Plat supprimé",
        description: "Le souvenir de ce plat a été retiré de votre journal.",
    })
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 min-h-screen">
      <div className="py-16 space-y-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Utensils className="h-8 w-8 text-primary"/>
            Mes Plats
        </h1>
        <p className="text-muted-foreground">Les saveurs qui ont marqué votre voyage.</p>
      </div>

      {dishes.length > 0 ? (
        <div className="grid md:grid-cols-1 gap-8">
          {dishes.map((dish) => (
            <Card key={dish.id} className="overflow-hidden">
                 {dish.photo && (
                    <Image
                        src={dish.photo}
                        alt={`Photo de ${dish.name}`}
                        width={600}
                        height={300}
                        className="w-full h-48 object-cover"
                        data-ai-hint="food dish"
                    />
                 )}
                 <CardHeader className="flex flex-row items-start gap-4">
                    <div className="flex-grow">
                        <CardTitle className="text-2xl">{dish.name}</CardTitle>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                            <MapPin className="h-4 w-4" />
                            Dégusté à {dish.location}
                        </p>
                    </div>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-5 w-5" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer ce plat ?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Cette action est irréversible et supprimera définitivement le souvenir de ce plat de votre journal.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(dish.id)}>
                                Supprimer
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                 </CardHeader>
              <CardContent className="pt-0">
                <p className="text-foreground/80 italic mb-4">"{dish.description}"</p>
                <div className="text-xs text-muted-foreground flex justify-between items-center">
                    <span>{format(parseISO(dish.date), "d MMMM yyyy", { locale: fr })}</span>
                    <div className="flex gap-2 flex-wrap">
                        {(Array.isArray(dish.emotion) ? dish.emotion : [dish.emotion]).map(e => (
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
          <p className="text-muted-foreground">Aucun plat enregistré pour le moment.</p>
          <p className="text-sm text-muted-foreground/80 mt-2">
            Utilisez le bouton '+' et l'icône de plat pour en ajouter un.
          </p>
        </div>
      )}
    </div>
  );
}
