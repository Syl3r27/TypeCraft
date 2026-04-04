'use client';
import { useState } from 'react';
import { Users, Plus, ArrowRight, Copy, Check, Crown, Play, LogOut } from 'lucide-react';
import type { Room, Player } from '@/types';
import { PlayerCard } from './PlayerCard';
import { cn } from '@/lib/utils';

interface RoomLobbyProps {
  room: Room | null;
  currentSocketId?: string;
  isHost: boolean;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  error?: string;
  username: string;
  onUsernameChange: (name: string) => void;
}

export function RoomLobby({
  room,
  currentSocketId,
  isHost,
  onCreateRoom,
  onJoinRoom,
  onStartGame,
  onLeaveRoom,
  error,
  username,
  onUsernameChange,
}: RoomLobbyProps) {
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<'create' | 'join'>('create');

  const copyCode = async () => {
    if (!room) return;
    await navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // If in a room, show lobby
  if (room) {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-4">
        {/* Room header */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs font-mono text-text-tertiary uppercase tracking-widest mb-1">
                Room Code
              </div>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-mono font-bold text-accent tracking-[0.2em]">
                  {room.code}
                </span>
                <button
                  onClick={copyCode}
                  className="p-2 rounded-lg bg-surface hover:bg-surface-hover transition-colors"
                  title="Copy code"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-text-success" />
                  ) : (
                    <Copy className="w-4 h-4 text-text-secondary" />
                  )}
                </button>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-text-tertiary mb-1">Players</div>
              <div className="text-2xl font-mono font-bold text-text-primary">
                {room.players.length}
                <span className="text-text-tertiary text-sm">/{room.maxPlayers}</span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-2 h-2 rounded-full',
              room.status === 'waiting' ? 'bg-accent animate-pulse' : 'bg-text-success'
            )} />
            <span className="text-sm text-text-secondary capitalize">
              {room.status === 'waiting' ? 'Waiting for players...' : room.status}
            </span>
          </div>
        </div>

        {/* Players grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {room.players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              isHost={player.socketId === room.hostId}
              isCurrentUser={player.socketId === currentSocketId}
            />
          ))}

          {/* Empty slots */}
          {Array.from({ length: room.maxPlayers - room.players.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="glass-card rounded-xl p-4 border-dashed border-surface-active flex items-center gap-3 opacity-40"
            >
              <div className="w-8 h-8 rounded-lg bg-surface-active flex items-center justify-center">
                <Users className="w-4 h-4 text-text-tertiary" />
              </div>
              <span className="text-sm text-text-tertiary font-mono">waiting...</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {isHost ? (
            <button
              onClick={onStartGame}
              disabled={room.players.length < 1}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-accent text-bg font-bold rounded-xl hover:bg-accent-hover transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent/20"
            >
              <Play className="w-4 h-4" />
              Start Race
              {room.players.length === 1 && (
                <span className="text-xs opacity-70 font-normal">(solo)</span>
              )}
            </button>
          ) : (
            <div className="flex-1 flex items-center justify-center gap-2 py-3 bg-surface border border-white/8 text-text-secondary rounded-xl">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              Waiting for host to start...
            </div>
          )}

          <button
            onClick={onLeaveRoom}
            className="flex items-center gap-2 px-4 py-3 bg-surface border border-white/8 text-text-secondary hover:text-text-primary rounded-xl hover:bg-surface-hover transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="text-center text-sm text-text-error bg-text-error/10 rounded-xl px-4 py-3">
            {error}
          </div>
        )}
      </div>
    );
  }

  // No room — show create/join UI
  return (
    <div className="w-full max-w-md mx-auto">
      {/* Username */}
      <div className="glass-card rounded-2xl p-6 mb-4">
        <label className="text-xs font-mono text-text-tertiary uppercase tracking-widest block mb-2">
          Your username
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => onUsernameChange(e.target.value.slice(0, 20))}
          placeholder="anonymous"
          className="w-full bg-surface rounded-xl px-4 py-2.5 font-mono text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/50 border border-white/5"
          maxLength={20}
        />
      </div>

      {/* Tabs */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex border-b border-white/5">
          <TabBtn active={tab === 'create'} onClick={() => setTab('create')}>
            <Plus className="w-4 h-4" />
            Create Room
          </TabBtn>
          <TabBtn active={tab === 'join'} onClick={() => setTab('join')}>
            <Users className="w-4 h-4" />
            Join Room
          </TabBtn>
        </div>

        <div className="p-6">
          {tab === 'create' ? (
            <div className="space-y-4">
              <p className="text-sm text-text-secondary">
                Create a new room and share the 6-character code with friends to race together.
              </p>
              <button
                onClick={onCreateRoom}
                className="w-full flex items-center justify-center gap-2 py-3 bg-accent text-bg font-bold rounded-xl hover:bg-accent-hover transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-accent/20"
              >
                <Plus className="w-4 h-4" />
                Create Room
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-text-secondary">
                Enter the 6-character room code to join an existing race.
              </p>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="ENTER CODE"
                className="w-full bg-surface rounded-xl px-4 py-3 font-mono text-xl text-center tracking-[0.3em] text-accent placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/50 border border-white/5 uppercase"
                maxLength={6}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && joinCode.length === 6) {
                    onJoinRoom(joinCode);
                  }
                }}
              />
              <button
                onClick={() => onJoinRoom(joinCode)}
                disabled={joinCode.length !== 6}
                className="w-full flex items-center justify-center gap-2 py-3 bg-accent text-bg font-bold rounded-xl hover:bg-accent-hover transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-accent/20"
              >
                <ArrowRight className="w-4 h-4" />
                Join Room
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 text-center text-sm text-text-error bg-text-error/10 rounded-xl px-4 py-3">
          {error}
        </div>
      )}
    </div>
  );
}

function TabBtn({
  active, onClick, children,
}: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
        active
          ? 'text-accent border-b-2 border-accent bg-accent/5'
          : 'text-text-secondary hover:text-text-primary'
      )}
    >
      {children}
    </button>
  );
}
