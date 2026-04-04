'use client';
import { useEffect, useRef } from 'react';
import { RotateCcw, Home, Share2, TrendingUp, Target, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import type { TestResult } from '@/types';
import { cn } from '@/lib/utils';

interface ResultsScreenProps {
  result: TestResult;
  onRetry: () => void;
}

export function ResultsScreen({ result, onRetry }: ResultsScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    async function animate() {
      const { gsap } = await import('gsap');
      const ctx = gsap.context(() => {
        gsap.from('.result-card', {
          opacity: 0,
          y: 40,
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.08,
        });
        gsap.from('.result-wpm', {
          textContent: 0,
          duration: 1.2,
          ease: 'power2.out',
          snap: { textContent: 1 },
          onUpdate: function () {
            const el = document.querySelector('.result-wpm');
            if (el) el.textContent = Math.round(parseFloat(el.textContent || '0')).toString();
          },
        });
      }, containerRef);
      cleanup = () => ctx.revert();
    }

    animate();
    return () => cleanup?.();
  }, []);

  const grade = getGrade(result.wpm, result.accuracy);

  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Main result */}
      <div className="result-card glass-card rounded-2xl p-8 text-center">
        <div className="text-xs font-mono text-text-tertiary uppercase tracking-widest mb-4">
          Test Complete
        </div>

        {/* Grade badge */}
        <div
          className={cn(
            'inline-flex items-center justify-center w-16 h-16 rounded-2xl text-2xl font-bold mb-4',
            grade.color
          )}
        >
          {grade.letter}
        </div>

        {/* WPM - hero number */}
        <div className="mb-6">
          <div className="result-wpm text-7xl sm:text-8xl font-mono font-bold text-accent tabular-nums">
            {result.wpm}
          </div>
          <div className="text-text-secondary font-mono text-sm mt-1 uppercase tracking-widest">
            words per minute
          </div>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-3 gap-4">
          <ResultStat
            icon={<Target className="w-4 h-4" />}
            label="Accuracy"
            value={`${result.accuracy}%`}
            good={result.accuracy >= 95}
            bad={result.accuracy < 85}
          />
          <ResultStat
            icon={<Clock className="w-4 h-4" />}
            label="Duration"
            value={`${result.duration}s`}
          />
          <ResultStat
            icon={<AlertCircle className="w-4 h-4" />}
            label="Errors"
            value={result.errors.toString()}
            bad={result.errors > 10}
            good={result.errors === 0}
          />
        </div>
      </div>

      {/* Detailed breakdown */}
      <div className="result-card glass-card rounded-2xl p-6">
        <div className="text-xs font-mono text-text-tertiary uppercase tracking-widest mb-4 flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5" />
          Breakdown
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <BreakdownStat label="Words typed" value={result.wordCount.toString()} />
          <BreakdownStat label="Correct chars" value={result.chars.correct.toString()} />
          <BreakdownStat label="Wrong chars" value={result.chars.incorrect.toString()} />
          <BreakdownStat label="Mode" value={`${result.mode}s`} />
        </div>
      </div>

      {/* Actions */}
      <div className="result-card flex items-center justify-center gap-3">
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-3 bg-accent text-bg font-semibold rounded-xl hover:bg-accent-hover transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-accent/20"
        >
          <RotateCcw className="w-4 h-4" />
          Retry
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 px-5 py-3 bg-surface border border-white/8 text-text-primary font-medium rounded-xl hover:bg-surface-hover transition-all"
        >
          <Home className="w-4 h-4" />
          Home
        </Link>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(
              `I just typed ${result.wpm} WPM with ${result.accuracy}% accuracy on TypeCraft! 🎯`
            );
          }}
          className="flex items-center gap-2 px-5 py-3 bg-surface border border-white/8 text-text-secondary hover:text-text-primary font-medium rounded-xl hover:bg-surface-hover transition-all"
          title="Copy result to clipboard"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function ResultStat({
  icon, label, value, good, bad,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  good?: boolean;
  bad?: boolean;
}) {
  return (
    <div className="bg-surface/50 rounded-xl p-3 text-center">
      <div className={cn(
        'flex items-center justify-center gap-1 mb-1',
        good ? 'text-text-success' : bad ? 'text-text-error' : 'text-text-secondary'
      )}>
        {icon}
      </div>
      <div className={cn(
        'text-xl font-mono font-bold',
        good ? 'text-text-success' : bad ? 'text-text-error' : 'text-text-primary'
      )}>
        {value}
      </div>
      <div className="text-xs text-text-tertiary mt-0.5">{label}</div>
    </div>
  );
}

function BreakdownStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-lg font-mono font-semibold text-text-primary">{value}</div>
      <div className="text-xs text-text-tertiary">{label}</div>
    </div>
  );
}

function getGrade(wpm: number, accuracy: number): { letter: string; color: string } {
  const score = wpm * (accuracy / 100);
  if (score >= 100) return { letter: 'S', color: 'bg-accent/20 text-accent' };
  if (score >= 80)  return { letter: 'A', color: 'bg-green-500/20 text-green-400' };
  if (score >= 60)  return { letter: 'B', color: 'bg-blue-500/20 text-blue-400' };
  if (score >= 40)  return { letter: 'C', color: 'bg-yellow-500/20 text-yellow-400' };
  return { letter: 'D', color: 'bg-red-500/20 text-red-400' };
}
