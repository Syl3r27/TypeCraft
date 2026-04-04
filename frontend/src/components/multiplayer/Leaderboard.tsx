'use client';
import { Trophy, Crown, Medal } from 'lucide-react';
import type { Player } from '@/types';
import { cn } from '@/lib/utils';

interface LeaderboardProps {
  players: Player[];
  currentSocketId?: string;
}

export function Leaderboard({ players, currentSocketId }: LeaderboardProps) {
  const sorted = [...players].sort((a, b) => {
    if (a.finished && b.finished) return (a.finishTime || 0) - (b.finishTime || 0);
    if (a.finished) return -1;
    if (b.finished) return 1;
    return b.wpm - a.wpm;
  });

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <Trophy className="w-4 h-4 text-accent" />
        <span className="text-sm font-medium text-text-primary">Race Results</span>
      </div>

      <div className="space-y-2">
        {sorted.map((player, idx) => {
          const isMe = player.socketId === currentSocketId;
          const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;

          return (
            <div
              key={player.id}
              className={cn(
                'flex items-center gap-4 p-3 rounded-xl transition-colors',
                isMe ? 'bg-accent/10 border border-accent/20' : 'bg-surface/50',
                idx === 0 && 'ring-1 ring-accent/30'
              )}
            >
              {/* Rank */}
              <div className="w-8 text-center">
                {medal ? (
                  <span className="text-lg">{medal}</span>
                ) : (
                  <span className="text-sm font-mono text-text-tertiary">#{idx + 1}</span>
                )}
              </div>

              {/* Player name */}
              <div className="flex-1 min-w-0">
                <div className={cn(
                  'text-sm font-medium truncate',
                  isMe ? 'text-accent' : 'text-text-primary'
                )}>
                  {player.username}
                  {isMe && <span className="text-text-tertiary text-xs ml-1">(you)</span>}
                </div>
                {player.finished && player.finishTime && (
                  <div className="text-xs text-text-tertiary font-mono">
                    {(player.finishTime / 1000).toFixed(1)}s
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="text-right">
                <div className="text-sm font-mono font-bold text-text-primary tabular-nums">
                  {player.wpm} <span className="text-xs text-text-tertiary font-normal">wpm</span>
                </div>
                <div className="text-xs font-mono text-text-tertiary">
                  {player.accuracy}% acc
                </div>
              </div>

              {/* Finished badge */}
              {player.finished && (
                <div className="w-2 h-2 rounded-full bg-text-success flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
