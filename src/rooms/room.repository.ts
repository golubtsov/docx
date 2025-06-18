import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { RoomDTO } from '@/rooms/dto/room.dto';
import { Injectable } from '@nestjs/common';
import { AppEnvironment } from '@/common/app/app.environment';

@Injectable()
export class RoomRepository {
    /** Map<fileId: string, RoomDto> */
    private rooms = new Map<string, RoomDTO>();

    /** Map<clientId: string, roomId: string> */
    private clientRooms = new Map<string, string>();

    constructor(private readonly appEnv: AppEnvironment) {
        setInterval(() => this.cleanupEmptyRooms(), 60 * 60 * 1000); // Every hour
    }

    saveRoom(
        roomId: string,
        clientId: string,
        provider: WebsocketProvider,
        ydoc: Y.Doc,
        fileId: string,
        resourceId: string,
    ) {
        const room: RoomDTO = {
            id: roomId,
            ownerId: clientId,
            provider,
            clients: new Set([clientId]),
            ydoc,
            fileId,
            resourceId,
        };
        this.rooms.set(fileId, room);
        this.clientRooms.set(clientId, roomId);
    }

    getYHost(): string {
        return `ws://localhost:${this.appEnv.getYJSPort()}`;
    }

    isClientInRoom(clientId: string): boolean {
        return this.clientRooms.has(clientId);
    }

    joinRoom(clientId: string, roomId: string) {
        this.clientRooms.set(clientId, roomId);
    }

    getRoomByFileId(fileId: string): RoomDTO | undefined {
        return this.rooms.get(fileId);
    }

    getRoomIdByClientId(clientId: string) {
        return this.clientRooms.get(clientId);
    }

    deleteRoom(roomId: string) {
        return this.rooms.delete(roomId);
    }

    getRoomById(roomId: string): RoomDTO {
        const rooms = this.rooms.values();

        for (const room of rooms) {
            if (roomId === room.id) return room;
        }
    }

    deleteClientRoom(clientId: string) {
        return this.clientRooms.delete(clientId);
    }

    private cleanupEmptyRooms() {
        for (const [roomId, room] of this.rooms) {
            if (room.clients.size === 0) {
                this.deleteRoom(roomId);
            }
        }
    }

    isDocumentSavedInRoom(fileId: string) {
        const room = this.getRoomByFileId(fileId);
        return room ? room : false;
    }
}
