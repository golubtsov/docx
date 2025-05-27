import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RoomRepository } from '@/rooms/room.repository';
import { Socket } from 'socket.io';
import { polyglot } from '@/common/lang/polyglot';

@Injectable()
export class UserNotHaveRoomsGuard implements CanActivate {
    constructor(private roomRepository: RoomRepository) {}

    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const client: Socket = context.switchToWs().getClient();
        const roomId = context.switchToWs().getData();

        if (!roomId) {
            client.emit('guard', {
                success: false,
                roomId,
                message: polyglot.t('room.user_not_have_rooms'),
            });
            return false;
        }

        return true;
    }
}
