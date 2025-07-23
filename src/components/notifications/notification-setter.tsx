"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BellRing } from "lucide-react";

export function NotificationSetter() {
  const { toast } = useToast();

  const handleNotificationClick = async () => {
    if (!("Notification" in window)) {
      toast({
        variant: "destructive",
        title: "Notifications non supportées",
        description: "Votre navigateur ne supporte pas les notifications.",
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
    setTimeout(() => {
      new Notification("Fi9 Rappel", {
        body: "C'est l'heure de votre habitude ! N'oubliez pas de boire de l'eau.",
        icon: "/favicon.ico", // Note: This icon needs to exist in your public folder.
      });
    }, 5000); // 5 seconds delay for demonstration

    toast({
      title: "Notification programmée !",
      description: "Vous recevrez une notification de test dans 5 secondes.",
    });
  };

  return (
    <Button onClick={handleNotificationClick} variant="outline">
      <BellRing className="mr-2 h-4 w-4" />
      Programmer une notification test
    </Button>
  );
}
