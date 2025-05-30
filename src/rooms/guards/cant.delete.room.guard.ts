import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RoomRepository } from '@/rooms/room.repository';
import { Socket } from 'socket.io';
import { polyglot } from '@/common/lang/polyglot';

@Injectable()
export class CantDeleteRoomGuard implements CanActivate {
    constructor(private roomRepository: RoomRepository) {}

    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const client: Socket = context.switchToWs().getClient();
        const roomId = context.switchToWs().getData();
        const room = this.roomRepository.getRoom(roomId);

        console.log(room.owner_id !== client.id);

        if (room.owner_id !== client.id) {
            client.emit('guard', {
                success: false,
                message: polyglot.t('room.cant_delete_room'),
            });
            return false;
        }

        return true;
    }
}
