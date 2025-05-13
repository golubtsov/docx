import {Test} from '@nestjs/testing';
import {INestApplication} from '@nestjs/common';
import {IoAdapter} from '@nestjs/platform-socket.io';
import {Server} from 'socket.io';
import {RoomService} from "../room.service";
import {RoomGateway} from "../room.gateway";
import {io, Socket} from 'socket.io-client';

describe('Room Integration Tests', () => {
    let app: INestApplication;
    let ioServer: Server;
    let gateway: RoomGateway;
    let service: RoomService;
    let clientSockets: Socket[] = [];
    const PORT = 4445;
    const WS_URL = `ws://localhost:${PORT}`;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [RoomGateway, RoomService],
        }).compile();

        app = moduleRef.createNestApplication();
        app.useWebSocketAdapter(new IoAdapter(app));
        await app.init();
        await app.listen(3001);

        gateway = moduleRef.get<RoomGateway>(RoomGateway);
        service = moduleRef.get<RoomService>(RoomService);
        ioServer = gateway['server'];
    });

    afterAll(async () => {
        await app.close();
        clientSockets.forEach(socket => socket.close());
    });

    afterEach(() => {
        service['rooms'].clear();
        service['clientRooms'].clear();
        clientSockets = [];
    });

    function createClient(): Promise<Socket> {
        return new Promise((resolve) => {
            const socket = io(WS_URL, {
                transports: ['websocket'],
                reconnection: false,
            });

            socket.on('connect', () => {
                clientSockets.push(socket);
                resolve(socket);
            });
        });
    }

    function waitForEvent(socket: Socket, event: string): Promise<any> {
        return new Promise((resolve) => {
            socket.once(event, (data) => resolve(data));
        });
    }

    describe('Connection', () => {
        it('should successfully connect client', async () => {
            const client = await createClient();
            const response = await waitForEvent(client, 'connectionSuccess');
            expect(response.message).toContain('Successfully connected');
            client.close();
        });
    });

    describe('Room Creation', () => {
        it('should create a new room', async () => {
            const client = await createClient();
            client.emit('createRoom');
            const response = await waitForEvent(client, 'roomCreated');
            expect(response.roomId).toBeDefined();
            expect(service['rooms'].has(response.roomId)).toBe(true);
            client.close();
        });

        it('should not allow client to create multiple rooms', async () => {
            const client = await createClient();
            client.emit('createRoom');
            await waitForEvent(client, 'roomCreated');

            client.emit('createRoom');
            const error = await waitForEvent(client, 'error');
            expect(error.message).toContain('Ошибка создания комнаты');
            client.close();
        });
    });

    describe('Room Joining', () => {
        it('should allow client to join existing room', async () => {
            const owner = await createClient();
            owner.emit('createRoom');
            const {roomId} = await waitForEvent(owner, 'roomCreated');

            const client = await createClient();
            client.emit('joinRoom', roomId);
            const response = await waitForEvent(client, 'roomJoined');

            expect(response.roomId).toBe(roomId);
            expect(response.count_listeners).toBe(2);
            client.close();
            owner.close();
        });

        it('should not allow client to join non-existent room', async () => {
            const client = await createClient();
            client.emit('joinRoom', 'non-existent-room');
            const response = await waitForEvent(client, 'joinFailed');
            expect(response.message).toContain('Комната не найдена');
            client.close();
        });

        it('should return success if client already in room', async () => {
            const client = await createClient();
            client.emit('createRoom');
            const {roomId} = await waitForEvent(client, 'roomCreated');

            client.emit('joinRoom', roomId);
            const response = await waitForEvent(client, 'roomJoined');
            expect(response.message).toContain('Вы уже подключены к данной комнате');
            client.close();
        });
    });

    describe('Room Leaving', () => {
        it('should allow client to leave room', async () => {
            const client = await createClient();
            client.emit('createRoom');
            const {roomId} = await waitForEvent(client, 'roomCreated');

            client.emit('leaveRoom');
            const response = await waitForEvent(client, 'roomLeft');
            expect(response.success).toBe(true);
            expect(response.roomId).toBe(roomId);
            client.close();
        });

        it('should notify other clients when user leaves', async () => {
            const owner = await createClient();
            owner.emit('createRoom');
            const {roomId} = await waitForEvent(owner, 'roomCreated');

            const client = await createClient();
            client.emit('joinRoom', roomId);
            await waitForEvent(client, 'roomJoined');

            const leavePromise = waitForEvent(owner, 'userLeft');
            client.emit('leaveRoom');
            const leaveResponse = await leavePromise;

            expect(leaveResponse.clientId).toBe(client.id);
            owner.close();
            client.close();
        });

        it('should handle leave when not in room', async () => {
            const client = await createClient();
            client.emit('leaveRoom');
            const response = await waitForEvent(client, 'roomLeft');
            expect(response.success).toBe(false);
            client.close();
        });
    });

    describe('Room Deletion', () => {
        it('should allow owner to delete room', async () => {
            const client = await createClient();
            client.emit('createRoom');
            const {roomId} = await waitForEvent(client, 'roomCreated');

            client.emit('deleteRoom', roomId);
            const response = await waitForEvent(client, 'roomDeletedSuccess');
            expect(response.roomId).toBe(roomId);
            expect(service['rooms'].has(roomId)).toBe(false);
            client.close();
        });

        it('should not allow to delete non-existent room', async () => {
            const client = await createClient();
            client.emit('deleteRoom', 'non-existent-room');
            const response = await waitForEvent(client, 'deleteRoomFailed');
            expect(response.message).toContain('Не получилось удалить комнату');
            client.close();
        });
    });

    describe('Document Access', () => {
        it('should return document for room member', async () => {
            const client = await createClient();
            client.emit('createRoom');
            await waitForEvent(client, 'roomCreated');

            client.emit('getDocument');
            const response = await waitForEvent(client, 'documentData');
            expect(response.doc).toBeDefined();
            client.close();
        });

        it('should return error when no document available', async () => {
            const client = await createClient();
            client.emit('getDocument');
            const response = await waitForEvent(client, 'error');
            expect(response.message).toContain('Join a room first');
            client.close();
        });
    });

    describe('Room Cleanup', () => {
        it('should automatically cleanup empty rooms', async () => {
            const client = await createClient();
            client.emit('createRoom');
            const {roomId} = await waitForEvent(client, 'roomCreated');

            client.emit('leaveRoom');
            await waitForEvent(client, 'roomLeft');

            expect(service['rooms'].has(roomId)).toBe(true);

            jest.useFakeTimers();
            jest.advanceTimersByTime(60 * 60 * 1000 + 1);
            expect(service['rooms'].has(roomId)).toBe(false);
            jest.useRealTimers();

            client.close();
        });
    });
});