'use client';
import { useEffect, useRef, forwardRef } from 'react';
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

  // Auto-scroll so active word stays in the first two rows
  useEffect(() => {
    const container = containerRef.current;
    const activeWord = activeWordRef.current;
    if (!container || !activeWord) return;

    const relativeTop = activeWord.offsetTop;
    // Each row ≈ font-size(24px) * line-height(1.75) ≈ 42px + 12px gap = 54px
    const rowH = 54;

    if (relativeTop > rowH * 1.5) {
      container.scrollTo({ top: relativeTop - rowH, behavior: 'smooth' });
    }
  }, [currentWordIndex]);

  return (
    <div
      ref={containerRef}
      className="relative select-none overflow-hidden"
      style={{ height: '108px' }}
    >
      <div className="flex flex-wrap gap-x-3 gap-y-3">
        {wordStates.map((wordState, wordIndex) => {
          const isActive = wordIndex === currentWordIndex;
          const isPast = wordIndex < currentWordIndex;

          return (
            <WordSpan
              key={wordIndex}
              ref={isActive ? activeWordRef : null}
              wordState={wordState}
              isActive={isActive}
              isPast={isPast}
              caretIndex={isActive ? currentInput.length : -1}
            />
          );
        })}
      </div>

      {/* Gradient fade on bottom to hide partial third row */}
      <div
        className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, #0f0f0f)' }}
      />
    </div>
  );
}

// ─── Individual word span ─────────────────────────────────────
interface WordSpanProps {
  wordState: WordState;
  isActive: boolean;
  isPast: boolean;
  caretIndex: number; // -1 means not active
}

const WordSpan = forwardRef<HTMLSpanElement, WordSpanProps>(function WordSpan(
  { wordState, isActive, isPast, caretIndex },
  ref
) {
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const caretRef = useRef<HTMLSpanElement>(null);

  // Reposition caret on every render when active
  useEffect(() => {
    if (!isActive || caretIndex < 0 || !caretRef.current) return;
    const caret = caretRef.current;
    const refs = letterRefs.current;
    const total = wordState.letters.length;

    if (caretIndex === 0) {
      caret.style.left = '0px';
    } else if (caretIndex <= total) {
      const el = refs[caretIndex - 1];
      if (el) caret.style.left = `${el.offsetLeft + el.offsetWidth}px`;
    } else {
      // Past the end — extrapolate from last letter
      const last = refs[total - 1];
      if (last) {
        const extra = caretIndex - total;
        caret.style.left = `${last.offsetLeft + last.offsetWidth * (1 + extra)}px`;
      }
    }
  });

  return (
    <span
      ref={ref}
      className={cn(
        'relative inline-flex font-mono text-2xl tracking-wide',
        isActive &&
          'after:absolute after:-bottom-[3px] after:left-0 after:right-0 after:h-px after:rounded-full after:bg-[#e2b714]/20'
      )}
      style={{ lineHeight: '1.75' }}
    >
      {wordState.letters.map((letter, i) => (
        <span
          key={i}
          ref={(el) => { letterRefs.current[i] = el; }}
          className={cn(
            'transition-colors duration-[50ms]',
            letter.state === 'correct' && 'text-[#d1d0c5]',
            letter.state === 'incorrect' &&
              'text-[#ca4754] underline decoration-[#ca4754]/60 underline-offset-[3px]',
            letter.state === 'extra' && 'text-[#ca4754] opacity-60',
            letter.state === 'pending' &&
              (isPast ? 'text-[#ca4754]/40' : isActive ? 'text-[#646669]' : 'text-[#3a3a3c]')
          )}
        >
          {letter.char}
        </span>
      ))}

      {/* Caret — only rendered on active word */}
      {isActive && (
        <span
          ref={caretRef}
          className="absolute rounded-sm bg-[#e2b714] animate-caret-blink"
          style={{ width: '2px', top: '10%', height: '80%', left: '0px' }}
        />
      )}
    </span>
  );
});