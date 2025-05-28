import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { polyglot } from '@/common/lang/polyglot';

export abstract class GatewayDefaultConnections
    implements OnGatewayConnection, OnGatewayDisconnect
{
    @WebSocketServer()
    protected server: Server;

    handleConnection(client: Socket) {
        client.emit('connectionSuccess', {
            message: polyglot.t('ws_connect'),
        });
    }

    handleDisconnect(client: Socket) {}
}
