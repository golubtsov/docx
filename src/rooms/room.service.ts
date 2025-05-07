import * as Y from 'yjs';
import {WebsocketProvider} from 'y-websocket';

interface Room {
    id: string;
    owner_id: string;
    doc: Y.Doc;
    provider: WebsocketProvider;
    clients: Set<string>; // Store client IDs instead of Socket objects
    createdAt: Date;
}

export class RoomService {
    private readonly wsHost: string = 'ws://localhost:4444';
    private rooms: Map<string, Room> = new Map();
    private clientRooms: Map<string, string> = new Map(); // clientId -> roomId

    constructor() {
        setInterval(() => this.cleanupEmptyRooms(), 60 * 60 * 1000); // Every hour
    }

    handleConnection(clientId: string) {
        return {
            message: 'Successfully connected. Use createRoom or joinRoom commands.'
        };
    }

    createRoom(clientId: string): { roomId?: string, message?: string } {
        if (this.clientRooms.has(clientId)) {
            return {
                message: 'Вы подключены к одной комнате, чтобы создать новую, выйдите из первой',
                roomId: null
            }
        }

        const roomId = this.generateRoomId();
        const ydoc = new Y.Doc();
        const provider = new WebsocketProvider(this.wsHost, roomId, ydoc);

        const room: Room = {
            id: roomId,
            owner_id: clientId,
            doc: ydoc,
            provider,
            clients: new Set([clientId]),
            createdAt: new Date()
        };

        this.rooms.set(roomId, room);
        this.clientRooms.set(clientId, roomId);

        return {roomId};
    }

    joinRoom(clientId: string, roomId: string): {
        message: string,
        success: boolean,
        count_listeners?: number,
    } {
        if (this.clientRooms.has(clientId)) {
            return {message: 'Вы уже подключены к данной комнате', success: true};
        }

        const room = this.rooms.get(roomId);
        if (!room) {
            return {message: 'Комната не найдена', success: false};
        }

        room.clients.add(clientId);
        this.clientRooms.set(clientId, roomId);

        return {
            message: 'Вы подключились к комнате',
            success: true,
            count_listeners: room.clients.size
        };
    }

    leaveRoom(clientId: string): { success: boolean; roomId?: string, message?: string } {
        const roomId = this.clientRooms.get(clientId);
        if (!roomId) return {success: false, message: 'У пользователя нет комнат'};

        const room = this.rooms.get(roomId);
        if (!room) return {success: false, message: 'Комната не найдена'};

        if (room.owner_id !== clientId) {
            return {success: false, roomId, message: 'Вы не можете удалить комнату'};
        }

        room.clients.delete(clientId);
        this.clientRooms.delete(clientId);

        return {success: true, roomId, message: 'Вы покинули комнату'};
    }

    deleteRoom(roomId: string): boolean {
        const room = this.rooms.get(roomId);
        if (!room) return false;

        room.provider.destroy();
        this.rooms.delete(roomId);

        room.clients.forEach(clientId => this.clientRooms.delete(clientId));

        return true;
    }

    getDocument(clientId: string): Y.Doc | null {
        const roomId = this.clientRooms.get(clientId);
        if (!roomId) return null;

        const room = this.rooms.get(roomId);
        return room?.doc || null;
    }

    private generateRoomId(): string {
        return Math.random().toString(36).substring(2, 10);
    }

    private cleanupEmptyRooms() {
        for (const [roomId, room] of this.rooms) {
            if (room.clients.size === 0) {
                this.deleteRoom(roomId);
            }
        }
    }
}