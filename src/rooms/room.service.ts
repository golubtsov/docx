import { polyglot } from '@/common/lang/polyglot';
import { Injectable } from '@nestjs/common';
import { RoomRepository } from '@/rooms/room.repository';
import { CreateRoomResponse } from '@/rooms/responses/create.room.response';
import { JoinRoomResponse } from '@/rooms/responses/join.room.response';
import { DeleteRoomResponse } from '@/rooms/responses/delete.room.response';
import { LeaveRoomResponse } from '@/rooms/responses/leave.room.response';
import { RedisService } from '@/common/app/redis.service';
import { AppStateEnum } from '@/common/app/app.state.enum';
import { AppEnvironment } from '@/common/app/app.environment';
import { YDocInitializerService } from '@/common/yjs/ydoc.initializer.service';

@Injectable()
export class RoomService {
    constructor(
        private readonly roomRepository: RoomRepository,
        private readonly redisService: RedisService,
        private readonly appEnv: AppEnvironment,
        private readonly yDocInitializer: YDocInitializerService,
    ) {}

    async createRoom(
        clientId: string,
        fileId: string,
    ): Promise<CreateRoomResponse> {
        const roomId = this.generateRoomId();
        const { ydoc, provider } =
            await this.yDocInitializer.createYDocWithProvider(roomId, fileId);

        this.roomRepository.saveRoom(roomId, clientId, provider, ydoc, fileId);

        return {
            roomId,
            host: this.roomRepository.getYHost(),
            fileId,
        };
    }

    private generateRoomId(): string {
        if (this.appEnv.getNodeEnv() === AppStateEnum.Development) {
            return '1111'; // для тестирования
        }
        return Math.random().toString(36).substring(2, 8);
    }

    joinRoom(clientId: string, roomId: string): JoinRoomResponse {
        const room = this.roomRepository.getRoom(roomId);

        room.clients.add(clientId);

        this.roomRepository.joinRoom(clientId, roomId);

        return {
            success: true,
            message: polyglot.t('room.connected'),
            room: room,
        };
    }

    leaveRoom(clientId: string): LeaveRoomResponse {
        const roomId = this.roomRepository.leaveRoom(clientId);

        return { success: true, roomId, message: polyglot.t('room.left') };
    }

    deleteRoom(roomId: string, clientId: string): DeleteRoomResponse {
        const room = this.roomRepository.getRoom(roomId);

        room.provider.destroy();

        room.clients.forEach(() =>
            this.roomRepository.deleteClientRooms(clientId),
        );

        this.redisService.delete(roomId);

        this.roomRepository.deleteRoom(roomId);

        return {
            success: true,
            message: polyglot.t('room.deleted'),
        };
    }
}
