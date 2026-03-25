"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Pause, Trash2, Library, Music, Info, Check, CloudUpload, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { searchHearthis, getPopularHearthis, type RemoteSound } from "@/lib/audio-service";

const AUDIO_LIBRARY = [
  { id: 'waves', name: 'Vagues & Mer', url: 'https://res.cloudinary.com/dmpp9v690/video/upload/v1711200000/momenty/ambience/waves.mp3', icon: '🌊', category: 'Nature' },
  { id: 'forest', name: 'Forêt & Oiseaux', url: 'https://res.cloudinary.com/dmpp9v690/video/upload/v1711200000/momenty/ambience/forest.mp3', icon: '🌲', category: 'Nature' },
  { id: 'rain', name: 'Pluie Douce', url: 'https://res.cloudinary.com/dmpp9v690/video/upload/v1711200000/momenty/ambience/rain.mp3', icon: '🌧️', category: 'Météo' },
  { id: 'cafe', name: 'Café Parisien', url: 'https://res.cloudinary.com/dmpp9v690/video/upload/v1711200000/momenty/ambience/cafe.mp3', icon: '☕', category: 'Ville' },
  { id: 'city', name: 'Bruit de la Ville', url: 'https://res.cloudinary.com/dmpp9v690/video/upload/v1711200000/momenty/ambience/city.mp3', icon: '🏙️', category: 'Ville' },
  { id: 'lofi', name: 'Lofi Chill', url: 'https://res.cloudinary.com/dmpp9v690/video/upload/v1711200000/momenty/ambience/lofi.mp3', icon: '🎹', category: 'Musique' },
  { id: 'adventure', name: 'Épopée', url: 'https://res.cloudinary.com/dmpp9v690/video/upload/v1711200000/momenty/ambience/adventure.mp3', icon: '⚔️', category: 'Musique' },
];

interface AudioPickerProps {
  value?: string;
  onChange: (url: string | null) => void;
}

export function AudioPicker({ value, onChange }: AudioPickerProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [activeAudio, setActiveAudio] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Library search state
  const [searchTerm, setSearchTerm] = useState("");
  const [remoteSounds, setRemoteSounds] = useState<RemoteSound[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Load popular sounds initially
  useEffect(() => {
    const loadPopular = async () => {
        const popular = await getPopularHearthis();
        setRemoteSounds(popular);
    };
    loadPopular();
  }, []);

  // Search effect with debounce
  useEffect(() => {
    if (!searchTerm.trim()) return;
    
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchHearthis(searchTerm);
      if (results.length > 0) {
        setRemoteSounds(results);
      }
      setIsSearching(false);
    }, 800);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleUpload(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev: number) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Mic access error:", err);
      toast({ variant: "destructive", title: "Accès micro refusé", description: "Veuillez autoriser l'accès au micro pour enregistrer." });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleUpload = async (blob: Blob) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', blob);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      onChange(result.secure_url);
      toast({ title: "Enregistrement vocal sauvegardé !" });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ variant: "destructive", title: "Erreur de sauvegarde", description: "Impossible d'envoyer l'enregistrement." });
    } finally {
      setIsUploading(false);
    }
  };

  const togglePreview = (url: string) => {
    if (activeAudio === url && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(url);
      audio.onended = () => setIsPlaying(false);
      audio.play();
      audioRef.current = audio;
      setActiveAudio(url);
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {value ? (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Music className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-primary/60">Audio sélectionné</p>
              <p className="text-sm font-bold truncate max-w-[150px]">Souvenir Sonore</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => togglePreview(value)}
              className="rounded-full bg-white/50 border shadow-sm"
            >
              {activeAudio === value && isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                onChange(null);
                if (audioRef.current) audioRef.current.pause();
                setIsPlaying(false);
              }}
              className="text-destructive rounded-full"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {/* Recording Button */}
          <Button
            type="button"
            variant="outline"
            className={cn(
              "h-24 rounded-2xl flex flex-col gap-2 border-dashed transition-all",
              isRecording ? "border-red-500 bg-red-50" : "hover:border-primary hover:bg-primary/5"
            )}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : isRecording ? (
              <div className="flex flex-col items-center animate-pulse text-red-600">
                <Square className="h-8 w-8" />
                <span className="text-[10px] font-black uppercase mt-1">{formatTime(recordingTime)}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-slate-500">
                <Mic className="h-8 w-8" />
                <span className="text-[10px] font-black uppercase mt-1">Enregistrer</span>
              </div>
            )}
          </Button>

          {/* Library Button */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-24 rounded-2xl flex flex-col gap-2 border-dashed hover:border-primary hover:bg-primary/5 text-slate-500"
              >
                <Library className="h-8 w-8" />
                <span className="text-[10px] font-black uppercase mt-1">Bibliothèque</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 rounded-2xl shadow-2xl border-none">
              <div className="p-4 border-b bg-slate-50 rounded-t-2xl">
                <h4 className="font-serif font-black uppercase text-sm tracking-widest text-slate-900">Bibliothèque Sonore</h4>
                <p className="text-[10px] text-slate-500 italic">Ajouter une ambiance à votre souvenir</p>
                
                <div className="mt-4 relative">
                  <Input 
                    placeholder="Rechercher (ex: Ocean, Lofi, Paris...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8 py-0 pl-8 rounded-lg text-xs"
                  />
                  {isSearching ? (
                    <Loader2 className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-primary animate-spin" />
                  ) : (
                    <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  )}
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto p-2 space-y-1 scrollbar-hide">
                <p className="text-[9px] font-black uppercase text-slate-400 px-2 py-1 tracking-widest">Favoris Momenty</p>
                {AUDIO_LIBRARY.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 transition-colors group">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{item.icon}</span>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{item.name}</p>
                        <Badge variant="outline" className="text-[8px] py-0 px-1 uppercase opacity-50">{item.category}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-full"
                        onClick={() => togglePreview(item.url)}
                      >
                        {activeAudio === item.url && isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="default"
                        className="h-8 w-8 rounded-full bg-slate-900"
                        onClick={() => {
                          onChange(item.url);
                          if (audioRef.current) audioRef.current.pause();
                          setIsPlaying(false);
                        }}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {remoteSounds.length > 0 && (
                   <>
                    <div className="h-px bg-slate-100 my-2 mx-2"></div>
                    <p className="text-[9px] font-black uppercase text-slate-400 px-2 py-1 tracking-widest">Résultats Hearthis.at</p>
                    {remoteSounds.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 transition-colors group">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span className="text-xl flex-shrink-0">{item.icon}</span>
                          <div className="overflow-hidden">
                            <p className="text-[11px] font-bold text-slate-800 truncate leading-tight">{item.name}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                                <Badge variant="outline" className="text-[7px] py-0 px-1 uppercase opacity-50">{item.category}</Badge>
                                <span className="text-[8px] text-slate-400 truncate max-w-[80px]">by {item.artist}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-full"
                            onClick={() => togglePreview(item.url)}
                          >
                            {activeAudio === item.url && isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="icon"
                            variant="default"
                            className="h-8 w-8 rounded-full bg-slate-900"
                            onClick={() => {
                              onChange(item.url);
                              if (audioRef.current) audioRef.current.pause();
                              setIsPlaying(false);
                            }}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                   </>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}
