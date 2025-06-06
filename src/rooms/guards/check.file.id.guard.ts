import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { LogicCenterService } from '@/common/api/logic.center.service';
import { Socket } from 'socket.io';

@Injectable()
export class CheckFileIdGuard implements CanActivate {
    constructor(private readonly logicCenterService: LogicCenterService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const client: Socket = context.switchToWs().getClient();

        try {
            const data = JSON.parse(context.switchToWs().getData());

            const fileInfo = await this.logicCenterService.getFileInfo(
                data?.fileId,
            );

            if (fileInfo?.status === false) {
                client.emit('guard', fileInfo);
                return false;
            }

            return true;
        } catch (err) {
            client.emit('guard', {
                status: false,
                message:
                    'Ошибка при проверки комнаты, возможно передан некорректный JSON',
            });
            return false;
        }
    }
}
