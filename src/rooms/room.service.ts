import {Injectable} from "@nestjs/common";
import {RoomManager} from "@/rooms/room.manager";
import {CreateRoomResponse} from "@/rooms/responses/create.room.response";
import {JoinRoomResponse} from "@/rooms/responses/join.room.response";

@Injectable()
export class RoomService {

    constructor(private readonly roomManager: RoomManager) {}

    handleConnection() {
        return {
            message: 'Successfully connected. Use createRoom or joinRoom commands.'
        };
    }

    async createRoom(clientId: string): Promise<CreateRoomResponse> {
        return this.roomManager.createRoom(clientId);
    }

    joinRoom(clientId: string, roomId: string): JoinRoomResponse {
        return this.roomManager.joinRoom(clientId, roomId);
    }

    leaveRoom(clientId: string): { success: boolean; roomId?: string, message?: string } {
        return this.roomManager.leaveRoom(clientId);
    }

    deleteRoom(roomId: string): boolean {
        return this.roomManager.deleteRoom(roomId);
    }
}