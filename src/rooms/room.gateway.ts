import {
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomService } from './room.service';
import { polyglot } from '@/common/lang/polyglot';
import { GatewayDefaultConnections } from '@/common/app/gateway.default.connections';
import { UseGuards } from '@nestjs/common';
import { RoomExistsGuard } from '@/rooms/guards/room.exists.guard';
import { ClientAlreadyInRoomGuard } from '@/rooms/guards/client.already.in.room.guard';
import { UserConnectedAlreadyGuard } from '@/rooms/guards/user.connected.already.guard';
import { CantDeleteRoomGuard } from '@/rooms/guards/cant.delete.room.guard';
import { UserNotHaveRoomsGuard } from '@/rooms/guards/user.not.have.rooms.guard';

// Используется process, потому что AppEnvironment не может быть здесь использован.
// В остальных случаях, внутри классов, лучше использовать обертку AppEnvironment,
// Через внедрение AppEnvironment в constructor
@WebSocketGateway(Number(process.env.WS_PORT), {
    transports: ['websocket'],
    namespace: '/rooms',
})
export class RoomGateway extends GatewayDefaultConnections {
    @WebSocketServer()
    private server: Server;

    constructor(private readonly roomService: RoomService) {
        super();
    }

    handleDisconnect(client: Socket) {
        const leaveResult = this.roomService.leaveRoom(client.id);
        if (leaveResult.success) {
            this.server
                .to(leaveResult.roomId)
                .emit('userLeft', { clientId: client.id });
        }
    }

    @UseGuards(ClientAlreadyInRoomGuard)
    @SubscribeMessage('createRoom')
    async handleCreateRoom(client: Socket) {
        try {
            const createRoomResponse = await this.roomService.createRoom(
                client.id,
            );
            client.join(createRoomResponse.roomId);
            client.emit('roomCreated', createRoomResponse);
        } catch (error: any) {
            console.log(error);
            client.emit('error', { message: polyglot.t('room.error.create') });
        }
    }

    @UseGuards(RoomExistsGuard, UserConnectedAlreadyGuard)
    @SubscribeMessage('joinRoom')
    handleJoinRoom(client: Socket, roomId: string) {
        try {
            const result = this.roomService.joinRoom(client.id, roomId);

            if (result.success) {
                if (!client.rooms.has(roomId)) {
                    client.join(roomId);
                }

                client.emit('roomJoined', {
                    message: result.message,
                    room: {
                        id: result.room.id,
                        owner_id: result.room.owner_id,
                        listeners: result.room.clients.size,
                    },
                });
            } else {
                client.emit('joinFailed', {
                    message: result.message,
                    success: false,
                });
            }
        } catch (error: any) {
            console.error('Join room error:', error.message);
            client.emit('joinError', {
                message: polyglot.t('room.error.join'),
            });
        }
    }

    @UseGuards(RoomExistsGuard, UserNotHaveRoomsGuard)
    @SubscribeMessage('leaveRoom')
    handleLeaveRoom(client: Socket) {
        const response = this.roomService.leaveRoom(client.id);
        if (response.success) {
            client.leave(response.roomId);
            client.emit('roomLeft', response);
        } else {
            client.emit('roomLeft', response);
        }
    }

    @UseGuards(RoomExistsGuard, CantDeleteRoomGuard)
    @SubscribeMessage('deleteRoom')
    handleDeleteRoom(client: Socket, roomId: string) {
        const response = this.roomService.deleteRoom(roomId, client.id);
        if (response.success) {
            this.server.socketsLeave(roomId);
            client.emit('roomDeletedSuccess', response);
        } else {
            client.emit('deleteRoomFailed', response);
        }
    }
}
