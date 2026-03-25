"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Pause, Trash2, Library, Music, Info, Check, CloudUpload, Loader2, Search, X, Volume2, Wind, TreePine, Coffee, Ghost, Headphones, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
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
  const [activeCategory, setActiveCategory] = useState<string | null>("popular");
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Load popular sounds initially
  useEffect(() => {
    const loadPopular = async () => {
        setIsSearching(true);
        console.log("Loading popular sounds...");
        const popular = await getPopularHearthis();
        setRemoteSounds(popular);
        setIsSearching(false);
        console.log("Popular sounds loaded:", popular.length);
    };
    loadPopular();
  }, []);


  // Search is now manual via triggers only to avoid race conditions with categories
  const handleManualSearch = async () => {
    if (!searchTerm.trim()) return;
    toast({ title: "Recherche en cours...", description: `Exploration de Studio Sonore pour "${searchTerm}"` });
    setIsSearching(true);
    setRemoteSounds([]);
    setActiveCategory(null);
    try {
      const [hearthisRes, itunesRes] = await Promise.all([
        searchHearthis(searchTerm),
        searchITunes(searchTerm)
      ]);
      const combined = [...itunesRes.slice(0, 5), ...hearthisRes.slice(0, 5)];
      setRemoteSounds(combined);
      if (combined.length === 0) {
        toast({ variant: "destructive", title: "Aucun résultat", description: "Essayez d'autres mots clés comme 'piano', 'mer' ou 'vent'." });
      }
    } catch (err) {
      console.error("Search failed:", err);
      toast({ variant: "destructive", title: "Erreur de connexion", description: "Impossible de joindre Studio Sonore." });
    } finally {
      setIsSearching(false);
    }
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

  // Focus is now handled natively via onOpenAutoFocus in the DialogContent

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
        <>
          <div className="grid grid-cols-2 gap-4">
            {/* Recording Button */}
            <Button
              type="button"
              variant="ghost"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isUploading}
              className={cn(
                "h-20 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all relative overflow-hidden group border border-slate-200",
                isRecording 
                  ? "bg-red-50 border-red-200 text-red-600 shadow-inner" 
                  : "bg-white hover:bg-slate-50 text-slate-500 hover:text-red-500 hover:border-red-200"
              )}
            >
              {isUploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
              ) : isRecording ? (
                <>
                  <div className="h-6 w-6 rounded-full bg-red-500 animate-pulse flex items-center justify-center">
                    <Square className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tighter">{formatTime(recordingTime)}</span>
                </>
              ) : (
                <>
                  <Mic className="h-6 w-6 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-tighter">Enregistrer</span>
                </>
              )}
            </Button>

            {/* Library Button */}
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsLibraryOpen(true)}
              className="h-20 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md shadow-amber-200/50 group"
            >
              <Library className="h-6 w-6 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-tighter">Bibliothèque</span>
            </Button>
          </div>

          {/* Studio Sonore Library Modal — Standard Radix Dialog to fix nesting bugs */}
          <Dialog open={isLibraryOpen} onOpenChange={setIsLibraryOpen}>
            <DialogContent 
              className="w-[95vw] sm:max-w-4xl h-[85vh] sm:h-[90vh] p-0 flex flex-col overflow-hidden bg-white border-none shadow-2xl rounded-3xl z-[9999] [&>button]:hidden"
              onOpenAutoFocus={(e) => {
                e.preventDefault();
                // Delay slightly just for mobile browsers to catch up with animations
                setTimeout(() => searchInputRef.current?.focus(), 150);
              }}
            >
              <DialogTitle className="sr-only">Studio Sonore</DialogTitle>
              <DialogDescription className="sr-only">Bibliothèque d'ambiances sonores</DialogDescription>
              
              {/* Header */}
              <div className="p-5 md:p-8 bg-slate-900 text-white flex-shrink-0 relative z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-black uppercase tracking-tight flex items-center gap-3">
                    <Volume2 className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-amber-400" />
                    Studio Sonore
                  </h2>
                  <button 
                    type="button"
                    className="text-white/60 hover:text-white hover:bg-white/10 rounded-full h-10 w-10 flex items-center justify-center transition-colors"
                    onClick={() => setIsLibraryOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-slate-400 text-xs font-medium mt-1">Ambiances pour vos souvenirs.</p>

                {/* Search */}
                <div className="mt-5 md:mt-6 flex gap-3 relative z-[10000] pointer-events-auto">
                  <div className="relative flex-1 pointer-events-auto">
                    <Input 
                      ref={searchInputRef}
                      type="text"
                      id="studio-sonore-search"
                      placeholder="Rechercher (ex: Piano, Mer...)"
                      value={searchTerm}
                      autoComplete="off"
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.stopPropagation();
                          handleManualSearch();
                        }
                      }}
                      className="w-full h-12 md:h-14 bg-white border-2 border-slate-300 text-black placeholder:text-slate-400 pl-12 md:pl-14 pr-12 text-base md:text-lg rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-amber-400/20 focus-visible:border-amber-400 transition-all shadow-md relative z-[10001] cursor-text pointer-events-auto"
                    />
                    <Search className="h-5 w-5 md:h-6 md:w-6 absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-[10002]" />
                    {searchTerm && (
                      <button 
                        type="button"
                        onClick={(e) => { 
                          e.stopPropagation();
                          setSearchTerm(""); 
                          searchInputRef.current?.focus(); 
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 z-[10002] pointer-events-auto"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Button 
                    type="button"
                    disabled={isSearching}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleManualSearch();
                    }}
                    className="h-12 md:h-14 px-6 md:px-8 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-2xl shadow-lg transition-all flex-shrink-0 disabled:opacity-50"
                  >
                    {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : "Chercher"}
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-0">
                {/* Categories */}
                <div className="md:w-56 bg-slate-50 md:bg-white border-b md:border-b-0 md:border-r flex-shrink-0 overflow-x-auto touch-pan-x">
                  <div className="p-3 md:p-6 space-y-1 md:space-y-2 flex md:flex-col gap-2 md:overflow-x-visible pb-2 md:pb-0">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-3 mb-4 hidden md:block">Inspirations</p>
                    <Button 
                      type="button"
                      variant={activeCategory === 'popular' ? 'secondary' : 'ghost'} 
                      className={cn("flex-shrink-0 md:w-full justify-start gap-2 md:gap-3 text-sm font-bold rounded-xl h-9 md:h-12 transition-colors", activeCategory === 'popular' && "bg-slate-200 md:bg-slate-100")}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isSearching) return;
                        setActiveCategory('popular');
                        setRemoteSounds([]);
                        setIsSearching(true);
                        getPopularHearthis().then(res => {
                          setRemoteSounds(res);
                          setIsSearching(false);
                        }).catch(() => setIsSearching(false));
                      }}
                    >
                      <Volume2 className="h-4 w-4 md:h-5 md:w-5" /> Populaires
                    </Button>
                    {CATEGORIES.map((cat) => (
                      <Button 
                        key={cat.id}
                        type="button"
                        variant={activeCategory === cat.id ? 'secondary' : 'ghost'} 
                        className={cn("flex-shrink-0 md:w-full justify-start gap-2 md:gap-3 text-sm font-bold rounded-xl h-9 md:h-12 transition-colors", activeCategory === cat.id && "bg-slate-200 md:bg-slate-100")}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isSearching) return;
                          setActiveCategory(cat.id);
                          setRemoteSounds([]);
                          setIsSearching(true);
                          const searchPromise = cat.id === 'music' ? searchITunes(cat.query) : searchHearthis(cat.query);
                          searchPromise.then(res => {
                            setRemoteSounds(res);
                            setIsSearching(false);
                          }).catch(() => setIsSearching(false));
                        }}
                      >
                        {cat.icon} {cat.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Results */}
                <div 
                  className="flex-1 overflow-y-auto bg-slate-50 touch-pan-y"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  <div className="p-4 md:p-8">
                    {isSearching ? (
                      <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
                        <p className="text-sm text-slate-400 font-medium animate-pulse">Exploration en cours...</p>
                      </div>
                    ) : remoteSounds.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="bg-slate-100 p-8 rounded-full mb-6 text-slate-200">
                          <Search className="h-12 w-12" />
                        </div>
                        <p className="text-slate-500 max-w-xs mx-auto text-sm font-medium italic">Le silence est d&apos;or, mais essayez une autre recherche.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4 max-w-3xl mx-auto pb-12">
                        {remoteSounds.map((item: any) => (
                          <div key={item.id} className="overflow-hidden shadow-sm hover:shadow-md transition-all rounded-2xl bg-white ring-1 ring-slate-200/50">
                            <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                              <div className="flex items-center gap-3 w-full sm:w-auto sm:flex-1 min-w-0">
                                <button
                                  type="button"
                                  className="h-11 w-11 sm:h-14 sm:w-14 rounded-2xl flex-shrink-0 bg-slate-100 hover:bg-amber-100 hover:text-amber-600 transition-colors flex items-center justify-center"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    togglePreview(item.url);
                                  }}
                                >
                                  {activeAudio === item.url && isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                                </button>
                                
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-slate-900 truncate text-sm sm:text-base tracking-tight">{item.name}</h4>
                                  <p className="text-[10px] text-slate-400 mt-0.5 truncate uppercase font-bold tracking-tight">{item.artist}</p>
                                  <span className="inline-block mt-1 text-[9px] font-black uppercase bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg">{item.category}</span>
                                </div>
                              </div>

                              <button 
                                type="button"
                                className="h-10 rounded-xl bg-slate-900 hover:bg-black text-white font-bold px-5 w-full sm:w-auto text-sm transition-colors flex-shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  let safeUrl = item.url;
                                  if (safeUrl.startsWith('http:')) {
                                    safeUrl = safeUrl.replace('http:', 'https:');
                                  }
                                  onChange(safeUrl);
                                  setSelectedSoundName(item.name);
                                  if (audioRef.current) audioRef.current.pause();
                                  setIsPlaying(false);
                                  setIsLibraryOpen(false);
                                  toast({ title: "Ambiance capturée !", description: `"${item.name}" ajouté.` });
                                }}
                              >
                                Capturer
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
