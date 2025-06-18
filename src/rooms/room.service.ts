import { Injectable } from '@nestjs/common';
import { RoomRepository } from '@/rooms/room.repository';
import { JoinRoomResponse } from '@/rooms/responses/join.room.response';
import { RedisService } from '@/common/app/redis.service';
import { YDocInitializerService } from '@/common/yjs/ydoc.initializer.service';
import { Socket } from 'socket.io';
import { RoomDTO } from '@/rooms/dto/room.dto';
import { VersionRepository } from '@/versions/version.repository';
import { VersionService } from '@/versions/version.service';
import { LogicCenterService } from '@/common/api/logic.center.service';

@Injectable()
export class RoomService {
    constructor(
        private readonly roomRepository: RoomRepository,
        private readonly redisService: RedisService,
        private readonly yDocInitializer: YDocInitializerService,
        private readonly versionRepository: VersionRepository,
        private readonly versionService: VersionService,
        private readonly logicCenterService: LogicCenterService,
    ) {}

    async joinRoomNew(
        client: Socket,
        resourceId: string,
    ): Promise<JoinRoomResponse> {
        const resource =
            await this.logicCenterService.getResourceInfo(resourceId);

        if (resource.status === false) {
            return {
                message: resource.error,
            };
        }

        if (resource.content === null) {
            return {
                message: 'Resource найден, но content === null',
            };
        }

        const room = this.roomRepository.getRoomByResourceId(resourceId);

        return room
            ? this.joinInAlreadyExistsRoom(room, client, resource.content)
            : await this.createRoom(resourceId, client);
    }

    private joinInAlreadyExistsRoom(
        room: RoomDTO,
        client: Socket,
        resourceId: string,
    ): JoinRoomResponse {
        room.clients.add(client.id);

        this.roomRepository.joinRoom(client.id, room.id);

        return {
            roomId: room.id,
            host: this.roomRepository.getYHost(),
            resourceId,
            message: 'Подключение к уже существующей комнате',
        };
    }

    private async createRoom(
        resourceId: string,
        client: Socket,
    ): Promise<JoinRoomResponse> {
        const roomId = this.generateRoomId();
        const { ydoc, provider } =
            await this.yDocInitializer.createYDocWithProvider(
                roomId,
                resourceId,
            );

        this.roomRepository.saveRoom(
            roomId,
            client.id,
            provider,
            ydoc,
            resourceId,
        );

        return {
            roomId,
            host: this.roomRepository.getYHost(),
            resourceId,
            message: 'Создана новая комната',
        };
    }

    private generateRoomId(): string {
        return Math.random().toString(36).substring(2, 8);
    }

    async disconnect(clientId: string) {
        const roomId = this.roomRepository.getRoomIdByClientId(clientId);

        const room = this.roomRepository.getRoomById(roomId);

        await this.logicCenterService.updateFileFromYjs(room);

        room.clients.delete(clientId);

        this.roomRepository.deleteClientRoom(clientId);

        await this.saveInterimVersionsFromRedis(room);

        this.redisService.delete(roomId);

        room.provider.destroy();

        this.roomRepository.deleteRoom(room.id);
    }

    private async saveInterimVersionsFromRedis(room: RoomDTO) {
        if (room.clients.size === 0) {
            const lastInterimVersion =
                this.versionRepository.getLastInterimVersion(room.id);

            if (lastInterimVersion) {
                await this.versionService.saveVersion(room.resourceId);
            }
        }
    }
}
