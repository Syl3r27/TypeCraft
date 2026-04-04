'use client';
import { useEffect, useRef } from 'react';
import type { WordState } from '@/types';
import { cn } from '@/lib/utils';

interface WordDisplayProps {
  wordStates: WordState[];
  currentWordIndex: number;
  currentInput: string;
}

export function WordDisplay({ wordStates, currentWordIndex, currentInput }: WordDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);

  // Auto-scroll to keep active word in view
  useEffect(() => {
    if (activeWordRef.current && containerRef.current) {
      const container = containerRef.current;
      const activeWord = activeWordRef.current;
      const wordTop = activeWord.offsetTop;
      const containerHeight = container.clientHeight;
      const lineHeight = activeWord.clientHeight + 8; // approx line height + gap

      // Scroll if active word goes past the second line
      if (wordTop > lineHeight * 1.5) {
        container.scrollTo({
          top: wordTop - lineHeight,
          behavior: 'smooth',
        });
      }
    }
  }, [currentWordIndex]);

  return (
    <div
      ref={containerRef}
      className="relative font-mono text-2xl leading-relaxed select-none overflow-hidden"
      style={{ maxHeight: '7rem' }}
    >
      <div className="flex flex-wrap gap-x-3 gap-y-2">
        {wordStates.map((wordState, wordIndex) => {
          const isActive = wordIndex === currentWordIndex;
          const isPast = wordIndex < currentWordIndex;

          return (
            <span
              key={wordIndex}
              ref={isActive ? activeWordRef : null}
              className={cn(
                'relative inline-flex items-center',
                isActive && 'after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-px after:bg-accent/30 after:rounded'
              )}
            >
              {/* Letters */}
              {wordState.letters.map((letter, letterIndex) => (
                <span
                  key={letterIndex}
                  className={cn(
                    'transition-colors duration-75',
                    letter.state === 'correct' && 'text-text-primary',
                    letter.state === 'incorrect' && 'text-text-error underline underline-offset-2',
                    letter.state === 'extra' && 'text-text-error opacity-70',
                    letter.state === 'pending' && (isPast ? 'text-text-error' : 'text-text-secondary')
                  )}
                >
                  {letter.char}
                </span>
              ))}

              {/* Caret */}
              {isActive && (
                <span
                  className="absolute animate-caret-blink bg-accent rounded-sm"
                  style={{
                    width: '2px',
                    height: '1.2em',
                    left: `${getCaretOffset(wordState, currentInput)}ch`,
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                />
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function getCaretOffset(wordState: WordState, input: string): number {
  // Position caret after the last typed character
  return Math.min(input.length, wordState.word.length + 10);
}
