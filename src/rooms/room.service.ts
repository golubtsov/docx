import { polyglot } from '@/common/lang/polyglot';
import { Injectable } from '@nestjs/common';
import { RoomManager } from '@/rooms/room.manager';
import { CreateRoomResponse } from '@/rooms/responses/create.room.response';
import { JoinRoomResponse } from '@/rooms/responses/join.room.response';
import { DeleteRoomResponse } from '@/rooms/responses/delete.room.response';
import { LeaveRoomResponse } from '@/rooms/responses/leave.room.response';

@Injectable()
export class RoomService {
    constructor(private readonly roomManager: RoomManager) {}

    handleConnection() {
        return {
            message: polyglot.t('ws_connect'),
        };
    }

    async createRoom(clientId: string): Promise<CreateRoomResponse> {
        return this.roomManager.createRoom(clientId);
    }

    joinRoom(clientId: string, roomId: string): JoinRoomResponse {
        return this.roomManager.joinRoom(clientId, roomId);
    }

    leaveRoom(clientId: string): LeaveRoomResponse {
        return this.roomManager.leaveRoom(clientId);
    }

    deleteRoom(roomId: string, clientId: string): DeleteRoomResponse {
        return this.roomManager.deleteRoom(roomId, clientId);
    }
}
