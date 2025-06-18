import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { RoomService } from './room.service';
import { polyglot } from '@/common/lang/polyglot';
import { GatewayDefaultConnections } from '@/common/app/gateway.default.connections';
import { UseGuards } from '@nestjs/common';
import { wsPortHelper } from '@/common/app/app.environment';
import { CheckFileIdGuard } from '@/rooms/guards/check.file.id.guard';

@WebSocketGateway(wsPortHelper(), {
    transports: ['websocket'],
    namespace: '/rooms',
})
export class RoomGateway extends GatewayDefaultConnections {
    constructor(private readonly roomService: RoomService) {
        super();
    }

    async handleDisconnect(client: Socket) {
        await this.roomService.disconnect(client.id);
    }

    @UseGuards(CheckFileIdGuard)
    @SubscribeMessage('joinRoom')
    async handleJoinRoom(client: Socket, data: any) {
        try {
            const json = JSON.parse(data);

            const result = await this.roomService.joinRoomNew(
                client,
                json.resourceId,
            );

            client.emit('roomJoined', result);
        } catch (error: any) {
            console.error('Join room error:', error.message);
            client.emit('joinError', {
                message: polyglot.t('room.error.join'),
            });
        }
    }
}
