"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Pause, Trash2, Library, Music, Info, Check, CloudUpload, Loader2, Search, X, Volume2, Wind, TreePine, Coffee, Ghost, Headphones, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { searchHearthis, getPopularHearthis, searchITunes, type RemoteSound } from "@/lib/audio-service";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

const CATEGORIES = [
  { id: 'music', label: 'Chansons', icon: <Music className="h-4 w-4" />, query: 'songs' },
  { id: 'samples', label: 'Samples & SFX', icon: <Ghost className="h-4 w-4" />, query: 'sound effect sfx short sample' },
  { id: 'nature', label: 'Nature', icon: <TreePine className="h-4 w-4" />, query: 'nature ambience' },
  { id: 'city', label: 'Ville', icon: <Coffee className="h-4 w-4" />, query: 'city street ambience' },
  { id: 'rain', label: 'Pluie', icon: <Wind className="h-4 w-4" />, query: 'rain relaxing' },
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
  
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [selectedSoundName, setSelectedSoundName] = useState<string | null>(null);

  // Library search state
  const [searchTerm, setSearchTerm] = useState("");
  const [remoteSounds, setRemoteSounds] = useState<RemoteSound[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeCategory, setActiveCategory] = useState("popular");
  
  // Load popular sounds initially
  useEffect(() => {
    const loadPopular = async () => {
        setIsSearching(true);
        const popular = await getPopularHearthis();
        setRemoteSounds(popular);
        setIsSearching(false);
    };
    loadPopular();
  }, []);

  // Search effect with debounce
  useEffect(() => {
    if (!searchTerm.trim()) return;
    
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      // Search both for better coverage
      const [hearthisRes, itunesRes] = await Promise.all([
        searchHearthis(searchTerm),
        searchITunes(searchTerm)
      ]);
      setRemoteSounds([...itunesRes.slice(0, 5), ...hearthisRes.slice(0, 5)]);
      setIsSearching(false);
    }, 800);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleManualSearch = async () => {
    if (!searchTerm.trim()) return;
    setIsSearching(true);
    const [hearthisRes, itunesRes] = await Promise.all([
      searchHearthis(searchTerm),
      searchITunes(searchTerm)
    ]);
    setRemoteSounds([...itunesRes.slice(0, 5), ...hearthisRes.slice(0, 5)]);
    setIsSearching(false);
  };

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
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
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
      
      if (!response.ok || !result.secure_url) {
        throw new Error(result.message || result.error || "Upload failed");
      }

      onChange(result.secure_url);
      setSelectedSoundName("Enregistrement vocal");
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
      audio.onerror = () => {
        setIsPlaying(false);
        toast({ variant: "destructive", title: "Lecture impossible", description: "Ce fichier audio n'est pas disponible." });
      };
      audio.play().catch(() => {
        toast({ variant: "destructive", title: "Lecture bloquée", description: "Appuyez à nouveau pour lire." });
      });
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
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Music className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-primary/60">Ambiance sélectionnée</p>
                <p className="text-sm font-bold truncate max-w-[200px]">{selectedSoundName || "Souvenir Sonore"}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => togglePreview(value)}
                className="rounded-full bg-white/50 border shadow-sm h-9 w-9"
              >
                {activeAudio === value && isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  onChange(null);
                  setSelectedSoundName(null);
                  if (audioRef.current) audioRef.current.pause();
                  setIsPlaying(false);
                }}
                className="text-destructive rounded-full h-9 w-9"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full rounded-xl text-xs font-bold gap-2"
            onClick={() => setIsLibraryOpen(true)}
          >
            <RefreshCw className="h-3 w-3" /> Changer le son
          </Button>
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
          <Button
            type="button"
            variant="outline"
            className="h-24 rounded-2xl flex flex-col gap-2 border-dashed hover:border-primary hover:bg-primary/5 text-slate-500"
            onClick={() => setIsLibraryOpen(true)}
          >
            <Library className="h-8 w-8" />
            <span className="text-[10px] font-black uppercase mt-1">Bibliothèque</span>
          </Button>
        </div>
      )}

      {/* Studio Sonore Custom Overlay Layout - Avoids nested Dialog focus bounds */}
      {isLibraryOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsLibraryOpen(false)} />
          <div className="w-full max-w-4xl h-[85vh] sm:h-[90vh] flex flex-col p-0 overflow-hidden rounded-3xl shadow-2xl bg-white relative z-10 animate-in zoom-in-95 duration-200">
            <div className="p-6 md:p-8 bg-slate-900 text-white relative flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl md:text-3xl font-serif font-black uppercase tracking-tight flex items-center gap-4">
                <Volume2 className="h-7 w-7 md:h-8 md:w-8 text-amber-400" />
                Studio Sonore
              </DialogTitle>
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="text-white/60 hover:text-white hover:bg-white/10 rounded-full h-10 w-10"
                onClick={() => setIsLibraryOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-slate-400 text-sm md:text-base font-medium mt-1">Donnez une âme à vos instants avec une ambiance unique.</p>

            <div className="mt-6 md:mt-8 relative max-w-xl flex gap-x-2">
              <div className="relative flex-1">
                <input 
                  type="text"
                  placeholder="Ex: Explosion, Vent, Mer, Piano..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleManualSearch();
                    }
                  }}
                  className="w-full h-12 md:h-14 bg-white/10 border border-white/20 text-white placeholder:text-white/40 pl-12 md:pl-14 pr-4 text-base md:text-lg rounded-2xl outline-none focus:ring-2 focus:ring-amber-400"
                />
                <Search className="h-5 w-5 md:h-6 md:w-6 absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-white/40" />
              </div>
              <Button 
                type="button"
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  handleManualSearch();
                }}
                className="h-12 md:h-14 px-4 md:px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
              >
                Chercher
              </Button>
            </div>
            {isSearching && (
              <p className="text-[10px] text-amber-400 font-black uppercase mt-2 animate-pulse">Recherche en cours...</p>
            )}
          </div>

          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Categories */}
            <div className="md:w-56 bg-slate-50 md:bg-white border-b md:border-b-0 md:border-r flex-shrink-0">
              <div className="p-3 md:p-6">
                <p className="hidden md:block text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest leading-none">Inspirations</p>
                <div className="flex overflow-x-auto md:flex-col gap-2 pb-1 md:pb-0 scrollbar-hide">
                  <Button 
                    variant={activeCategory === 'popular' ? 'secondary' : 'ghost'} 
                    className={cn("flex-shrink-0 md:w-full justify-start gap-2 md:gap-3 text-sm font-bold rounded-xl h-9 md:h-12", activeCategory === 'popular' && "bg-slate-200 md:bg-slate-100")}
                    onClick={() => {
                      setActiveCategory('popular');
                      setSearchTerm('');
                      setRemoteSounds([]);
                      setIsSearching(true);
                      getPopularHearthis().then(res => {
                        setRemoteSounds(res);
                        setIsSearching(false);
                      });
                    }}
                  >
                    <Volume2 className="h-4 w-4 md:h-5 md:w-5" /> Populaires
                  </Button>
                  {CATEGORIES.map(cat => (
                    <Button 
                      key={cat.id}
                      variant={activeCategory === cat.id ? 'secondary' : 'ghost'} 
                      className={cn("flex-shrink-0 md:w-full justify-start gap-2 md:gap-3 text-sm font-bold rounded-xl h-9 md:h-12", activeCategory === cat.id && "bg-slate-200 md:bg-slate-100")}
                      onClick={() => {
                        setActiveCategory(cat.id);
                        setSearchTerm(cat.label);
                        setRemoteSounds([]);
                        setIsSearching(true);
                        
                        if (cat.id === 'music') {
                          searchITunes(cat.query).then(res => {
                            setRemoteSounds(res);
                            setIsSearching(false);
                          });
                        } else {
                          searchHearthis(cat.query).then(res => {
                            setRemoteSounds(res);
                            setIsSearching(false);
                          });
                        }
                      }}
                    >
                     <span className="text-slate-500 text-xs md:text-base">{cat.icon}</span> {cat.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sounds Result */}
            <ScrollArea className="flex-1 p-4 md:p-8">
              {isSearching ? (
                <div className="flex flex-col items-center justify-center py-20 md:py-32 gap-6">
                  <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
                  </div>
                  <p className="text-base font-serif italic text-slate-500">Extraction des fréquences...</p>
                </div>
              ) : remoteSounds.length === 0 ? (
                <div className="text-center py-20 md:py-32 flex flex-col items-center">
                  <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                    <AlertCircle className="h-10 w-10 text-slate-200" />
                  </div>
                  <p className="text-lg font-serif italic text-slate-600">Le silence est d'or, mais nous n'avons rien trouvé.</p>
                  <Button variant="outline" onClick={() => setSearchTerm("")} className="mt-6 rounded-xl">Retour aux favoris</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 pb-12">
                  {remoteSounds.map((item) => (
                    <Card key={item.id} className="relative overflow-hidden group hover:shadow-xl transition-all border-slate-100 rounded-2xl md:rounded-3xl hover:-translate-y-1 bg-white">
                      <CardContent className="p-4 md:p-6">
                        <div className="flex items-start gap-4 md:gap-5">
                          <div 
                            className={cn(
                              "h-14 w-14 md:h-16 md:w-16 flex-shrink-0 rounded-xl md:rounded-2xl flex items-center justify-center text-3xl transition-all cursor-pointer overflow-hidden",
                              activeAudio === item.url && isPlaying ? "bg-amber-100 shadow-inner" : "bg-slate-50 group-hover:bg-amber-50"
                            )}
                            onClick={() => togglePreview(item.url)}
                          >
                            {item.artwork ? (
                              <div className="relative w-full h-full">
                                <img src={item.artwork} alt={item.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                   {activeAudio === item.url && isPlaying ? (
                                    <Pause className="h-6 w-6 md:h-8 md:w-8 text-white animate-pulse" />
                                  ) : (
                                    <Play className="h-6 w-6 md:h-8 md:w-8 text-white opacity-80" />
                                  )}
                                </div>
                              </div>
                            ) : (
                              activeAudio === item.url && isPlaying ? (
                                <Pause className="h-6 w-6 md:h-8 md:w-8 text-amber-600 animate-pulse" />
                              ) : (
                                <Play className="h-6 w-6 md:h-8 md:w-8 text-slate-300 group-hover:text-amber-500 opacity-60 group-hover:opacity-100" />
                              )
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm md:text-base font-bold text-slate-900 truncate tracking-tight">{item.name}</h5>
                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                                <Headphones className="h-3 w-3" /> par {item.artist}
                            </p>
                            <div className="mt-2 md:mt-3">
                              <Badge variant="secondary" className="text-[9px] font-black uppercase bg-slate-100 text-slate-500 border-none px-2 rounded-lg">
                                {item.category}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <Button 
                          variant="default" 
                          className="w-full mt-4 md:mt-6 h-10 md:h-12 rounded-xl md:rounded-2xl bg-slate-900 hover:bg-black text-white font-bold group"
                          onClick={() => {
                            let safeUrl = item.url;
                            if (safeUrl.startsWith('http:')) {
                              safeUrl = safeUrl.replace('http:', 'https:');
                            }
                            onChange(safeUrl);
                            setSelectedSoundName(item.name);
                            if (audioRef.current) audioRef.current.pause();
                            setIsPlaying(false);
                            setIsLibraryOpen(false);
                            toast({ 
                              title: "Ambiance capturée !", 
                              description: `"${item.name}" a été ajouté à votre instant.` 
                            });
                          }}
                        >
                          Capturer ce son
                          <Check className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
              )}
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
}

