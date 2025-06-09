import { Injectable } from '@nestjs/common';
import { RoomRepository } from '@/rooms/room.repository';
import { JoinRoomResponse } from '@/rooms/responses/join.room.response';
import { RedisService } from '@/common/app/redis.service';
import { AppEnvironment } from '@/common/app/app.environment';
import { YDocInitializerService } from '@/common/yjs/ydoc.initializer.service';
import { Socket } from 'socket.io';
import { RoomDTO } from '@/rooms/dto/room.dto';

@Injectable()
export class RoomService {
    constructor(
        private readonly roomRepository: RoomRepository,
        private readonly redisService: RedisService,
        private readonly appEnv: AppEnvironment,
        private readonly yDocInitializer: YDocInitializerService,
    ) {}

    async joinRoomNew(
        client: Socket,
        fileId: string,
    ): Promise<JoinRoomResponse> {
        const room = this.roomRepository.getRoomByFileId(fileId);

        return room
            ? this.joinInAlreadyExistsRoom(room, client, fileId)
            : await this.createRoom(fileId, client);
    }

    private joinInAlreadyExistsRoom(
        room: RoomDTO,
        client: Socket,
        fileId: string,
    ): JoinRoomResponse {
        room.clients.add(client.id);

        this.roomRepository.joinRoom(client.id, room.id);

        return {
            roomId: room.id,
            host: this.roomRepository.getYHost(),
            fileId,
            message: 'Подключение к уже существующую комнату',
        };
    }

    private async createRoom(
        fileId: string,
        client: Socket,
    ): Promise<JoinRoomResponse> {
        const roomId = this.generateRoomId();
        const { ydoc, provider } =
            await this.yDocInitializer.createYDocWithProvider(roomId, fileId);

        this.roomRepository.saveRoom(roomId, client.id, provider, ydoc, fileId);

        return {
            roomId,
            host: this.roomRepository.getYHost(),
            fileId,
            message: 'Создана новая комнату',
        };
    }

    private generateRoomId(): string {
        return Math.random().toString(36).substring(2, 8);
    }

    disconnect(clientId: string) {
        const roomId = this.roomRepository.getRoomIdByClientId(clientId);

        const room = this.roomRepository.getRoomById(roomId);

        this.roomRepository.deleteClientRoom(clientId);
        room.clients.delete(clientId);

        if (room.clients.size === 0) {
            room.provider.destroy();
            this.roomRepository.deleteRoom(room.id);
            this.redisService.delete(roomId);
        }
    }
}
