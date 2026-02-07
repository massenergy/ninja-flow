"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, BarChart3, Circle } from 'lucide-react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"


export default function StatsPage() {
  const [settings, setSettings] = useState({
    phaseDuration: 4,
    goalDuration: 10,
    soundscape: 'Zen Garden',
  });
  const [sessionHistory, setSessionHistory] = useState<{ timestamp: number; duration: number }[]>([]);
  const [goalInMinutes, setGoalInMinutes] = useState(10);

  useEffect(() => {
    try {
      const storedHistory = window.localStorage.getItem('ninjaFlowHistory');
      if (storedHistory) {
        const parsed = JSON.parse(storedHistory);
        // Handle legacy format (array of numbers) or new format (array of objects)
        if (Array.isArray(parsed)) {
          if (parsed.length > 0 && typeof parsed[0] === 'number') {
            // Convert legacy data to objects (using current time as placeholder is imperfect but functional for migration)
            // Better to just clear it or treat as 'past' sessions. Let's treat as simple history without specific dates for today's goal.
            setSessionHistory(parsed.map((d: number) => ({ timestamp: 0, duration: d })));
          } else {
            setSessionHistory(parsed);
          }
        }
      }
      const storedSettings = window.localStorage.getItem('ninjaFlowSettings');
      if (storedSettings) {
        const loadedSettings = JSON.parse(storedSettings);
        if (loadedSettings.goalDuration) {
          setGoalInMinutes(loadedSettings.goalDuration);
        }
      }
    } catch (e) { console.error("Could not load data", e); }
  }, []);

  const formatDuration = (ms: number) => {
    if (typeof ms !== 'number' || isNaN(ms)) ms = 0;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  const currentDuration = sessionHistory.length > 0 ? sessionHistory[sessionHistory.length - 1].duration : 0;
  // Calculate highest duration from history objects
  const highestDuration = useMemo(() => {
    if (sessionHistory.length === 0) return 0;
    return Math.max(0, ...sessionHistory.map(s => s.duration));
  }, [sessionHistory]);

  const minutesForGoal = Math.floor(currentDuration / 60000);

  const progressDots = useMemo(() => {
    const totalDots = Math.max(1, goalInMinutes || 0);
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
    return lastFive.map((session, index) => ({
      session: `${sessionHistory.length - lastFive.length + index + 1}`,
      duration: parseFloat((session.duration / 60000).toFixed(2)), // duration in minutes
    }));
  }, [sessionHistory]);

  const chartConfig = {
    duration: {
      label: "Duration (min)",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;


  return (
    <div className="flex flex-col min-h-screen text-slate-800 dark:text-slate-200">
      <main className="flex-1 flex flex-col items-center p-4 gap-8 pt-12">
        <div className="w-full max-w-2xl">
          <h1 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">My Stats</h1>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Session History</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Last Session</p>
                  <p className="text-lg font-bold">{formatDuration(currentDuration)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Highest</p>
                  <p className="text-lg font-bold">{formatDuration(highestDuration)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Session Goal</p>
                  <div className="flex justify-center gap-1.5 mt-2 flex-wrap">{progressDots}</div>
                </div>
              </div>

              <div className="h-48">
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
        </div>
      </main>
      <footer className="sticky bottom-0 left-0 right-0 w-full p-2">
        <nav className="glass-card max-w-sm mx-auto flex justify-around items-center rounded-full p-1 shadow-md">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Home className="w-5 h-5 text-muted-foreground" />
            </Button>
          </Link>
          <Link href="/stats">
            <Button variant="ghost" size="icon" className="rounded-full bg-accent/80 text-accent-foreground shadow">
              <BarChart3 className="w-5 h-5" />
            </Button>
          </Link>
        </nav>
      </footer>
    </div>
  );
}
