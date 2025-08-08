
"use client";

import { useContext, useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { MapPin, Trash2, Utensils, Edit, MoreVertical } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { EditDishDialog } from "@/components/timeline/edit-dish-dialog";

export default function PlatsPage() {
  const { dishes, deleteDish } = useContext(TimelineContext);
  const { toast } = useToast();
  const [textVisibility, setTextVisibility] = useState<{ [key: string]: boolean }>({});

  const handleDelete = (id: string) => {
    deleteDish(id);
    toast({
        title: "Plat supprimé",
        description: "Le souvenir de ce plat a été retiré de votre journal.",
    })
  }

  const toggleTextVisibility = (id: string) => {
    setTextVisibility(prev => ({
        ...prev,
        [id]: !(prev[id] ?? true) // Default to true (visible)
    }));
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
          {dishes.map((dish) => {
            const isTextVisible = textVisibility[dish.id] ?? true;
            return (
            <Card key={dish.id} className="overflow-hidden rounded-xl border-none shadow-md shadow-slate-200/80 relative text-white">
                {dish.photo ? (
                    <>
                        <Image
                            src={dish.photo}
                            alt={`Photo de ${dish.name}`}
                            width={600}
                            height={400}
                            className="w-full h-[400px] object-cover"
                            data-ai-hint="food dish"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                        <div className="absolute top-2 right-2 flex gap-2">
                            <EditDishDialog dishToEdit={dish}>
                                 <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-white/80 hover:text-white hover:bg-white/10 focus-visible:text-white">
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </EditDishDialog>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-white/80 hover:text-white hover:bg-white/10 focus-visible:text-white">
                                        <Trash2 className="h-4 w-4" />
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
                        </div>
                        
                        <div 
                            className="absolute bottom-0 left-0 w-full cursor-pointer transition-opacity duration-300"
                            onClick={() => toggleTextVisibility(dish.id)}
                        >
                             <div 
                                className={cn(
                                    "p-4 transition-transform duration-300 ease-in-out",
                                    isTextVisible ? "translate-y-0" : "translate-y-full"
                                )}
                             >
                                <h3 className="font-bold text-2xl">{dish.name}</h3>
                                <p className="text-sm text-white/80 mt-1 italic">"{dish.description}"</p>
                                <div className="flex items-center gap-1.5 mt-3">
                                    <MapPin className="h-4 w-4 text-white/90" />
                                    <span className="font-semibold text-sm">Dégusté à {dish.location}</span>
                                </div>
                                <div className="flex justify-between items-end mt-3">
                                    <div className="flex gap-2 flex-wrap">
                                        {(Array.isArray(dish.emotion) ? dish.emotion : [dish.emotion]).map(e => (
                                            <Badge key={e} variant="outline" className="bg-white/20 text-white border-none">
                                                {e}
                                            </Badge>
                                        ))}
                                    </div>
                                    <span className="text-xs text-white/70">{format(parseISO(dish.date), "d MMM yyyy", { locale: fr })}</span>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <CardHeader className="flex flex-row items-start gap-4">
                           <div className="flex-grow">
                               <CardTitle className="text-2xl">{dish.name}</CardTitle>
                               <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                                   <MapPin className="h-4 w-4" />
                                   Dégusté à {dish.location}
                               </p>
                           </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreVertical className="h-5 w-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <EditDishDialog dishToEdit={dish}>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            <span>Modifier</span>
                                        </DropdownMenuItem>
                                    </EditDishDialog>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                <span>Supprimer</span>
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Supprimer ce plat ?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Cette action est irréversible.
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
                                </DropdownMenuContent>
                            </DropdownMenu>
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
                    </>
                )}
            </Card>
            )
          })}
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
