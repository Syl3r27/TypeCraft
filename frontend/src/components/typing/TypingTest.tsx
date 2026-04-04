'use client';
import { useRef, useEffect, useCallback, useState } from 'react';
import { RefreshCw, Settings } from 'lucide-react';
import { useTypingEngine } from '@/hooks/useTypingEngine';
import { useAuth } from '@/hooks/useAuth';
import { useStore } from '@/store/useStore';
import { WordDisplay } from './WordDisplay';
import { StatsPanel } from './StatsPanel';
import { TimerBar } from './TimerBar';
import { ResultsScreen } from './ResultsScreen';
import { generateWords } from '@/lib/words';
import type { TimerMode, TestResult } from '@/types';
import { cn } from '@/lib/utils';

const TIMER_MODES: TimerMode[] = ['15', '30', '60', '120'];

interface TypingTestProps {
  onProgressUpdate?: (progress: number, wpm: number, accuracy: number) => void;
  externalWords?: string[];
  hideSettings?: boolean;
}

export function TypingTest({ onProgressUpdate, externalWords, hideSettings }: TypingTestProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { timerMode, setTimerMode } = useStore();
  const { saveResult, isLoggedIn } = useAuth();

  const [words] = useState<string[]>(() => externalWords || generateWords(120));
  const [result, setResult] = useState<TestResult | null>(null);

  const handleComplete = useCallback(
    async (r: TestResult) => {
      setResult(r);
      try {
        await saveResult({
          wpm: r.wpm,
          accuracy: r.accuracy,
          errors: r.errors,
          duration: r.duration,
          mode: r.mode,
          wordCount: r.wordCount,
        });
      } catch {
        // Guest mode — no save needed
      }
    },
    [saveResult]
  );

  const {
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
  } = useTypingEngine({
    words,
    timerMode,
    onComplete: handleComplete,
  });

  // Notify multiplayer parent of progress
  useEffect(() => {
    if (onProgressUpdate && isRunning) {
      onProgressUpdate(progress, wpm, accuracy);
    }
  }, [progress, wpm, accuracy, isRunning, onProgressUpdate]);

  // Focus input on mount and click
  useEffect(() => {
    inputRef.current?.focus();
  }, [result]);

  const handleRetry = useCallback(() => {
    setResult(null);
    reset();
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [reset]);

  const handleModeChange = useCallback(
    (mode: TimerMode) => {
      setTimerMode(mode);
      setResult(null);
      reset();
      setTimeout(() => inputRef.current?.focus(), 50);
    },
    [setTimerMode, reset]
  );

  if (result && isFinished) {
    return <ResultsScreen result={result} onRetry={handleRetry} />;
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Settings bar */}
      {!hideSettings && (
        <div className="flex items-center justify-between mb-8">
          {/* Timer mode selector */}
          <div className="flex items-center gap-1 bg-surface rounded-xl p-1">
            {TIMER_MODES.map((mode) => (
              <button
                key={mode}
                onClick={() => handleModeChange(mode)}
                className={cn(
                  'px-4 py-1.5 text-sm font-mono rounded-lg transition-all duration-150',
                  timerMode === mode
                    ? 'bg-accent text-bg font-semibold shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                {mode}s
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRetry}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface transition-colors"
              title="Restart (Tab)"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">restart</span>
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="mb-6">
        <StatsPanel
          wpm={wpm}
          accuracy={accuracy}
          timeLeft={timeLeft}
          isRunning={isRunning}
          errors={wordStates.filter((w) => w.isCompleted && w.letters.some((l) => l.state === 'incorrect')).length}
        />
      </div>

      {/* Timer bar */}
      <div className="mb-6">
        <TimerBar
          timeLeft={timeLeft}
          totalTime={parseInt(timerMode)}
          isRunning={isRunning}
        />
      </div>

      {/* Word display — clickable area */}
      <div
        className="glass-card rounded-2xl p-6 sm:p-8 cursor-text mb-4 relative"
        onClick={() => inputRef.current?.focus()}
      >
        {/* Unfocused overlay */}
        <div
          className="absolute inset-0 rounded-2xl bg-bg/70 backdrop-blur-sm flex items-center justify-center z-10 transition-opacity duration-200"
          style={{
            opacity: document.activeElement === inputRef.current ? 0 : 0,
            pointerEvents: 'none',
          }}
        >
          <span className="text-text-secondary text-sm font-mono">Click to focus</span>
        </div>

        <WordDisplay
          wordStates={wordStates}
          currentWordIndex={currentWordIndex}
          currentInput={currentInput}
        />
      </div>

      {/* Hidden input — captures all typing */}
      <input
        ref={inputRef}
        type="text"
        value={currentInput}
        onChange={(e) => handleInput(e.target.value)}
        onKeyDown={(e) => {
          // Tab = restart
          if (e.key === 'Tab') {
            e.preventDefault();
            handleRetry();
          }
          // Prevent backspace from going to previous word (optional)
        }}
        className="sr-only"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        data-gramm="false"
        aria-label="Typing input"
      />

      <div className="text-center mt-4">
        <span className="text-xs text-text-tertiary font-mono">
          press <kbd className="px-1.5 py-0.5 rounded bg-surface text-text-secondary">tab</kbd> to restart
        </span>
      </div>
    </div>
  );
}
