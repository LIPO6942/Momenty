
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

export function ProfileForm() {
    const { toast } = useToast();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [age, setAge] = useState("");
    const [gender, setGender] = useState("");

    useEffect(() => {
        try {
            const savedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
            if (savedProfile) {
                const { firstName, lastName, age, gender } = JSON.parse(savedProfile);
                setFirstName(firstName || "");
                setLastName(lastName || "");
                setAge(age || "");
                setGender(gender || "");
            }
        } catch (error) {
            console.error("Failed to load profile from localStorage", error);
        }
    }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const profileData = { firstName, lastName, age, gender };
    try {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileData));
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
              <Label htmlFor="first-name">Prénom</Label>
              <Input id="first-name" placeholder="Max" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last-name">Nom</Label>
              <Input id="last-name" placeholder="Robinson" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                  <Label htmlFor="age">Âge</Label>
                  <Input id="age" type="number" placeholder="30" value={age} onChange={(e) => setAge(e.target.value)} />
              </div>
              <div className="grid gap-2">
                  <Label htmlFor="gender">Sexe</Label>
                   <Select value={gender} onValueChange={setGender}>
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
