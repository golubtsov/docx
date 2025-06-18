import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { LogicCenterService } from '@/common/api/logic.center.service';
import { Socket } from 'socket.io';
import { RoomRepository } from '@/rooms/room.repository';

@Injectable()
export class CheckFileIdGuard implements CanActivate {
    constructor(
        private readonly logicCenterService: LogicCenterService,
        private readonly roomRepository: RoomRepository,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const client: Socket = context.switchToWs().getClient();

        try {
            const data = JSON.parse(context.switchToWs().getData());

            if (!data?.fileId) {
                client.emit('guard', {
                    message: 'Поле fileId не указано',
                });
                return false;
            }

            const fileInfo = await this.logicCenterService.getFileInfo(
                data?.fileId,
            );

            if (fileInfo?.status === false) {
                client.emit('guard', fileInfo);
                return false;
            }

            const room = this.roomRepository.isDocumentSavedInRoom(fileInfo.id);

            if (!room) {
                client.emit('guard', {
                    status: false,
                    message: 'Документ не открыт в комнате',
                });
                return false;
            }

            return true;
        } catch (err) {
            client.emit('guard', {
                status: false,
                message:
                    'Ошибка при проверки body, возможно передан некорректный JSON',
            });
            return false;
        }
    }
}
