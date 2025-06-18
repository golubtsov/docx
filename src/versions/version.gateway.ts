import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { VersionService } from '@/versions/version.service';
import { GatewayDefaultConnections } from '@/common/app/gateway.default.connections';
import { UseGuards } from '@nestjs/common';
import { wsPortHelper } from '@/common/app/app.environment';
import { CheckResourceIdGuard } from '@/rooms/guards/check.resource.id.guard';

@WebSocketGateway(wsPortHelper(), {
    transports: ['websocket'],
    namespace: '/versions',
})
export class VersionGateway extends GatewayDefaultConnections {
    constructor(private readonly versionService: VersionService) {
        super();
    }

    @SubscribeMessage('saveVersion')
    @UseGuards(CheckResourceIdGuard)
    async handlerSaveVersion(client: Socket, data: any) {
        data = JSON.parse(data);
        const response = await this.versionService.saveVersion(
            data.resourceId,
            data.name,
        );
        client.emit('savedVersion', response);
    }

    @SubscribeMessage('saveInterimVersion')
    @UseGuards(CheckResourceIdGuard)
    async handlerSaveInterimVersion(client: Socket, data: any) {
        data = JSON.parse(data);

        const { message, version } =
            await this.versionService.saveInterimVersion(data.resourceId);

        client.emit('savedInterimVersion', { message, version });
    }
}
