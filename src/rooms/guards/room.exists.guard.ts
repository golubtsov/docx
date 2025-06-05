import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
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
        const client: Socket = context.switchToWs().getClient();
        try {
            const data = JSON.parse(context.switchToWs().getData());

            if (!this.roomRepository.roomExists(data.roomId)) {
                client.emit('guard', {
                    success: false,
                    message: polyglot.t('room.error.not_found'),
                });
                return false;
            }
            return true;
        } catch (error) {
            client.emit('guard', {
                success: false,
                message: 'В поле message передан не json',
            });
            return false;
        }
    }
}
