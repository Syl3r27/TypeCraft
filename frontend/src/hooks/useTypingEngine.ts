'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import type { LetterState, WordState, TestResult, TimerMode } from '@/types';
import { calculateWPM, calculateAccuracy } from '@/lib/utils';

interface UseTypingEngineProps {
  words: string[];
  timerMode: TimerMode;
  onComplete?: (result: TestResult) => void;
}

export function useTypingEngine({ words, timerMode, onComplete }: UseTypingEngineProps) {
  const [wordStates, setWordStates] = useState<WordState[]>(() =>
    words.map((word, i) => ({
      word,
      letters: word.split('').map((char) => ({ char, state: 'pending' as LetterState })),
      typed: '',
      isActive: i === 0,
      isCompleted: false,
    }))
  );

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentInput, setCurrentInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(parseInt(timerMode));
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const correctCharsRef = useRef(0);
  const totalKeystrokesRef = useRef(0);
  const errorCountRef = useRef(0);
  const currentWordIndexRef = useRef(0);
  const isFinishedRef = useRef(false);
  const isRunningRef = useRef(false);
  // Keep latest onComplete in a ref so timer closure is never stale
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // Sync word index ref
  useEffect(() => { currentWordIndexRef.current = currentWordIndex; }, [currentWordIndex]);

  const finishTest = useCallback(() => {
    if (isFinishedRef.current) return; // prevent double-fire
    isFinishedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);

    const elapsed = Math.max((Date.now() - startTimeRef.current) / 1000, 0.1);
    const finalWpm = calculateWPM(correctCharsRef.current, elapsed);
    const finalAcc = calculateAccuracy(correctCharsRef.current, totalKeystrokesRef.current);

    setIsFinished(true);
    setIsRunning(false);
    isRunningRef.current = false;

    const result: TestResult = {
      wpm: finalWpm,
      accuracy: finalAcc,
      errors: errorCountRef.current,
      duration: Math.round(elapsed),
      wordCount: currentWordIndexRef.current,
      mode: timerMode,
      chars: {
        correct: correctCharsRef.current,
        incorrect: errorCountRef.current,
        extra: 0,
        missed: 0,
      },
    };

    // Use ref so we always call the latest callback
    onCompleteRef.current?.(result);
  }, [timerMode]);

  const startTimer = useCallback(() => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    setIsRunning(true);
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const newTime = parseInt(timerMode) - Math.floor(elapsed);

      // Update live stats
      setWpm(calculateWPM(correctCharsRef.current, elapsed));
      setAccuracy(calculateAccuracy(correctCharsRef.current, totalKeystrokesRef.current));
      setTimeLeft(newTime <= 0 ? 0 : newTime);

      if (newTime <= 0) {
        finishTest();
      }
    }, 100);
  }, [timerMode, finishTest]);

  const handleInput = useCallback(
    (value: string) => {
      if (isFinishedRef.current) return;

      // Start timer on first keystroke
      if (!isRunningRef.current && value.length > 0) {
        startTimer();
      }

      const lastChar = value[value.length - 1];

      // Space = advance to next word
      if (lastChar === ' ') {
        const currentWord = words[currentWordIndexRef.current];
        if (!currentWord) return;
        const typedWord = value.trimEnd(); // keep leading chars, remove trailing space

        // Score this word
        let wordCorrect = 0;
        for (let i = 0; i < Math.min(typedWord.length, currentWord.length); i++) {
          if (typedWord[i] === currentWord[i]) {
            wordCorrect++;
          } else {
            errorCountRef.current++;
          }
        }
        correctCharsRef.current += wordCorrect + 1; // +1 for the space
        totalKeystrokesRef.current += typedWord.length + 1;

        const nextIndex = currentWordIndexRef.current + 1;

        setWordStates((prev) => {
          const next = [...prev];
          next[currentWordIndexRef.current] = {
            ...next[currentWordIndexRef.current],
            typed: typedWord,
            isActive: false,
            isCompleted: true,
            letters: currentWord.split('').map((char, i) => ({
              char,
              state: (
                i < typedWord.length
                  ? typedWord[i] === char ? 'correct' : 'incorrect'
                  : 'incorrect'
              ) as LetterState,
            })),
          };
          if (next[nextIndex]) {
            next[nextIndex] = { ...next[nextIndex], isActive: true };
          }
          return next;
        });

        currentWordIndexRef.current = nextIndex;
        setCurrentWordIndex(nextIndex);
        setCurrentInput('');
        return;
      }

      setCurrentInput(value);

      // Real-time letter coloring for current word
      setWordStates((prev) => {
        const next = [...prev];
        const word = words[currentWordIndexRef.current];
        if (!word) return prev;

        const letters = word.split('').map((char, i) => ({
          char,
          state: (
            i < value.length
              ? value[i] === char ? 'correct' : 'incorrect'
              : 'pending'
          ) as LetterState,
        }));

        const extraLetters = value.length > word.length
          ? value.slice(word.length).split('').map((char) => ({
              char, state: 'extra' as LetterState,
            }))
          : [];

        next[currentWordIndexRef.current] = {
          ...next[currentWordIndexRef.current],
          typed: value,
          letters: [...letters, ...extraLetters],
        };
        return next;
      });
    },
    [words, startTimer]
  );

  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    correctCharsRef.current = 0;
    totalKeystrokesRef.current = 0;
    errorCountRef.current = 0;
    currentWordIndexRef.current = 0;
    isFinishedRef.current = false;
    isRunningRef.current = false;
    setCurrentWordIndex(0);
    setCurrentInput('');
    setTimeLeft(parseInt(timerMode));
    setIsRunning(false);
    setIsFinished(false);
    setWpm(0);
    setAccuracy(100);
    setWordStates(
      words.map((word, i) => ({
        word,
        letters: word.split('').map((char) => ({ char, state: 'pending' as LetterState })),
        typed: '',
        isActive: i === 0,
        isCompleted: false,
      }))
    );
  }, [words, timerMode]);

  const progress = Math.min(Math.round((currentWordIndex / words.length) * 100), 100);

  return {
    wordStates,
    currentWordIndex,
    currentInput,
    handleInput,
    timeLeft,
    isRunning,
    isFinished,
    wpm,
    accuracy,
    progress,
    reset,
    finishTest,
  };
}
