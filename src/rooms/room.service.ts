import * as Y from 'yjs';
import {WebsocketProvider} from 'y-websocket';
import {JoinRoomDTO, RoomDTO} from "@/rooms/dto/room.dto";
import {Injectable} from "@nestjs/common";
import {DocumentService} from "@docxservice/documentservice";
import path from "node:path";
import {YsyncAdapterService} from "@/yjs/ysync.adapter.service";

@Injectable()
export class RoomService {
    private readonly wsHost: string = `ws://localhost:${process.env.YJS_PORT}`;
    private rooms: Map<string, RoomDTO> = new Map();
    private clientRooms: Map<string, string> = new Map(); // clientId -> roomId

    constructor(private readonly documentService: DocumentService) {
        setInterval(() => this.cleanupEmptyRooms(), 60 * 60 * 1000); // Every hour
    }

    handleConnection(clientId: string) {
        return {
            message: 'Successfully connected. Use createRoom or joinRoom commands.'
        };
    }

    async createRoom(clientId: string): Promise<{ roomId?: string, message?: string }> {
        if (this.clientRooms.has(clientId)) {
            return {
                message: 'Вы подключены к одной комнате, чтобы создать новую, выйдите из первой',
                roomId: null
            }
        }

        const roomId = this.generateRoomId();
        const ydoc = new Y.Doc();
        await this.readDocumentTest(ydoc)
        const provider = new WebsocketProvider(this.wsHost, roomId, ydoc);

        const room: RoomDTO = {
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

    private async readDocumentTest(yDoc: Y.Doc) {
        await this.documentService.openSystemUri(
            path.join(__dirname, '../../../data/paragraphs.docx')
        );

        const adapter = new YsyncAdapterService();

        adapter.serYDoc(yDoc).setDocument(this.documentService.getDocument()).init()

        console.log(yDoc.getMap('root'))
    }

    joinRoom(clientId: string, roomId: string): JoinRoomDTO {
        if (this.clientRooms.has(clientId)) {
            return {
                success: true,
                message: 'Вы уже подключены к комнате'
            };
        }

        const room = this.rooms.get(roomId);
        if (!room) {
            return {
                success: false,
                message: 'Комната не найдена'
            };
        }

        room.clients.add(clientId);
        this.clientRooms.set(clientId, roomId);

        return {
            success: true,
            message: 'Вы подключились к комнате',
            room: room
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

    getDocument(clientId: string): Y.Doc | null | boolean {
        const roomId = this.clientRooms.get(clientId);

        if (!roomId) return false;

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