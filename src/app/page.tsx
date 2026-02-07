"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
import { useBreathingCycle } from '@/hooks/use-breathing-cycle';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, Home, BarChart3, Compass, MoreHorizontal, Target, Music, Settings, Circle } from 'lucide-react';
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
import { LineChart, Line, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"


const soundscapes = [
  { id: 'zen-garden', name: 'Zen Garden', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 'ocean-waves', name: 'Ocean Waves', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 'forest-rain', name: 'Forest Rain', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
];


export default function NinjaFlowPage() {
  const [settings, setSettings] = useState({
    phaseDuration: 4,
    goalDuration: 10,
    soundscape: 'Zen Garden',
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<number[]>([]);

  useEffect(() => {
    try {
        const storedHistory = window.localStorage.getItem('ninjaFlowHistory');
        if (storedHistory) {
            setSessionHistory(JSON.parse(storedHistory));
        }
    } catch (e) { console.error("Could not load session history", e); }
  }, []);

  const {
    isSessionActive,
    toggleSession,
    currentPhase,
    currentPhaseIndex,
    countdown,
    totalTime,
  } = useBreathingCycle({ phaseDurationInSeconds: settings.phaseDuration });

  const prevIsSessionActive = useRef(isSessionActive);

  useEffect(() => {
    if (prevIsSessionActive.current && !isSessionActive && totalTime > 1000) { // Session ended, save if > 1s
        const newHistory = [...sessionHistory, totalTime];
        setSessionHistory(newHistory);
        try {
            window.localStorage.setItem('ninjaFlowHistory', JSON.stringify(newHistory));
        } catch (e) { console.error("Could not save session history", e); }
    }
    prevIsSessionActive.current = isSessionActive;
  }, [isSessionActive, totalTime, sessionHistory]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentSound, setCurrentSound] = useState(() => soundscapes.find(s => s.name === settings.soundscape) || soundscapes[0]);

  useEffect(() => {
    if (audioRef.current) {
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
  }, [isSessionActive, currentSound.url]);
  
  const currentDuration = isSessionActive ? totalTime : (sessionHistory.length > 0 ? sessionHistory[sessionHistory.length - 1] : 0);
  const highestDuration = useMemo(() => Math.max(0, ...sessionHistory), [sessionHistory]);

  const formatDuration = (ms: number) => {
    if (typeof ms !== 'number' || isNaN(ms)) ms = 0;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  const minutesForGoal = Math.floor(currentDuration / 60000);
  const goalInMinutes = settings.goalDuration;

  const progressDots = useMemo(() => {
    const totalDots = Math.max(1, goalInMinutes);
    const activeDots = Math.min(minutesForGoal, totalDots);
    return Array.from({ length: totalDots }).map((_, i) => (
      <Circle
        key={i}
        className={cn(
          'w-2 h-2 transition-colors',
          i < activeDots ? 'fill-accent text-accent' : 'fill-gray-300 text-gray-300'
        )}
      />
    ));
  }, [minutesForGoal, goalInMinutes]);

  const chartData = useMemo(() => {
    const lastFive = sessionHistory.slice(-5);
    if (lastFive.length === 0) {
      return [{ session: "1", duration: 0 }];
    }
    return lastFive.map((duration, index) => ({
      session: `${sessionHistory.length - lastFive.length + index + 1}`,
      duration: parseFloat((duration / 60000).toFixed(2)), // duration in minutes
    }));
  }, [sessionHistory]);

  const chartConfig = {
    duration: {
      label: "Duration (min)",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;


  const scale = useMemo(() => {
    if (!isSessionActive) return 1;
    // In: 0 -> 1, Hold: 1, Out: 1 -> 0, Hold: 0
    if (currentPhase === 'Breathe In' || (currentPhase === 'Hold' && currentPhaseIndex === 1)) {
      return 1.15;
    }
    return 1;
  }, [isSessionActive, currentPhase, currentPhaseIndex]);

  return (
    <div className="flex flex-col min-h-screen text-slate-800 dark:text-slate-200">
      <audio ref={audioRef} />
      <div className="w-full bg-primary/10 p-2 text-center text-sm text-primary-foreground flex items-center justify-center gap-2">
        <Info className="w-4 h-4 text-primary" />
        <span className="text-primary font-medium">Tip: Say 'Open Ninja Flow' to start</span>
      </div>
      <main className="flex-1 flex flex-col items-center justify-center p-4 gap-8">
        <div
          style={{ transform: `scale(${scale})`, transitionDuration: `${settings.phaseDuration}s` }}
          className="relative flex items-center justify-center w-64 h-64 sm:w-80 sm:h-80 transition-transform ease-in-out"
        >
          <Button
            onClick={toggleSession}
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl">
          <Card className="glass-card col-span-2 md:col-span-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Stats</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Current</p>
                  <p className="text-lg font-bold">{formatDuration(currentDuration)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Highest</p>
                  <p className="text-lg font-bold">{formatDuration(highestDuration)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Daily Goal</p>
                  <div className="flex justify-center gap-1.5 mt-2 flex-wrap">{progressDots}</div>
                </div>
              </div>

              <div className="h-24">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 20, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="2 2" strokeOpacity={0.5} />
                    <XAxis dataKey="session" tickLine={false} axisLine={false} tickMargin={8} fontSize={10} interval="preserveStartEnd" />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      fontSize={10}
                      domain={['auto', 'auto']}
                      allowDecimals={false}
                    />
                    <ChartTooltip
                      cursor={{ strokeDasharray: '3 3', strokeOpacity: 0.5 }}
                      content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Line
                      dataKey="duration"
                      type="monotone"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{
                        r: 4,
                        fill: "hsl(var(--primary))",
                        stroke: "hsl(var(--background))",
                        strokeWidth: 2
                      }}
                      activeDot={{
                        r: 6,
                        fill: "hsl(var(--primary))",
                        stroke: "hsl(var(--background))",
                        strokeWidth: 2,
                      }}
                    />
                  </LineChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
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
              <p className="text-xs text-muted-foreground">Soundscape</p>
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
          <Button variant="ghost" size="icon" className="rounded-full bg-accent/80 text-accent-foreground shadow">
            <Home className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Compass className="w-5 h-5 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
          </Button>
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
                            onValueChange={([val]) => setSettings(s => ({...s, phaseDuration: val}))}
                            min={2} max={10} step={1}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Daily Goal: {settings.goalDuration} minutes</Label>
                        <Slider
                            value={[settings.goalDuration]}
                            onValueChange={([val]) => setSettings(s => ({...s, goalDuration: val}))}
                            min={1} max={60} step={1}
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
                </div>
            </SheetContent>
        </Sheet>
    </div>
  );
}
