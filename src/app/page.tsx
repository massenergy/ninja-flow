"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useBreathingCycle } from '@/hooks/use-breathing-cycle';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, Home, BarChart3, Target, Music, Settings, Circle } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

const soundscapes = [
  { id: 'zen-garden', name: 'Zen Garden', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 'ocean-waves', name: 'Ocean Waves', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 'forest-rain', name: 'Forest Rain', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
];


export default function NinjaFlowPage() {
  const [settings, setSettings] = useState({
    phaseDuration: 4,
    goalDuration: 5,
    soundscape: 'Zen Garden',
    volume: 0.35,
    theme: 'light',
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [lastSessionDuration, setLastSessionDuration] = useState(0);

  useEffect(() => {
    try {
      const storedSettings = window.localStorage.getItem('ninjaFlowSettings');
      if (storedSettings) {
        const loadedSettings = JSON.parse(storedSettings);
        setSettings(prevSettings => ({
          ...prevSettings,
          ...loadedSettings,
          volume: loadedSettings.volume ?? 0.35,
          theme: loadedSettings.theme ?? 'light'
        }));
      }
    } catch (e) { console.error("Could not load settings", e); }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('ninjaFlowSettings', JSON.stringify(settings));
    } catch (e) { console.error("Could not save settings", e); }
  }, [settings]);

  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  const {
    isSessionActive,
    toggleSession,
    currentPhase,
    currentPhaseIndex,
    countdown,
    totalTime,
  } = useBreathingCycle({ phaseDurationInSeconds: settings.phaseDuration });

  const previousSessionActiveRef = useRef(isSessionActive);
  useEffect(() => {
    if (previousSessionActiveRef.current && !isSessionActive && totalTime > 0) {
      setLastSessionDuration(totalTime);
      try {
        const storedHistory = window.localStorage.getItem('ninjaFlowHistory');
        let history = [];
        if (storedHistory) {
          history = JSON.parse(storedHistory);
        }
        history.push({ timestamp: Date.now(), duration: totalTime });
        window.localStorage.setItem('ninjaFlowHistory', JSON.stringify(history));
        console.log("Session saved:", { timestamp: Date.now(), duration: totalTime });
      } catch (e) { console.error("Could not save history", e); }
    }
    previousSessionActiveRef.current = isSessionActive;
  }, [isSessionActive, totalTime]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentSound, setCurrentSound] = useState(() => soundscapes.find(s => s.name === settings.soundscape) || soundscapes[0]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = settings.volume;
      if (audioRef.current.src !== currentSound.url) {
        audioRef.current.src = currentSound.url;
        audioRef.current.loop = true;
      }
      if (isSessionActive) {
        audioRef.current.play().catch(e => console.error("Audio play failed", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isSessionActive, currentSound.url, settings.volume]);

  // Helper to format duration showing MM:SS
  const formatTimer = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleToggleSession = () => {
    if (!isSessionActive && audioRef.current) {
      // Explicitly trigger play on user interaction to handle mobile autoplay restrictions
      audioRef.current.play().catch(e => console.error("Manual audio play failed", e));
    }
    toggleSession();
  };

  const goalInMinutes = settings.goalDuration;

  const scale = useMemo(() => {
    if (!isSessionActive) return 1;
    if (currentPhase === 'Breathe In' || (currentPhase === 'Hold' && currentPhaseIndex === 1)) {
      return 1.15;
    }
    return 1;
  }, [isSessionActive, currentPhase, currentPhaseIndex]);

  return (
    <div className="flex flex-col min-h-screen text-slate-800 dark:text-slate-200">
      <audio ref={audioRef} playsInline />
      <div className="w-full bg-primary/10 p-2 text-center text-sm text-primary-foreground flex items-center justify-center gap-2">
        <Info className="w-4 h-4 text-primary" />
        <span className="text-primary font-medium">Practice regularly to increase cycle from 4s to 10s</span>
      </div>
      <main className="flex-1 flex flex-col items-center justify-center p-4 gap-8">
        <div className="text-center h-8 mb-2">
          {isSessionActive && (
            <span className="text-2xl font-mono font-medium text-slate-600 dark:text-slate-300">
              {formatTimer(totalTime)}
            </span>
          )}
          {!isSessionActive && lastSessionDuration > 0 && (
            <span className="text-lg text-muted-foreground">
              Last Session: {formatTimer(lastSessionDuration)}
            </span>
          )}
        </div>
        <div
          style={{ transform: `scale(${scale})`, transitionDuration: `${settings.phaseDuration}s` }}
          className="relative flex items-center justify-center w-64 h-64 sm:w-80 sm:h-80 transition-transform ease-in-out"
        >
          <Button
            onClick={handleToggleSession}
            className={cn(
              'relative w-full h-full rounded-full shadow-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-primary transition-all duration-300',
              isSessionActive ? 'bg-opacity-80' : 'bg-opacity-100',
            )}
            aria-label={isSessionActive ? "Stop Session" : "Start Session"}
          >
            <div className="absolute inset-0 rounded-full bg-accent/20" style={{ transform: `scale(${isSessionActive ? 1 : 0})`, transition: 'transform 0.5s ease-out' }}></div>

            <div className="relative z-10 flex flex-col items-center justify-center text-center">
              <span className="text-muted-foreground text-lg uppercase tracking-widest">{isSessionActive ? currentPhase : 'Ready?'}</span>
              <span className="font-bold text-8xl sm:text-9xl text-slate-900 dark:text-white my-2">{isSessionActive ? countdown : 'GO'}</span>
              <span className="text-lg font-medium text-accent">{isSessionActive ? 'Stop Session' : 'Start Session'}</span>
            </div>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
          <Card className="glass-card cursor-pointer" onClick={() => setIsSettingsOpen(true)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Goal</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{goalInMinutes}m</div>
              <p className="text-xs text-muted-foreground">daily goal</p>
            </CardContent>
          </Card>
          <Card className="glass-card cursor-pointer" onClick={() => setIsSettingsOpen(true)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Audio</CardTitle>
              <Music className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate">{settings.soundscape}</div>
              <p className="text-xs text-muted-foreground">{Math.round(settings.volume * 100)}% Vol · Soundscape</p>
            </CardContent>
          </Card>
          <Card className="glass-card cursor-pointer" onClick={() => setIsSettingsOpen(true)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Config</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Customize</div>
              <p className="text-xs text-muted-foreground">{settings.phaseDuration}s cycle</p>
            </CardContent>
          </Card>
        </div>
      </main>
      <footer className="sticky bottom-0 left-0 right-0 w-full p-2">
        <nav className="glass-card max-w-sm mx-auto flex justify-around items-center rounded-full p-1 shadow-md">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full bg-accent/80 text-accent-foreground shadow">
              <Home className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/stats">
            <Button variant="ghost" size="icon" className="rounded-full">
              <BarChart3 className="w-5 h-5 text-muted-foreground" />
            </Button>
          </Link>
        </nav>
      </footer>
      <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <SheetContent className="glass-card border-none">
          <SheetHeader>
            <SheetTitle>Customize Your Flow</SheetTitle>
            <SheetDescription>
              Adjust your breathing session to your liking.
            </SheetDescription>
          </SheetHeader>
          <div className="py-4 space-y-8">
            <div className="space-y-2">
              <Label>Cycle Duration: {settings.phaseDuration} seconds</Label>
              <Slider
                value={[settings.phaseDuration]}
                onValueChange={([val]) => setSettings(s => ({ ...s, phaseDuration: val }))}
                min={2} max={10} step={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Daily Goal: {settings.goalDuration} minutes</Label>
              <Slider
                value={[settings.goalDuration]}
                onValueChange={([val]) => setSettings(s => ({ ...s, goalDuration: val }))}
                min={1} max={60} step={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Volume: {Math.round(settings.volume * 100)}%</Label>
              <Slider
                value={[settings.volume * 100]}
                onValueChange={([val]) => setSettings(s => ({ ...s, volume: val / 100 }))}
                min={0} max={100} step={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Soundscape</Label>
              <RadioGroup
                value={settings.soundscape}
                onValueChange={(val) => {
                  const newSound = soundscapes.find(s => s.name === val);
                  if (newSound) {
                    setSettings(s => ({ ...s, soundscape: newSound.name }));
                    setCurrentSound(newSound);
                  }
                }}
                className="gap-2"
              >
                {soundscapes.map(sound => (
                  <div key={sound.id} className="flex items-center space-x-3">
                    <RadioGroupItem value={sound.name} id={sound.id} />
                    <Label htmlFor={sound.id} className="font-normal cursor-pointer">{sound.name}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>Theme</Label>
              <RadioGroup
                value={settings.theme}
                onValueChange={(val) => setSettings(s => ({ ...s, theme: val }))}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="theme-light" />
                  <Label htmlFor="theme-light">Light</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="theme-dark" />
                  <Label htmlFor="theme-dark">Dark</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
