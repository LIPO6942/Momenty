"use client";

import { useState, useEffect } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface VoiceInputProps {
    onTranscript: (text: string) => void;
    isActive?: boolean;
    size?: "sm" | "default" | "lg";
    variant?: "default" | "outline" | "ghost";
}

export function VoiceInput({
    onTranscript,
    isActive = false,
    size = "default",
    variant = "outline"
}: VoiceInputProps) {
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(true);
    const [recognition, setRecognition] = useState<any>(null);
    const { toast } = useToast();

    useEffect(() => {
        // Check if browser supports Speech Recognition
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

            if (!SpeechRecognition) {
                setIsSupported(false);
                return;
            }

            const recognitionInstance = new SpeechRecognition();
            recognitionInstance.continuous = true;
            recognitionInstance.interimResults = true;
            recognitionInstance.lang = 'fr-FR'; // French language

            recognitionInstance.onresult = (event: any) => {
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    }
                }

                if (finalTranscript) {
                    onTranscript(finalTranscript.trim());
                }
            };

            recognitionInstance.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);

                if (event.error === 'not-allowed') {
                    toast({
                        variant: "destructive",
                        title: "Microphone bloqué",
                        description: "Veuillez autoriser l'accès au microphone dans les paramètres de votre navigateur."
                    });
                } else if (event.error === 'no-speech') {
                    toast({
                        variant: "destructive",
                        title: "Aucun son détecté",
                        description: "Assurez-vous que votre microphone fonctionne correctement."
                    });
                } else {
                    toast({
                        variant: "destructive",
                        title: "Erreur de reconnaissance vocale",
                        description: event.error
                    });
                }
            };

            recognitionInstance.onend = () => {
                setIsListening(false);
            };

            setRecognition(recognitionInstance);
        }
    }, [onTranscript, toast]);

    const toggleListening = () => {
        if (!isSupported) {
            toast({
                variant: "destructive",
                title: "Non supporté",
                description: "Votre navigateur ne supporte pas la reconnaissance vocale. Veuillez utiliser Chrome, Edge ou Safari."
            });
            return;
        }

        if (isListening) {
            recognition?.stop();
            setIsListening(false);
        } else {
            recognition?.start();
            setIsListening(true);
            toast({
                title: "🎤 Écoute en cours...",
                description: "Parlez maintenant. Appuyez à nouveau pour arrêter."
            });
        }
    };

    if (!isSupported) {
        return null; // Don't show button if not supported
    }

    return (
        <Button
            type="button"
            variant={isListening ? "destructive" : variant}
            size={size === "sm" ? "sm" : "icon"}
            onClick={toggleListening}
            className={isListening ? "animate-pulse" : ""}
            title={isListening ? "Arrêter l'écoute" : "Dicter au micro"}
        >
            {isListening ? (
                <MicOff className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
            ) : (
                <Mic className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
            )}
        </Button>
    );
}
