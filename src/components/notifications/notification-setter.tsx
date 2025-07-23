"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BellRing } from "lucide-react";

export function NotificationSetter() {
  const { toast } = useToast();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => console.log('Service Worker registered with scope:', registration.scope))
        .catch((error) => console.log('Service Worker registration failed:', error));
    }
  }, []);

  const handleNotificationClick = async () => {
    if (!("Notification" in window)) {
      toast({
        variant: "destructive",
        title: "Notifications non supportées",
        description: "Votre navigateur ne supporte pas les notifications.",
      });
      return;
    }
     if (!('serviceWorker' in navigator)) {
      toast({
        variant: "destructive",
        title: "Service Worker non supporté",
        description: "Les notifications push ne sont pas supportées par votre navigateur.",
      });
      return;
    }

    if (Notification.permission === "granted") {
      scheduleNotification();
    } else if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        scheduleNotification();
      } else {
        toast({
          variant: "destructive",
          title: "Permission refusée",
          description: "Vous ne recevrez pas de notifications.",
        });
      }
    } else {
       toast({
        variant: "destructive",
        title: "Permission bloquée",
        description: "Veuillez autoriser les notifications dans les paramètres de votre navigateur.",
      });
    }
  };

  const scheduleNotification = () => {
    navigator.serviceWorker.ready.then((registration) => {
        setTimeout(() => {
            registration.showNotification("Fi9 Rappel (local)", {
                body: "C'est l'heure de votre habitude ! N'oubliez pas de boire de l'eau.",
                icon: "/icon-192x192.png",
                badge: "/icon-192x192.png"
            });
        }, 5000); // 5 seconds delay for demonstration

        toast({
          title: "Notification programmée !",
          description: "Vous recevrez une notification de test dans 5 secondes.",
        });
    });
  };

  return (
    <Button onClick={handleNotificationClick} variant="outline">
      <BellRing className="mr-2 h-4 w-4" />
      Programmer une notification test
    </Button>
  );
}
