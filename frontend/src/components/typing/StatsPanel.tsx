'use client';
import { cn } from '@/lib/utils';

interface StatsPanelProps {
  wpm: number;
  accuracy: number;
  timeLeft: number;
  isRunning: boolean;
  errors?: number;
}

export function StatsPanel({ wpm, accuracy, timeLeft, isRunning, errors = 0 }: StatsPanelProps) {
  return (
    <div className="flex items-center gap-6 sm:gap-10">
      <StatItem
        value={wpm.toString()}
        label="wpm"
        highlight={wpm > 80}
        muted={!isRunning}
      />
      <StatItem
        value={`${accuracy}%`}
        label="acc"
        highlight={accuracy >= 98}
        error={accuracy < 90 && isRunning}
        muted={!isRunning}
      />
      <StatItem
        value={timeLeft.toString()}
        label="sec"
        muted={!isRunning}
        pulsing={timeLeft <= 5 && isRunning}
      />
      {errors > 0 && (
        <StatItem
          value={errors.toString()}
          label="err"
          error
          muted={!isRunning}
        />
      )}
    </div>
  );
}

function StatItem({
  value,
  label,
  highlight,
  error,
  muted,
  pulsing,
}: {
  value: string;
  label: string;
  highlight?: boolean;
  error?: boolean;
  muted?: boolean;
  pulsing?: boolean;
}) {
  return (
    <div className="text-center">
      <div
        className={cn(
          'text-3xl sm:text-4xl font-mono font-bold tabular-nums transition-colors duration-200',
          highlight && 'text-accent',
          error && 'text-text-error',
          !highlight && !error && (muted ? 'text-text-tertiary' : 'text-text-primary'),
          pulsing && 'animate-pulse text-text-error'
        )}
      >
        {value}
      </div>
      <div className="text-xs text-text-tertiary font-mono uppercase tracking-widest mt-0.5">
        {label}
      </div>
    </div>
  );
}
