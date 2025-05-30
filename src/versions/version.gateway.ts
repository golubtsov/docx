import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { VersionService } from '@/versions/version.service';
import { GatewayDefaultConnections } from '@/common/app/gateway.default.connections';
import { UseGuards } from '@nestjs/common';
import { RoomExistsGuard } from '@/rooms/guards/room.exists.guard';
import { wsPortHelper } from '@/common/app/app.environment';

@WebSocketGateway(wsPortHelper(), {
    transports: ['websocket'],
    namespace: '/versions',
})
export class VersionGateway extends GatewayDefaultConnections {
    constructor(private readonly versionService: VersionService) {
        super();
    }

    @UseGuards(RoomExistsGuard)
    @SubscribeMessage('saveVersion')
    async handlerSaveVersion(client: Socket, roomId: string) {
        const response = await this.versionService.saveVersion(roomId);
        client.emit('savedVersion', response);
    }

    @UseGuards(RoomExistsGuard)
    @SubscribeMessage('saveInterimVersion')
    async handlerSaveInterimVersion(client: Socket, roomId: string) {
        const { message, version } =
            await this.versionService.saveInterimVersion(roomId);
        client.emit('savedInterimVersion', { message, version });
    }
}
