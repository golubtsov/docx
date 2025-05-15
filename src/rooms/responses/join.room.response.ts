import { RoomDTO } from '@/rooms/dto/room.dto';

export interface JoinRoomResponse {
    success: boolean;
    room?: RoomDTO;
    message?: string;
}
