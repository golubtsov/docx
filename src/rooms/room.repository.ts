import * as Y from 'yjs';
import { Doc } from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { RoomDTO } from '@/rooms/dto/room.dto';
import { CreateRoomResponse } from '@/rooms/responses/create.room.response';
import { JoinRoomResponse } from '@/rooms/responses/join.room.response';
import { Injectable } from '@nestjs/common';
import { DeleteRoomResponse } from '@/rooms/responses/delete.room.response';
import { LeaveRoomResponse } from '@/rooms/responses/leave.room.response';
import { AppStateEnum } from '@/common/app/app.state.enum';
import { AppEnvironment } from '@/common/app/app.environment';
import { polyglot } from '@/common/lang/polyglot';

@Injectable()
export class RoomRepository {
    private readonly Y_HOST: string = `ws://localhost:${this.appEnv.getYJSPort()}`;

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
    ): void {
        const room: RoomDTO = {
            id: roomId,
            owner_id: clientId,
            provider,
            clients: new Set([clientId]),
            ydoc,
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

        this.getRoom(roomId).clients.delete(clientId);

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
