import { Doc } from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { RoomDTO } from '@/rooms/dto/room.dto';
import { CreateRoomResponse } from '@/rooms/responses/create.room.response';
import { DocumentService } from '@docxservice/documentservice';
import path from 'node:path';
import { YsyncAdapterService } from '@/common/yjs/ysync.adapter.service';
import { JoinRoomResponse } from '@/rooms/responses/join.room.response';
import { Injectable } from '@nestjs/common';
import { DeleteRoomResponse } from '@/rooms/responses/delete.room.response';
import { LeaveRoomResponse } from '@/rooms/responses/leave.room.response';
import { AppStateEnum } from '@/common/app/app.state.enum';
import { AppEnvironment } from '@/common/app/app.environment';

@Injectable()
export class RoomManager {
    private readonly Y_HOST: string = `ws://localhost:${AppEnvironment.getYJSPort()}`;

    private rooms = new Map<string, RoomDTO>();

    private clientRooms = new Map<string, string>();

    constructor() {
        setInterval(() => this.cleanupEmptyRooms(), 60 * 60 * 1000); // Every hour
    }

    async createRoom(clientId: string): Promise<CreateRoomResponse> {
        if (this.isClientInRoom(clientId)) {
            return this.clientAlreadyInRoomResponse();
        }

        const roomId = this.generateRoomId();
        const { provider } = await this.initializeYDoc(roomId);

        try {
            await this.establishConnection(provider);
            this.registerRoom(roomId, clientId, provider);
            return this.successfulCreationResponse(roomId);
        } catch (error) {
            return this.handleCreationError(error);
        }
    }

    private isClientInRoom(clientId: string): boolean {
        return this.clientRooms.has(clientId);
    }

    private clientAlreadyInRoomResponse(): CreateRoomResponse {
        return {
            message:
                'Вы подключены к одной комнате, чтобы создать новую, выйдите из первой',
            roomId: undefined,
        };
    }

    private generateRoomId(): string {
        if (AppEnvironment.getNodeEnv() === AppStateEnum.Development) {
            return '1111';
        }
        return Math.random().toString(36).substring(2, 8);
    }

    private async initializeYDoc(
        roomId: string,
    ): Promise<{ ydoc: Doc; provider: WebsocketProvider }> {
        const ydoc = new Doc();

        await this.putDocumentToYDoc(ydoc);

        const provider = new WebsocketProvider(this.Y_HOST, roomId, ydoc, {
            WebSocketPolyfill: WebSocket,
        });

        return { ydoc, provider };
    }

    private async putDocumentToYDoc(ydoc: Doc) {
        const documentService = new DocumentService();

        console.log(path.join(process.cwd()));

        await documentService.openSystemUri(
            path.join(process.cwd(), './data/paragraphs.docx'),
        );

        const adapter = new YsyncAdapterService();

        adapter.init(ydoc, documentService.getDocument());
    }

    private async establishConnection(
        provider: WebsocketProvider,
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            provider.on('status', ({ status }) => {
                if (status === 'connected') resolve();
            });
            provider.on('connection-error', reject);
        });
    }

    private registerRoom(
        roomId: string,
        clientId: string,
        provider: WebsocketProvider,
    ): void {
        const room: RoomDTO = {
            id: roomId,
            owner_id: clientId,
            provider,
            clients: new Set([clientId]),
        };

        this.rooms.set(roomId, room);
        this.clientRooms.set(clientId, roomId);
    }

    private successfulCreationResponse(roomId: string): CreateRoomResponse {
        return { roomId, host: this.Y_HOST };
    }

    private handleCreationError(error: any): CreateRoomResponse {
        console.error('Room creation failed:', error.message);
        return { message: 'Не удалось создать комнату' };
    }

    joinRoom(clientId: string, roomId: string): JoinRoomResponse {
        if (this.isClientInRoom(clientId)) {
            return {
                success: true,
                message: 'Вы уже подключены к комнате',
            };
        }

        const room = this.rooms.get(roomId);

        if (!room) {
            return {
                success: false,
                message: 'Комната не найдена',
            };
        }

        room.clients.add(clientId);
        this.clientRooms.set(clientId, roomId);

        return {
            success: true,
            message: 'Вы подключились к комнате',
            room: room,
        };
    }

    getRoom(roomId: string): RoomDTO | undefined {
        return this.rooms.get(roomId);
    }

    leaveRoom(clientId: string): LeaveRoomResponse {
        const roomId = this.clientRooms.get(clientId);
        if (!roomId)
            return {
                success: false,
                roomId,
                message: 'У пользователя нет комнат',
            };

        const room = this.rooms.get(roomId);
        if (!room)
            return { success: false, roomId, message: 'Комната не найдена' };

        room.clients.delete(clientId);
        this.clientRooms.delete(clientId);

        return { success: true, roomId, message: 'Вы покинули комнату' };
    }

    deleteRoom(roomId: string, clientId: string): DeleteRoomResponse {
        const room = this.rooms.get(roomId);
        if (!room)
            return {
                success: false,
                message: 'Комната не найдена',
            };

        if (room.owner_id !== clientId) {
            return {
                success: false,
                message: 'Вы не можете удалить комнату',
            };
        }

        room.provider.destroy();
        this.rooms.delete(roomId);
        room.clients.forEach((clientId) => this.clientRooms.delete(clientId));

        return {
            success: true,
            message: 'Комната удалена',
        };
    }

    private cleanupEmptyRooms() {
        for (const [roomId, room] of this.rooms) {
            if (room.clients.size === 0) {
                this.deleteRoom(roomId, room.owner_id);
            }
        }
    }
}
