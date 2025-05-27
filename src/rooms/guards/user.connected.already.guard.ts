import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RoomRepository } from '@/rooms/room.repository';
import { Socket } from 'socket.io';
import { polyglot } from '@/common/lang/polyglot';

@Injectable()
export class UserConnectedAlreadyGuard implements CanActivate {
    constructor(private roomRepository: RoomRepository) {}

    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const client: Socket = context.switchToWs().getClient();

        if (this.roomRepository.isClientInRoom(client.id)) {
            client.emit('guard', {
                success: true,
                message: polyglot.t('room.connected_already'),
            });
            return false;
        }

        return true;
    }
}
