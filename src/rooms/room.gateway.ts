import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer
} from '@nestjs/websockets';
import {Server, Socket} from 'socket.io';
import {RoomService} from './room.service';
import {AppEnvironment} from "@/common/app/app.environment";


@WebSocketGateway(AppEnvironment.getWsPort(), {transports: ['websocket']})
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    private server: Server;

    constructor(private readonly roomService: RoomService) {
    }

    handleConnection(client: Socket) {
        const response = this.roomService.handleConnection();
        client.emit('connectionSuccess', response);
    }

    handleDisconnect(client: Socket) {
        const leaveResult = this.roomService.leaveRoom(client.id);
        if (leaveResult.success) {
            this.server.to(leaveResult.roomId).emit('userLeft', {clientId: client.id});
        }
    }

    @SubscribeMessage('createRoom')
    async handleCreateRoom(client: Socket) {
        try {
            const createRoomResponse = await this.roomService.createRoom(client.id);
            client.join(createRoomResponse.roomId);
            client.emit('roomCreated', createRoomResponse);
        } catch (error: any) {
            console.log(error)
            client.emit('error', {message: 'Ошибка создания комнаты'});
        }
    }

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
                        // document: result.room.doc.getArray()
                    }
                });
            } else {
                client.emit('joinFailed', {
                    message: result.message,
                    success: false
                });
            }
        } catch (error: any) {
            console.error('Join room error:', error.message);
            client.emit('joinError', {
                message: 'Ошибка при подключении к комнате'
            });
        }
    }

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
