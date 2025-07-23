"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BellRing } from "lucide-react";
import { messaging } from "@/lib/firebase";
import { getToken } from "firebase/messaging";


export function NotificationSetter() {
  const { toast } = useToast();

  const requestPermission = async () => {
    if (!("Notification" in window) || !('serviceWorker' in navigator)) {
       toast({
        variant: "destructive",
        title: "Notifications non supportées",
        description: "Votre navigateur ne supporte pas les notifications push.",
      });
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      toast({
        title: "Permission accordée !",
        description: "Vous pouvez maintenant recevoir des notifications."
      });
      // Get token
      const messagingInstance = messaging();
      try {
        const currentToken = await getToken(messagingInstance, { vapidKey: 'YOUR_VAPID_KEY_HERE' });
        if (currentToken) {
          console.log('FCM Token:', currentToken);
          // In a real app, you would send this token to your server.
           toast({
            title: "Jeton FCM obtenu",
            description: "Le jeton a été enregistré dans la console.",
          });
        } else {
          // Show permission request UI
          console.log('No registration token available. Request permission to generate one.');
           toast({
            variant: "destructive",
            title: "Jeton non disponible",
            description: "Demandez la permission pour générer un jeton.",
          });
        }
      } catch (err) {
        console.log('An error occurred while retrieving token. ', err);
         toast({
            variant: "destructive",
            title: "Erreur de jeton",
            description: "Une erreur est survenue lors de la récupération du jeton.",
         });
      }
    } else {
       toast({
        variant: "destructive",
        title: "Permission refusée",
        description: "Vous ne recevrez pas de notifications.",
      });
    }
  }


  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => console.log('Service Worker registered with scope:', registration.scope))
        .catch((error) => console.log('Service Worker registration failed:', error));
    }
  }, []);


  return (
    <Button onClick={requestPermission} variant="outline">
      <BellRing className="mr-2 h-4 w-4" />
      Activer les notifications
    </Button>
  );
}
