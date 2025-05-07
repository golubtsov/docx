import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage
} from '@nestjs/websockets';
import {Server, Socket} from 'socket.io';
import {RoomService} from './room.service';

@WebSocketGateway(4445, {transports: ['websocket']})
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    private server: Server;

    constructor(private readonly roomService: RoomService) {
    }

    handleConnection(client: Socket) {
        const response = this.roomService.handleConnection(client.id);
        client.emit('connectionSuccess', response);
    }

    handleDisconnect(client: Socket) {
        const leaveResult = this.roomService.leaveRoom(client.id);
        if (leaveResult.success) {
            this.server.to(leaveResult.roomId).emit('userLeft', {clientId: client.id});
        }
    }

    @SubscribeMessage('createRoom')
    handleCreateRoom(client: Socket) {
        try {
            const {roomId} = this.roomService.createRoom(client.id);
            client.join(roomId);
            client.emit('roomCreated', {roomId});
        } catch (error) {
            console.log(error)
            client.emit('error', {message: 'Ошибка создания комнаты'});
        }
    }

    @SubscribeMessage('joinRoom')
    handleJoinRoom(client: Socket, roomId: string) {
        try {
            const result = this.roomService.joinRoom(client.id, roomId);
            if (result.success) {
                client.join(roomId);
                client.emit('roomJoined', {
                    roomId, message:
                    result.message,
                    count_listeners: result.count_listeners
                });
            } else {
                client.emit('joinFailed', {roomId, message: result.message});
            }
        } catch (error) {
            client.emit('joinError', {message: 'Ошибка при подключении к комнате'});
        }
    }

    @SubscribeMessage('leaveRoom')
    handleLeaveRoom(client: Socket) {
        const result = this.roomService.leaveRoom(client.id);
        if (result.success) {
            client.leave(result.roomId);
            client.emit('roomLeft', {
                roomId: result.roomId,
                success: result.success,
                message: result.message
            });
        } else {
            client.emit('roomLeft', {
                message: result.message,
                success: result.success
            });
        }
    }

    @SubscribeMessage('deleteRoom')
    handleDeleteRoom(client: Socket, roomId: string) {
        const success = this.roomService.deleteRoom(roomId);
        if (success) {
            this.server.socketsLeave(roomId);
            client.emit('roomDeletedSuccess', {roomId, message: 'Комната удалена'});
        } else {
            client.emit('deleteRoomFailed', {roomId, message: 'Не получилось удалить комнату'});
        }
    }

    @SubscribeMessage('getDocument')
    handleGetDocument(client: Socket) {
        const doc = this.roomService.getDocument(client.id);
        if (doc) {
            client.emit('documentData', {doc: {'text': 'lalal'}});
        } else {
            client.emit('error', {message: 'No document available. Join a room first.'});
        }
    }
}