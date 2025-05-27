import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { polyglot } from '@/common/lang/polyglot';

export abstract class GatewayDefaultConnections
    implements OnGatewayConnection, OnGatewayDisconnect
{
    handleConnection(client: Socket) {
        client.emit('connectionSuccess', {
            message: polyglot.t('ws_connect'),
        });
    }

    handleDisconnect(client: Socket) {}
}
