
"use client";

import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, type User, updateProfile as updateAuthProfile } from 'firebase/auth';
import type { AuthContextType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { db, messaging } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getToken, onMessage } from 'firebase/messaging';


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            if (user) {
                // Sync user to Firestore
                const userRef = doc(db, 'users', user.uid);
                const resolvedName = user.displayName || user.email?.split('@')[0] || 'Voyageur';
                await setDoc(userRef, {
                    uid: user.uid,
                    email: user.email,
                    displayName: resolvedName,
                    displayNameLower: resolvedName.toLowerCase(),
                    lastLogin: new Date().toISOString()
                }, { merge: true });
                
                // Initialize messaging if supported
                setupMessaging(user.uid);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const setupMessaging = async (userId: string) => {
        const msg = messaging();
        if (!msg) return;

        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                const swUrl = `/firebase-messaging-sw.js?apiKey=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}&projectId=${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}&messagingSenderId=${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}&appId=${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}`;
                const registration = await navigator.serviceWorker.register(swUrl);
                const token = await getToken(msg, { 
                    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
                    serviceWorkerRegistration: registration
                });
                if (token) {
                    await setDoc(doc(db, 'users', userId), { fcmToken: token, notificationsEnabled: true }, { merge: true });
                }
            }
        } catch (e) {
            console.error("FCM setup failed", e);
        }
    };

    const login = async (email: string, pass: string) => {
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, pass);
            router.push('/');
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Erreur de connexion", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const signup = async (email: string, pass: string, displayName?: string) => {
        setLoading(true);
        try {
            const res = await createUserWithEmailAndPassword(auth, email, pass);
            if (displayName) {
                await updateAuthProfile(res.user, { displayName });
                await setDoc(doc(db, 'users', res.user.uid), { displayName, displayNameLower: displayName.toLowerCase(), email, uid: res.user.uid }, { merge: true });
            }
            router.push('/');
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Erreur d'inscription", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        await signOut(auth);
        router.push('/login');
    };

    const updateProfile = async (data: { displayName?: string, fcmToken?: string, notificationsEnabled?: boolean }) => {
        if (!user) return;
        try {
            const updateData: Record<string, any> = { ...data };
            if (data.displayName) {
                await updateAuthProfile(user, { displayName: data.displayName });
                updateData.displayNameLower = data.displayName.toLowerCase();
            }
            await setDoc(doc(db, 'users', user.uid), updateData, { merge: true });
            toast({ title: "Profil mis à jour" });
        } catch (e: any) {
            toast({ variant: 'destructive', title: "Erreur", description: e.message });
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
