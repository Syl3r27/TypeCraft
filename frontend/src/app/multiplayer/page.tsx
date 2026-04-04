'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { RoomLobby } from '@/components/multiplayer/RoomLobby';
import { RaceTrack } from '@/components/multiplayer/RaceTrack';
import { Leaderboard } from '@/components/multiplayer/Leaderboard';
import { TypingTest } from '@/components/typing/TypingTest';
import { useSocket } from '@/hooks/useSocket';
import type { Room, Player } from '@/types';
import { generateGuestUsername } from '@/lib/utils';
import { cn } from '@/lib/utils';

type Phase = 'lobby' | 'countdown' | 'racing' | 'finished';

export default function MultiplayerPage() {
  const [phase, setPhase] = useState<Phase>('lobby');
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const [socketId, setSocketId] = useState<string>('');
  const [username, setUsername] = useState(() => generateGuestUsername());
  const progressThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { createRoom, joinRoom, startGame, sendProgress, leaveRoom } = useSocket({
    onRoomCreated: (r) => {
      setRoom(r);
      setPlayers(r.players);
      setError('');
      // Get socket id from room
      import('@/lib/socket').then(({ getSocket }) => {
        setSocketId(getSocket().id || '');
      });
    },
    onRoomJoined: (r) => {
      setRoom(r);
      setPlayers(r.players);
      setError('');
      import('@/lib/socket').then(({ getSocket }) => {
        setSocketId(getSocket().id || '');
      });
    },
    onRoomError: (msg) => setError(msg),
    onPlayerJoined: (_, r) => {
      setRoom(r);
      setPlayers(r.players);
    },
    onPlayerLeft: (_, r) => {
      setRoom(r);
      setPlayers(r.players);
    },
    onCountdown: (r) => {
      setRoom(r);
      setPhase('countdown');
    },
    onCountdownTick: (count) => {
      setCountdown(count);
    },
    onRaceStart: (r) => {
      setRoom(r);
      setPlayers(r.players);
      setCountdown(null);
      setPhase('racing');
    },
    onProgressUpdate: (updatedPlayers) => {
      setPlayers(updatedPlayers);
    },
    onPlayerFinished: (_, updatedPlayers) => {
      setPlayers(updatedPlayers);
    },
    onRaceFinished: (r) => {
      setRoom(r);
      setPlayers(r.players);
      setPhase('finished');
    },
    onRoomClosed: () => {
      setRoom(null);
      setPlayers([]);
      setPhase('lobby');
      setError('The room was closed by the host.');
    },
  });

  // Get socket ID on mount
  useEffect(() => {
    import('@/lib/socket').then(({ getSocket }) => {
      const s = getSocket();
      s.on('connect', () => setSocketId(s.id || ''));
      if (s.id) setSocketId(s.id);
    });
  }, []);

  const handleCreateRoom = useCallback(() => {
    createRoom(username || 'Anonymous');
  }, [createRoom, username]);

  const handleJoinRoom = useCallback(
    (code: string) => {
      joinRoom(code, username || 'Anonymous');
    },
    [joinRoom, username]
  );

  const handleLeaveRoom = useCallback(() => {
    leaveRoom();
    setRoom(null);
    setPlayers([]);
    setPhase('lobby');
    setError('');
  }, [leaveRoom]);

  const handleProgressUpdate = useCallback(
    (progress: number, wpm: number, accuracy: number) => {
      // Throttle to max 10 updates/sec
      if (progressThrottleRef.current) return;
      progressThrottleRef.current = setTimeout(() => {
        progressThrottleRef.current = null;
      }, 100);
      sendProgress(progress, wpm, accuracy);
    },
    [sendProgress]
  );

  const handlePlayAgain = useCallback(() => {
    setPhase('lobby');
    setRoom(null);
    setPlayers([]);
  }, []);

  const isHost = room?.hostId === socketId;

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 pt-20 pb-10 px-4">
        <div className="max-w-5xl mx-auto">

          {/* Page header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
              Multiplayer Race
            </h1>
            <p className="text-text-secondary text-sm">
              Create a room, share the code, and race your friends in real-time
            </p>
          </div>

          {/* Countdown overlay */}
          {phase === 'countdown' && countdown !== null && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-md">
              <div className="text-center">
                <div className="text-xs font-mono text-text-secondary uppercase tracking-widest mb-4">
                  Race starts in
                </div>
                <div
                  key={countdown}
                  className="text-[10rem] font-mono font-black text-accent animate-countdown leading-none"
                >
                  {countdown === 0 ? 'GO!' : countdown}
                </div>
              </div>
            </div>
          )}

          {/* Lobby */}
          {(phase === 'lobby' || phase === 'countdown') && (
            <RoomLobby
              room={room}
              currentSocketId={socketId}
              isHost={isHost}
              onCreateRoom={handleCreateRoom}
              onJoinRoom={handleJoinRoom}
              onStartGame={startGame}
              onLeaveRoom={handleLeaveRoom}
              error={error}
              username={username}
              onUsernameChange={setUsername}
            />
          )}

          {/* Racing */}
          {phase === 'racing' && room && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Typing area */}
              <div className="lg:col-span-2">
                <TypingTest
                  externalWords={room.words}
                  onProgressUpdate={handleProgressUpdate}
                  hideSettings
                />
              </div>

              {/* Race sidebar */}
              <div className="space-y-4">
                <RaceTrack players={players} currentSocketId={socketId} />
              </div>
            </div>
          )}

          {/* Finished */}
          {phase === 'finished' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <Leaderboard players={players} currentSocketId={socketId} />

              <div className="text-center">
                <button
                  onClick={handlePlayAgain}
                  className="px-8 py-3 bg-accent text-bg font-bold rounded-xl hover:bg-accent-hover transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-accent/20"
                >
                  Play Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
