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
    words.map((word) => ({
      word,
      letters: word.split('').map((char) => ({ char, state: 'pending' as LetterState })),
      typed: '',
      isActive: false,
      isCompleted: false,
    }))
  );

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentInput, setCurrentInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(parseInt(timerMode));
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Stats
  const [correctChars, setCorrectChars] = useState(0);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const correctCharsRef = useRef(0);
  const totalKeystrokesRef = useRef(0);
  const errorCountRef = useRef(0);

  // Initialize first word as active
  useEffect(() => {
    setWordStates((prev) => {
      const next = [...prev];
      if (next[0]) next[0] = { ...next[0], isActive: true };
      return next;
    });
  }, []);

  const startTimer = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const newTime = parseInt(timerMode) - Math.floor(elapsed);

        // Update live WPM
        const liveWpm = calculateWPM(correctCharsRef.current, elapsed);
        const liveAcc = calculateAccuracy(
          correctCharsRef.current,
          totalKeystrokesRef.current
        );
        setWpm(liveWpm);
        setAccuracy(liveAcc);

        if (newTime <= 0) {
          clearInterval(timerRef.current!);
          finishTest();
          return 0;
        }
        return newTime;
      });
    }, 100);
  }, [isRunning, timerMode]);

  const finishTest = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsFinished(true);
    setIsRunning(false);

    const elapsed = (Date.now() - startTimeRef.current) / 1000 || 1;
    const finalWpm = calculateWPM(correctCharsRef.current, elapsed);
    const finalAcc = calculateAccuracy(
      correctCharsRef.current,
      totalKeystrokesRef.current
    );

    const result: TestResult = {
      wpm: finalWpm,
      accuracy: finalAcc,
      errors: errorCountRef.current,
      duration: Math.round(elapsed),
      wordCount: currentWordIndex,
      mode: timerMode,
      chars: {
        correct: correctCharsRef.current,
        incorrect: errorCountRef.current,
        extra: 0,
        missed: 0,
      },
    };

    onComplete?.(result);
  }, [currentWordIndex, timerMode, onComplete]);

  const handleInput = useCallback(
    (value: string) => {
      if (isFinished) return;

      // Start timer on first keystroke
      if (!isRunning && value.length > 0) {
        startTimer();
      }

      const lastChar = value[value.length - 1];

      // Space = move to next word
      if (lastChar === ' ') {
        const currentWord = words[currentWordIndex];
        const typedWord = value.trim();

        // Count correct chars in this word
        let wordCorrect = 0;
        for (let i = 0; i < Math.min(typedWord.length, currentWord.length); i++) {
          if (typedWord[i] === currentWord[i]) {
            wordCorrect++;
          } else {
            errorCountRef.current++;
          }
        }
        correctCharsRef.current += wordCorrect + 1; // +1 for space
        totalKeystrokesRef.current += typedWord.length + 1;

        // Mark word as completed
        setWordStates((prev) => {
          const next = [...prev];
          const word = words[currentWordIndex];
          next[currentWordIndex] = {
            ...next[currentWordIndex],
            typed: typedWord,
            isActive: false,
            isCompleted: true,
            letters: word.split('').map((char, i) => ({
              char,
              state:
                i < typedWord.length
                  ? typedWord[i] === char
                    ? 'correct'
                    : 'incorrect'
                  : 'incorrect',
            })),
          };
          // Activate next word
          if (next[currentWordIndex + 1]) {
            next[currentWordIndex + 1] = {
              ...next[currentWordIndex + 1],
              isActive: true,
            };
          }
          return next;
        });

        setCurrentWordIndex((prev) => prev + 1);
        setCurrentInput('');
        return;
      }

      // Backspace handling is automatic via controlled input
      setCurrentInput(value);

      // Update letter states for current word in real-time
      setWordStates((prev) => {
        const next = [...prev];
        const word = words[currentWordIndex];
        if (!word) return prev;

        const letters = word.split('').map((char, i) => ({
          char,
          state: (
            i < value.length
              ? value[i] === char
                ? 'correct'
                : 'incorrect'
              : 'pending'
          ) as LetterState,
        }));

        // Add extra characters
        const extraLetters =
          value.length > word.length
            ? value
                .slice(word.length)
                .split('')
                .map((char) => ({ char, state: 'extra' as LetterState }))
            : [];

        next[currentWordIndex] = {
          ...next[currentWordIndex],
          typed: value,
          letters: [...letters, ...extraLetters],
        };
        return next;
      });

      // Track keystrokes
      if (value.length > currentInput.length) {
        totalKeystrokesRef.current++;
        const currentWord = words[currentWordIndex];
        const pos = value.length - 1;
        if (pos < currentWord.length && value[pos] === currentWord[pos]) {
          // correct (don't add yet, wait for word completion)
        } else if (pos >= currentWord.length || value[pos] !== currentWord[pos]) {
          errorCountRef.current++;
        }
      }
    },
    [isFinished, isRunning, currentWordIndex, words, currentInput, startTimer]
  );

  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    correctCharsRef.current = 0;
    totalKeystrokesRef.current = 0;
    errorCountRef.current = 0;
    setCurrentWordIndex(0);
    setCurrentInput('');
    setTimeLeft(parseInt(timerMode));
    setIsRunning(false);
    setIsFinished(false);
    setWpm(0);
    setAccuracy(100);
    setCorrectChars(0);
    setTotalKeystrokes(0);
    setErrorCount(0);
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

  // Progress percentage for multiplayer
  const progress = Math.min(
    Math.round((currentWordIndex / words.length) * 100),
    100
  );

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
