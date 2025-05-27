import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RoomRepository } from '@/rooms/room.repository';
import { Socket } from 'socket.io';
import { polyglot } from '@/common/lang/polyglot';

@Injectable()
export class RoomExistsGuard implements CanActivate {
    constructor(private roomRepository: RoomRepository) {}

    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const roomId = context.switchToWs().getData();

        if (!this.roomRepository.roomExists(roomId)) {
            const client: Socket = context.switchToWs().getClient();
            client.emit('guard', {
                success: false,
                message: polyglot.t('room.error.not_found'),
            });
            return false;
        }

        return true;
    }
}
