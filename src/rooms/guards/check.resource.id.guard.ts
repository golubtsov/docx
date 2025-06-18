import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { LogicCenterService } from '@/common/api/logic.center.service';
import { Socket } from 'socket.io';

@Injectable()
export class CheckResourceIdGuard implements CanActivate {
    constructor(private readonly logicCenterService: LogicCenterService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const client: Socket = context.switchToWs().getClient();

        try {
            const data = JSON.parse(context.switchToWs().getData());

            if (!data?.resourceId) {
                client.emit('guard', {
                    message: 'Поле resourceId не указано',
                });
                return false;
            }

            const resourceInfo = await this.logicCenterService.getResourceInfo(
                data?.resourceId,
            );

            if (resourceInfo?.status === false) {
                client.emit('guard', resourceInfo);
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
