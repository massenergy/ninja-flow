"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

const PHASES = ['Breathe In', 'Hold', 'Breathe Out', 'Hold'];
const PHASE_DURATION_S = 4;
const PHASE_DURATION_MS = PHASE_DURATION_S * 1000;

export const useBreathingCycle = () => {
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
    const [countdown, setCountdown] = useState(PHASE_DURATION_S);
    const [totalTime, setTotalTime] = useState(0);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const sessionStartTimeRef = useRef<number | null>(null);
    const phaseStartTimeRef = useRef<number | null>(null);
    const accumulatedTimeRef = useRef(0);

    const speak = useCallback((text: string) => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.2;
            utterance.pitch = 1.1;
            window.speechSynthesis.speak(utterance);
        }
    }, []);

    const stopSession = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        setIsSessionActive(false);

        if (sessionStartTimeRef.current) {
            accumulatedTimeRef.current += Date.now() - sessionStartTimeRef.current;
        }

        sessionStartTimeRef.current = null;
        phaseStartTimeRef.current = null;

        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        
        // Reset countdown to initial state for next start
        setCountdown(PHASE_DURATION_S);
    }, []);

    const startSession = useCallback(() => {
        const now = Date.now();
        setIsSessionActive(true);
        sessionStartTimeRef.current = now;
        phaseStartTimeRef.current = now;
        
        setCurrentPhaseIndex(0);
        setCountdown(PHASE_DURATION_S);
        speak(PHASES[0]);

        timerRef.current = setInterval(() => {
            const currentTime = Date.now();
            if (!phaseStartTimeRef.current || !sessionStartTimeRef.current) return;
            
            const phaseElapsedTime = currentTime - phaseStartTimeRef.current;
            const sessionElapsedTime = accumulatedTimeRef.current + (currentTime - sessionStartTimeRef.current);

            setTotalTime(sessionElapsedTime);

            const secondsIntoPhase = Math.floor(phaseElapsedTime / 1000);
            const newCountdown = PHASE_DURATION_S - secondsIntoPhase;
            setCountdown(Math.max(0, newCountdown));

            if (phaseElapsedTime >= PHASE_DURATION_MS) {
                phaseStartTimeRef.current = phaseStartTimeRef.current + PHASE_DURATION_MS;
                setCurrentPhaseIndex(prevIndex => {
                    const newIndex = (prevIndex + 1) % PHASES.length;
                    speak(PHASES[newIndex]);
                    return newIndex;
                });
            }
        }, 100);
    }, [speak]);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const toggleSession = () => {
        if (isSessionActive) {
            stopSession();
        } else {
            startSession();
        }
    };
    
    return {
        isSessionActive,
        toggleSession,
        currentPhase: PHASES[currentPhaseIndex],
        currentPhaseIndex,
        countdown,
        totalTime,
    };
};
