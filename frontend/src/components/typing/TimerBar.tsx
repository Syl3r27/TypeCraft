'use client';

interface TimerBarProps {
  timeLeft: number;
  totalTime: number;
  isRunning: boolean;
}

export function TimerBar({ timeLeft, totalTime, isRunning }: TimerBarProps) {
  const progress = (timeLeft / totalTime) * 100;
  const isLow = progress < 20;

  return (
    <div className="w-full h-0.5 bg-surface-active rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ease-linear ${
          isLow ? 'bg-text-error' : 'bg-accent'
        } ${!isRunning ? 'opacity-30' : ''}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
