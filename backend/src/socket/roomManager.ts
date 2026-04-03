import {v4 as uuidv4} from 'uuid';
import { generateWordList } from '../utils/wordGenerator';

export interface Player {
    id: string;
    socketId: string;
    username: string;
    progress: number; // 0 to 100 percent
    wpm: number;
    accuracy: number;
    finished: boolean;
    finishTime?: number;
    position?: number;
}

export interface Room {
    id: string;
    code: string;
    hostId: string;
    players: Player[];
    words:string[];
    status: 'waiting' | 'countdown' | 'racing' | 'finished';
    startTime?: number;
    maxPlayers: number;
    duration: number; // Seconds;
    createdAt : number;
}

const rooms = new Map<string, Room>();

const socketToRoom = new Map<string, string>();

function generateCode(): string{
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';

    for(let i = 0; i<6; i++){
        code+=chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
};

export function createRoom(hostSocketId: string, hostUsername: string): Room {
  let code = generateCode();
  while (getRoomByCode(code)) {
    code = generateCode();
  }

  const roomId = uuidv4();
  const words = generateWordList(80, 'common');

  const room: Room = {
    id: roomId,
    code,
    hostId: hostSocketId,
    players: [
      {
        id: uuidv4(),
        socketId: hostSocketId,
        username: hostUsername,
        progress: 0,
        wpm: 0,
        accuracy: 100,
        finished: false,
      },
    ],
    words,
    status: 'waiting',
    maxPlayers: 6,
    duration: 60,
    createdAt: Date.now(),
  };

  rooms.set(roomId, room);
  socketToRoom.set(hostSocketId, roomId);
  return room;
}


export function joinRoom(
    code: string,
    socketId: string, 
    username: string
) : {room : Room; error?: string}{
    const room = getRoomByCode(code);
    if(!room) return {room: null as any, error: 'Room not Found'};
    if(room.status !== 'waiting') return {room: null as any, error: 'Game Already in progress'}
    if(room.players.length >= room.maxPlayers) return {room: null as any, error:'Room is full'};


    const player: Player = {
        id: uuidv4(),
        socketId,
        username,
        progress: 0,
        wpm: 0,
        accuracy: 100,
        finished: false,
    };
    room.players.push(player);
    socketToRoom.set(socketId, room.id);
    return {room}
};

export function leaveRoom(socketId: string) : {room: Room | null; wasHost: boolean}{
    const roomId = socketToRoom.get(socketId);

    if(!roomId) return { room: null, wasHost: false};

    const room = rooms.get(roomId);
    if(!room) return {room: null, wasHost:false};

    const wasHost = room.hostId === socketId;
    room.players = room.players.filter((p)=> p.socketId !== socketId);
    socketToRoom.delete(socketId);

    if(room.players.length === 0){
        rooms.delete(roomId);
        return { room: null, wasHost}
    }

    // Transfer host to next player
    if (wasHost && room.players.length > 0) {
        room.hostId = room.players[0].socketId;
    }

    return { room, wasHost };
}

export function getRoomByCode(code: string): Room | undefined {
  return Array.from(rooms.values()).find((r) => r.code === code.toUpperCase());
}