"use client";

import { useState } from "react";
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

export function ProfileForm() {
    const { toast } = useToast();
    const [firstName, setFirstName] = useState("Max");
    const [lastName, setLastName] = useState("Robinson");
    const [age, setAge] = useState("30");
    const [gender, setGender] = useState("male");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would save this data.
    console.log({ firstName, lastName, age, gender });
    toast({
        title: "Profil mis à jour !",
        description: "Vos informations ont été sauvegardées.",
    });
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
