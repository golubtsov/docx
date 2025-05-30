import { polyglot } from '@/common/lang/polyglot';
import { Injectable } from '@nestjs/common';
import { RoomRepository } from '@/rooms/room.repository';
import { CreateRoomResponse } from '@/rooms/responses/create.room.response';
import { JoinRoomResponse } from '@/rooms/responses/join.room.response';
import { DeleteRoomResponse } from '@/rooms/responses/delete.room.response';
import { LeaveRoomResponse } from '@/rooms/responses/leave.room.response';
import { RedisService } from '@/common/app/redis.service';

@Injectable()
export class RoomService {
    constructor(
        private readonly roomRepository: RoomRepository,
        private readonly redisService: RedisService,
    ) {}

    async createRoom(clientId: string): Promise<CreateRoomResponse> {
        return this.roomRepository.createRoom(clientId);
    }

    joinRoom(clientId: string, roomId: string): JoinRoomResponse {
        return this.roomRepository.joinRoom(clientId, roomId);
    }

    leaveRoom(clientId: string): LeaveRoomResponse {
        return this.roomRepository.leaveRoom(clientId);
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
