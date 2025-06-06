import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { RoomService } from './room.service';
import { polyglot } from '@/common/lang/polyglot';
import { GatewayDefaultConnections } from '@/common/app/gateway.default.connections';
import { UseGuards } from '@nestjs/common';
import { RoomExistsGuard } from '@/rooms/guards/room.exists.guard';
import { ClientAlreadyInRoomGuard } from '@/rooms/guards/client.already.in.room.guard';
import { UserConnectedAlreadyGuard } from '@/rooms/guards/user.connected.already.guard';
import { CantDeleteRoomGuard } from '@/rooms/guards/cant.delete.room.guard';
import { UserNotHaveRoomsGuard } from '@/rooms/guards/user.not.have.rooms.guard';
import { AppEnvironment, wsPortHelper } from '@/common/app/app.environment';
import { AppStateEnum } from '@/common/app/app.state.enum';
import { CheckFileIdGuard } from '@/rooms/guards/check.file.id.guard';

@WebSocketGateway(wsPortHelper(), {
    transports: ['websocket'],
    namespace: '/rooms',
})
export class RoomGateway extends GatewayDefaultConnections {
    constructor(
        private readonly roomService: RoomService,
        private appEnv: AppEnvironment,
    ) {
        super();
    }

    handleDisconnect(client: Socket) {
        if (this.appEnv.getNodeEnv() !== AppStateEnum.Jest) {
            const leaveResult = this.roomService.leaveRoom(client.id);
            if (leaveResult.success) {
                this.server
                    .to(leaveResult.roomId)
                    .emit('userLeft', { clientId: client.id });
            }
        }
    }

    @UseGuards(ClientAlreadyInRoomGuard, CheckFileIdGuard)
    @SubscribeMessage('createRoom')
    async handleCreateRoom(client: Socket, data: string) {
        try {
            const fileId = JSON.parse(data).fileId;
            const createRoomResponse = await this.roomService.createRoom(
                client.id,
                fileId,
            );
            client.join(createRoomResponse.roomId);
            client.emit('roomCreated', createRoomResponse);
        } catch (error: any) {
            if (this.appEnv.getNodeEnv() !== AppStateEnum.Jest) {
                console.log(error);
            }
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
