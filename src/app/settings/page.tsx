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
import { doc, getDoc, collection, onSnapshot, query, orderBy, updateDoc, deleteDoc, where } from "firebase/firestore";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Trash2, ExternalLink, Download } from "lucide-react";

export default function SettingsPage() {
    const { user, updateProfile } = useAuth();
    const router = useRouter();
    const [displayName, setDisplayName] = useState("");
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const { toast } = useToast();

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

    useEffect(() => {
        if (!user) return;
        const q = query(
            collection(db, "users", user.uid, "notifications"),
            orderBy("createdAt", "desc")
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setNotifications(notifs);
        });
        return () => unsubscribe();
    }, [user]);

    const markAsRead = async (notifId: string) => {
        if (!user) return;
        try {
            await updateDoc(doc(db, "users", user.uid, "notifications", notifId), { read: true });
        } catch (e) {
            console.error(e);
        }
    };

    const deleteNotification = async (notifId: string) => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, "users", user.uid, "notifications", notifId));
            toast({ title: "Notification supprimée" });
        } catch (e) {
            console.error(e);
        }
    };

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
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Notifications Push</Label>
                            <p className="text-sm text-muted-foreground text-xs">Alerte en temps réel</p>
                        </div>
                        <Switch 
                            checked={notificationsEnabled} 
                            onCheckedChange={setNotificationsEnabled} 
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Save className="h-5 w-5 text-primary" />
                        <CardTitle>Partages Reçus</CardTitle>
                    </div>
                    <CardDescription>Itinéraires que vos amis vous ont envoyés.</CardDescription>
                </CardHeader>
                <CardContent>
                    {notifications.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">
                            Aucun itinéraire reçu pour le moment.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {notifications.map((n) => (
                                <div 
                                    key={n.id} 
                                    className={`p-4 rounded-lg border transition-colors ${n.read ? 'bg-background' : 'bg-primary/5 border-primary/20'}`}
                                    onClick={() => !n.read && markAsRead(n.id)}
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="space-y-1 flex-1">
                                            <div className="flex items-center gap-2">
                                                {!n.read && <div className="h-2 w-2 rounded-full bg-primary" />}
                                                <p className="font-semibold">{n.itineraryTitle}</p>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                Envoyé par <span className="text-foreground font-medium">{n.senderName}</span>
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {format(parseISO(n.createdAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <Button variant="outline" size="sm" asChild className="flex-1">
                                            <Link href={`/share/itinerary/${n.shareToken}`}>
                                                <ExternalLink className="mr-2 h-3 w-3" /> Voir
                                            </Link>
                                        </Button>
                                        <Button variant="secondary" size="sm" asChild className="flex-1">
                                            <Link href={`/itineraires?import=${n.shareToken}`}>
                                                <Download className="mr-2 h-3 w-3" /> Importer
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            ))}
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
