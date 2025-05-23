import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { VersionService } from '@/versions/version.service';
import { GatewayDefaultConnections } from '@/common/app/gateway.default.connections';

@WebSocketGateway(Number(process.env.WS_PORT), {
    transports: ['websocket'],
    namespace: '/versions',
})
export class VersionGateway extends GatewayDefaultConnections {
    constructor(private readonly versionService: VersionService) {
        super();
    }

    @SubscribeMessage('saveVersion')
    handlerSaveVersion(client: Socket, roomId: string) {
        this.versionService.saveVersion(roomId);
    }

    @SubscribeMessage('saveInterimVersion')
    handlerSaveInterimVersion(client: Socket, roomId: string) {
        this.versionService.saveInterimVersion(roomId);
    }
}
