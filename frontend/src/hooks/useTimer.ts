'use client';
import { useState, useRef, useCallback } from 'react';

export function useTimer(initialSeconds: number) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const start = useCallback(() => {
    if (isActive) return;
    setIsActive(true);
    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = initialSeconds - elapsed;
      if (remaining <= 0) {
        setTimeLeft(0);
        clearInterval(intervalRef.current!);
        setIsActive(false);
      } else {
        setTimeLeft(remaining);
      }
    }, 100);
  }, [isActive, initialSeconds]);

  const pause = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsActive(false);
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimeLeft(initialSeconds);
    setIsActive(false);
  }, [initialSeconds]);

  const elapsed = initialSeconds - timeLeft;

  return { timeLeft, isActive, elapsed, start, pause, reset };
}
