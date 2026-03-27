"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, User, Save, Loader2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function SettingsPage() {
    const { user, updateProfile } = useAuth();
    const router = useRouter();
    const [displayName, setDisplayName] = useState("");
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!user) {
            router.push("/login");
            return;
        }

        const fetchSettings = async () => {
            try {
                const snap = await getDoc(doc(db, "users", user.uid));
                if (snap.exists()) {
                    const data = snap.data();
                    setDisplayName(data.displayName || "");
                    setNotificationsEnabled(data.notificationsEnabled || false);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [user, router]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateProfile({
                displayName,
                notificationsEnabled
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto max-w-2xl px-4 py-32 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-2xl px-4 py-24 min-h-screen space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-3xl font-bold">Paramètres</h1>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        <CardTitle>Profil</CardTitle>
                    </div>
                    <CardDescription>Gérez vos informations de profil publiques.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="displayName">Nom d'affichage</Label>
                        <Input 
                            id="displayName" 
                            value={displayName} 
                            onChange={(e) => setDisplayName(e.target.value)} 
                            placeholder="Votre nom"
                        />
                    </div>
                    <div className="pt-2">
                        <p className="text-sm text-muted-foreground italic">
                            Votre nom est utilisé par vos amis pour vous trouver et partager des itinéraires.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-primary" />
                        <CardTitle>Notifications</CardTitle>
                    </div>
                    <CardDescription>Gérez la façon dont vous recevez les alertes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Notifications Push</Label>
                            <p className="text-sm text-muted-foreground">
                                Recevoir des alertes lorsqu'un itinéraire vous est partagé.
                            </p>
                        </div>
                        <Switch 
                            checked={notificationsEnabled} 
                            onCheckedChange={setNotificationsEnabled} 
                        />
                    </div>
                    
                    {!notificationsEnabled && (
                        <div className="p-3 rounded-md bg-orange-50 border border-orange-100 text-orange-800 text-sm">
                            <p>Note : Si vous désactivez les notifications, vous ne serez pas averti en temps réel des partages de vos amis.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex justify-end pt-4">
                <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto min-w-[200px]">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Enregistrer les modifications
                </Button>
            </div>
        </div>
    );
}
