'use client';
import { Crown } from 'lucide-react';
import type { Player } from '@/types';
import { cn } from '@/lib/utils';

interface RaceTrackProps {
  players: Player[];
  currentSocketId?: string;
}

export function RaceTrack({ players, currentSocketId }: RaceTrackProps) {
  const sorted = [...players].sort((a, b) => b.progress - a.progress);

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <div className="text-xs font-mono text-text-tertiary uppercase tracking-widest mb-2">
        Race Progress
      </div>

      {sorted.map((player, idx) => {
        const isMe = player.socketId === currentSocketId;
        const avatarChar = player.username[0]?.toUpperCase();

        return (
          <div key={player.id} className="space-y-1">
            {/* Name row */}
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className={cn(
                  'w-4 text-text-tertiary text-right',
                )}>
                  {idx + 1}.
                </span>
                <span className={cn(
                  'font-medium',
                  isMe ? 'text-accent' : 'text-text-primary'
                )}>
                  {player.username}
                  {isMe && <span className="text-text-tertiary ml-1">(you)</span>}
                </span>
                {player.finished && player.position === 1 && (
                  <Crown className="w-3 h-3 text-accent" />
                )}
              </div>
              <div className="flex items-center gap-3 text-text-secondary">
                <span>{player.wpm} wpm</span>
                <span className="text-text-tertiary">{Math.round(player.progress)}%</span>
              </div>
            </div>

            {/* Track */}
            <div className="relative flex items-center gap-2">
              <div className="flex-1 h-5 bg-surface-active rounded-lg overflow-hidden relative">
                {/* Track stripes */}
                <div
                  className="absolute inset-0 opacity-5"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 20px, white 20px, white 21px)',
                  }}
                />
                {/* Progress */}
                <div
                  className={cn(
                    'absolute left-0 top-0 h-full rounded-lg transition-all duration-300 ease-out flex items-center justify-end pr-1',
                    player.finished
                      ? 'bg-gradient-to-r from-green-600/60 to-green-500'
                      : isMe
                      ? 'bg-gradient-to-r from-accent/60 to-accent'
                      : 'bg-gradient-to-r from-surface-active to-text-secondary/40'
                  )}
                  style={{ width: `${Math.max(player.progress, 2)}%` }}
                >
                  {player.progress > 8 && (
                    <span className="text-[10px] font-bold text-bg/90">{avatarChar}</span>
                  )}
                </div>

                {/* Car emoji at position */}
                {player.progress <= 8 && (
                  <span
                    className="absolute top-1/2 -translate-y-1/2 text-sm"
                    style={{ left: `${Math.max(player.progress, 0)}%` }}
                  >
                    {isMe ? '🟡' : '⚪'}
                  </span>
                )}
              </div>

              {/* Finish flag */}
              <span className="text-sm">🏁</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
