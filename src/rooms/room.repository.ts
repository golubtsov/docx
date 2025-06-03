import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { RoomDTO } from '@/rooms/dto/room.dto';
import { Injectable } from '@nestjs/common';
import { AppEnvironment } from '@/common/app/app.environment';

@Injectable()
export class RoomRepository {
    private rooms = new Map<string, RoomDTO>();

    private clientRooms = new Map<string, string>();

    constructor(private readonly appEnv: AppEnvironment) {
        setInterval(() => this.cleanupEmptyRooms(), 60 * 60 * 1000); // Every hour
    }

    saveRoom(
        roomId: string,
        clientId: string,
        provider: WebsocketProvider,
        ydoc: Y.Doc,
        fileId: number,
    ): void {
        const room: RoomDTO = {
            id: roomId,
            owner_id: clientId,
            provider,
            clients: new Set([clientId]),
            ydoc,
            file_id: fileId,
        };
        this.rooms.set(roomId, room);
        this.clientRooms.set(clientId, roomId);
    }

    getYHost(): string {
        return `ws://localhost:${this.appEnv.getYJSPort()}`;
    }

    isClientInRoom(clientId: string): boolean {
        return this.clientRooms.has(clientId);
    }

    roomExists(roomId: string) {
        return !!this.rooms.get(roomId);
    }

    joinRoom(clientId: string, roomId: string) {
        this.clientRooms.set(clientId, roomId);
    }

    getRoom(roomId: string): RoomDTO | undefined {
        return this.rooms.get(roomId);
    }

    leaveRoom(clientId: string) {
        const roomId = this.clientRooms.get(clientId);

        this.getRoom(roomId)?.clients.delete(clientId);

        this.clientRooms.delete(clientId);

        return roomId;
    }

    deleteRoom(roomId: string) {
        return this.rooms.delete(roomId);
    }

    deleteClientRooms(clientId: string) {
        return this.clientRooms.delete(clientId);
    }

    private cleanupEmptyRooms() {
        for (const [roomId, room] of this.rooms) {
            if (room.clients.size === 0) {
                this.deleteRoom(roomId);
            }
        }
    }
}
