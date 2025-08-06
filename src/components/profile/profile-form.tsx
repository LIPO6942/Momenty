
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

const PROFILE_STORAGE_KEY = "userProfile";

type ProfileData = {
    firstName: string;
    lastName: string;
    age: string;
    gender: string;
};

export function ProfileForm() {
    const { toast } = useToast();
    const [profile, setProfile] = useState<ProfileData>({
        firstName: "",
        lastName: "",
        age: "",
        gender: "",
    });

    useEffect(() => {
        try {
            const savedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
            if (savedProfile) {
                setProfile(JSON.parse(savedProfile));
            }
        } catch (error) {
            console.error("Failed to load profile from localStorage", error);
        }
    }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
        toast({
            title: "Profil mis à jour !",
            description: "Vos informations ont été sauvegardées.",
        });
    } catch (error) {
        console.error("Failed to save profile to localStorage", error);
        toast({
            variant: "destructive",
            title: "Erreur de sauvegarde",
            description: "Impossible de sauvegarder vos informations.",
        });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setProfile(prev => ({...prev, [e.target.id.replace(/-/g, '')]: e.target.value}));
  }

  const handleSelectChange = (value: string) => {
    setProfile(prev => ({...prev, gender: value}));
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>Informations Personnelles</CardTitle>
            <CardDescription>Ces informations permettent de personnaliser votre expérience.</CardDescription>
        </CardHeader>
      <form onSubmit={handleSave}>
        <CardContent className="grid gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input id="firstName" placeholder="Max" value={profile.firstName} onChange={handleChange} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input id="lastName" placeholder="Robinson" value={profile.lastName} onChange={handleChange} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                  <Label htmlFor="age">Âge</Label>
                  <Input id="age" type="number" placeholder="30" value={profile.age} onChange={handleChange} />
              </div>
              <div className="grid gap-2">
                  <Label htmlFor="gender">Sexe</Label>
                   <Select value={profile.gender} onValueChange={handleSelectChange}>
                        <SelectTrigger id="gender">
                            <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="male">Homme</SelectItem>
                            <SelectItem value="female">Femme</SelectItem>
                            <SelectItem value="other">Autre</SelectItem>
                        </SelectContent>
                    </Select>
              </div>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
            <Button type="submit">Enregistrer les modifications</Button>
        </CardFooter>
      </form>
    </Card>
  );
}
