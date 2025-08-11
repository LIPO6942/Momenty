
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getProfile, saveProfile } from "@/lib/idb";
import type { ProfileData } from "@/lib/idb";
import { Edit, Save } from "lucide-react";
import { useAuth } from "@/context/auth-context";

type ProfileState = Omit<ProfileData, 'id'>;

const defaultProfile: ProfileState = {
    firstName: "",
    lastName: "",
    age: "",
    gender: "",
};

export function ProfileForm() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [profile, setProfile] = useState<ProfileState>(defaultProfile);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const savedProfile = await getProfile();
                if (savedProfile) {
                    setProfile(savedProfile);
                } else {
                    // If no profile is saved, automatically enter editing mode
                    setIsEditing(true);
                }
            } catch (error) {
                console.error("Failed to load profile from IndexedDB", error);
                toast({
                    variant: "destructive",
                    title: "Erreur de chargement",
                    description: "Impossible de charger le profil.",
                });
                // Enter editing mode if there's an error loading
                setIsEditing(true);
            }
        };
        loadProfile();
    }, [toast]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        await saveProfile(profile);
        toast({
            title: "Profil mis à jour !",
            description: "Vos informations ont été sauvegardées.",
        });
        setIsEditing(false); // Exit editing mode after saving
    } catch (error) {
        console.error("Failed to save profile to IndexedDB", error);
        toast({
            variant: "destructive",
            title: "Erreur de sauvegarde",
            description: "Impossible de sauvegarder vos informations.",
        });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { id, value } = e.target;
      setProfile(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: string) => {
    setProfile(prev => ({...prev, gender: value}));
  }

  const handleEditClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Prevent form submission
    setIsEditing(true);
  }

  return (
    <Card>
      <form onSubmit={handleSave}>
        <CardHeader>
            <CardTitle>Informations Personnelles</CardTitle>
            <CardDescription>Ces informations permettent de personnaliser votre expérience.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input id="firstName" placeholder="Max" value={profile.firstName} onChange={handleChange} required disabled={!isEditing} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input id="lastName" placeholder="Robinson" value={profile.lastName} onChange={handleChange} required disabled={!isEditing} />
            </div>
          </div>
           <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={user?.email || ""} disabled />
            </div>
          <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                  <Label htmlFor="age">Âge</Label>
                  <Input id="age" type="number" placeholder="30" value={profile.age} onChange={handleChange} disabled={!isEditing} />
              </div>
              <div className="grid gap-2">
                  <Label htmlFor="gender">Sexe</Label>
                   <Select value={profile.gender} onValueChange={handleSelectChange} disabled={!isEditing}>
                        <SelectTrigger id="gender">
                            <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="male">Homme</SelectItem>
                            <SelectItem value="female">Femme</SelectItem>
                        </SelectContent>
                    </Select>
              </div>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
            {isEditing ? (
                 <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer
                </Button>
            ) : (
                <Button type="button" onClick={handleEditClick}>
                    <Edit className="mr-2 h-4 w-4" />
                    Modifier le profil
                </Button>
            )}
        </CardFooter>
      </form>
    </Card>
  );
}
