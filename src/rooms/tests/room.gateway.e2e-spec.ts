import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { io } from 'socket.io-client';
import { RoomGateway } from '@/rooms/room.gateway';
import { RoomModule } from '@/rooms/room.module';
import { AppEnvironment } from '@/common/app/app.environment';
import { CreateRoomResponse } from '@/rooms/responses/create.room.response';
import { polyglot } from '@/common/lang/polyglot';
import { JoinRoomResponse } from '@/rooms/responses/join.room.response';
import { LeaveRoomResponse } from '@/rooms/responses/leave.room.response';
import { DeleteRoomResponse } from '@/rooms/responses/delete.room.response';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppEnvironmentModule } from '@/common/app/app.environment.module';

const appEnv = new AppEnvironment(new ConfigService());

function createSocket() {
    return io(`ws://localhost:${appEnv.getWsPort()}`, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 5000,
    });
}

describe('RoomGateway', () => {
    let app: INestApplication;
    let gateway: RoomGateway;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [
                await ConfigModule.forRoot({ isGlobal: true }),
                AppEnvironmentModule,
                RoomModule,
            ],
        }).compile();

        app = moduleRef.createNestApplication();
        app.useWebSocketAdapter(new IoAdapter(app));
        await app.init();
        await app.listen(appEnv.getAppPort());

        gateway = moduleRef.get<RoomGateway>(RoomGateway);
    });

    afterEach(() => {
        // Очищаем все соединения после каждого теста
        gateway['server'].disconnectSockets(true);
    });

    afterAll(async () => {
        await app.close();
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    it('should handle connection', (done) => {
        const socket = createSocket();

        socket.on('connectionSuccess', (response) => {
            socket.close();
            expect(response).toHaveProperty('message');
            expect(response.message).toEqual(polyglot.t('ws_connect'));
            done();
        });
    });

    it('create room', (done) => {
        const socket = createSocket();

        socket.on('roomCreated', (response: CreateRoomResponse) => {
            socket.close();
            expect(response).toHaveProperty('roomId');
            expect(response).toHaveProperty('host');
            done();
        });

        socket.emit('createRoom');
    });

    it("can't create two rooms", (done) => {
        const socket = createSocket();

        socket.emit('createRoom');

        socket.on('roomCreated', () => {
            socket.emit('createRoom');

            socket.on('roomCreated', (response: CreateRoomResponse) => {
                socket.close();
                expect(response.message).toEqual(
                    polyglot.t('room.error.multiple'),
                );
                done();
            });
        });
    });

    it('join to room', (done) => {
        const socket1 = createSocket();
        const socket2 = createSocket();

        socket1.emit('createRoom');

        socket1.on('roomCreated', (response: CreateRoomResponse) => {
            expect(response).toHaveProperty('roomId');

            socket2.emit('joinRoom', response.roomId);

            socket2.on('roomJoined', (response: JoinRoomResponse) => {
                expect(response.success).toBeTruthy();
                expect(response.message).toEqual(polyglot.t('room.connected'));
                expect(response.room).toBeDefined();
                socket1.close();
                socket2.close();
                done();
            });
            done();
        });
    });

    it('join to non-existent room', (done) => {
        const socket = createSocket();

        socket.emit('joinRoom', 'non-existent-room');

        socket.on('joinFailed', (response: JoinRoomResponse) => {
            socket.close();
            expect(response.success).toBeFalsy();
            expect(response.message).toEqual(
                polyglot.t('room.error.not_found'),
            );
            done();
        });
    });

    it('leave room', (done) => {
        const socket = createSocket();

        socket.emit('createRoom');

        socket.on('roomCreated', (response: CreateRoomResponse) => {
            socket.emit('leaveRoom');

            socket.on('roomLeft', (response: LeaveRoomResponse) => {
                socket.close();
                expect(response.success).toBeTruthy();
                expect(response.message).toEqual(polyglot.t('room.left'));
                done();
            });
        });
    });

    it('delete room', (done) => {
        const socket1 = createSocket();
        const socket2 = createSocket();

        socket1.emit('createRoom');

        socket1.on('roomCreated', (response: CreateRoomResponse) => {
            socket2.emit('joinRoom', response.roomId);

            socket2.on('roomJoined', () => {
                socket1.emit('deleteRoom', response.roomId);

                socket1.on(
                    'roomDeletedSuccess',
                    (response: DeleteRoomResponse) => {
                        expect(response.success).toBeTruthy();
                        expect(response.message).toEqual(
                            polyglot.t('room.deleted'),
                        );

                        socket2.on('userLeft', (data) => {
                            expect(data.clientId).toEqual(socket1.id);
                            socket1.close();
                            socket2.close();
                            done();
                        });
                    },
                );
                done();
            });
            done();
        });
    });

    it('non-owner cannot delete room', (done) => {
        const socket1 = createSocket();
        const socket2 = createSocket();

        socket1.emit('createRoom');

        socket1.on('roomCreated', (response: CreateRoomResponse) => {
            socket2.emit('joinRoom', response.roomId);

            socket2.on('roomJoined', () => {
                socket2.emit('deleteRoom', response.roomId);

                socket2.on(
                    'deleteRoomFailed',
                    (response: DeleteRoomResponse) => {
                        expect(response.success).toBeFalsy();
                        expect(response.message).toEqual(
                            polyglot.t('room.cant_delete_room'),
                        );
                        socket1.close();
                        socket2.close();
                        done();
                    },
                );
            });
        });
    });

    it('handle disconnect', (done) => {
        const socket1 = createSocket();
        const socket2 = createSocket();

        socket1.emit('createRoom');

        socket1.on('roomCreated', (response: CreateRoomResponse) => {
            socket2.emit('joinRoom', response.roomId);

            socket2.on('roomJoined', () => {
                socket1.on('userLeft', (data) => {
                    expect(data.clientId).toEqual(socket2.id);
                    socket1.close();
                    done();
                });

                socket2.disconnect();
                done();
            });
            done();
        });
    });

    it('handle connection error on create room', (done) => {
        const socket = createSocket();

        // Временно подменяем метод для эмуляции ошибки
        const originalMethod =
            gateway['roomService']['roomManager']['createRoom'];
        gateway['roomService']['roomManager']['createRoom'] = async () => {
            throw new Error('Test error');
        };

        socket.emit('createRoom');

        socket.on('error', (response) => {
            expect(response.message).toEqual(polyglot.t('room.error.create'));

            // Восстанавливаем оригинальный метод
            gateway['roomService']['roomManager']['createRoom'] =
                originalMethod;
            socket.close();
            done();
        });
    });
});
