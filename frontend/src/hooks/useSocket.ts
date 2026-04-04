'use client';
import { useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import type { Room, Player } from '@/types';

interface UseSocketOptions {
  onRoomCreated?: (room: Room) => void;
  onRoomJoined?: (room: Room) => void;
  onRoomError?: (message: string) => void;
  onPlayerJoined?: (player: Player, room: Room) => void;
  onPlayerLeft?: (socketId: string, room: Room) => void;
  onCountdown?: (room: Room) => void;
  onCountdownTick?: (count: number) => void;
  onRaceStart?: (room: Room) => void;
  onProgressUpdate?: (players: Player[]) => void;
  onPlayerFinished?: (player: Player, players: Player[]) => void;
  onRaceFinished?: (room: Room) => void;
  onChatMessage?: (username: string, message: string) => void;
  onRoomClosed?: () => void;
}

export function useSocket(options: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;

    socket.on('room:created', ({ room }: { room: Room }) => {
      optionsRef.current.onRoomCreated?.(room);
    });

    socket.on('room:joined', ({ room }: { room: Room }) => {
      optionsRef.current.onRoomJoined?.(room);
    });

    socket.on('room:error', ({ message }: { message: string }) => {
      optionsRef.current.onRoomError?.(message);
    });

    socket.on('room:player_joined', ({ player, room }: { player: Player; room: Room }) => {
      optionsRef.current.onPlayerJoined?.(player, room);
    });

    socket.on('room:player_left', ({ socketId, room }: { socketId: string; room: Room }) => {
      optionsRef.current.onPlayerLeft?.(socketId, room);
    });

    socket.on('room:countdown', ({ room }: { room: Room }) => {
      optionsRef.current.onCountdown?.(room);
    });

    socket.on('room:countdown_tick', ({ count }: { count: number }) => {
      optionsRef.current.onCountdownTick?.(count);
    });

    socket.on('room:race_start', ({ room }: { room: Room }) => {
      optionsRef.current.onRaceStart?.(room);
    });

    socket.on('room:progress_update', ({ players }: { players: Player[] }) => {
      optionsRef.current.onProgressUpdate?.(players);
    });

    socket.on('player:finished', ({ player, players }: { player: Player; players: Player[] }) => {
      optionsRef.current.onPlayerFinished?.(player, players);
    });

    socket.on('room:race_finished', ({ room }: { room: Room }) => {
      optionsRef.current.onRaceFinished?.(room);
    });

    socket.on('room:chat_message', ({ username, message }: { username: string; message: string }) => {
      optionsRef.current.onChatMessage?.(username, message);
    });

    socket.on('room:closed', () => {
      optionsRef.current.onRoomClosed?.();
    });

    return () => {
      socket.off('room:created');
      socket.off('room:joined');
      socket.off('room:error');
      socket.off('room:player_joined');
      socket.off('room:player_left');
      socket.off('room:countdown');
      socket.off('room:countdown_tick');
      socket.off('room:race_start');
      socket.off('room:progress_update');
      socket.off('player:finished');
      socket.off('room:race_finished');
      socket.off('room:chat_message');
      socket.off('room:closed');
      disconnectSocket();
    };
  }, []);

  const createRoom = useCallback((username: string) => {
    socketRef.current?.emit('room:create', { username });
  }, []);

  const joinRoom = useCallback((code: string, username: string) => {
    socketRef.current?.emit('room:join', { code, username });
  }, []);

  const startGame = useCallback(() => {
    socketRef.current?.emit('room:start');
  }, []);

  const sendProgress = useCallback((progress: number, wpm: number, accuracy: number) => {
    socketRef.current?.emit('player:progress', { progress, wpm, accuracy });
  }, []);

  const leaveRoom = useCallback(() => {
    socketRef.current?.emit('room:leave');
  }, []);

  const sendChat = useCallback((message: string) => {
    socketRef.current?.emit('room:chat', { message });
  }, []);

  return { createRoom, joinRoom, startGame, sendProgress, leaveRoom, sendChat };
}
