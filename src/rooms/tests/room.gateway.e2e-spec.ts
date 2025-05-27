import { INestApplication } from '@nestjs/common';
import { RoomGateway } from '@/rooms/room.gateway';
import { CreateRoomResponse } from '@/rooms/responses/create.room.response';
import { polyglot } from '@/common/lang/polyglot';
import { JoinRoomResponse } from '@/rooms/responses/join.room.response';
import { LeaveRoomResponse } from '@/rooms/responses/leave.room.response';
import { DeleteRoomResponse } from '@/rooms/responses/delete.room.response';
import { createSocket } from '@/tests/utils';
import { AppTest } from '@/tests/app.test';

const path = 'rooms';

describe('RoomGateway', () => {
    let app: INestApplication;
    let gateway: RoomGateway;
    let appTestInstance: AppTest;

    beforeAll(async () => {
        appTestInstance = await AppTest.getInstance();
        app = appTestInstance.getApp();
        gateway = appTestInstance.getRoomGateway();
    });

    afterEach(() => {
        // Очищаем все соединения после каждого теста
        appTestInstance.clearAllConnections();
    });

    afterAll(async () => {
        await app.close();
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    it('should handle connection', (done) => {
        const socket = createSocket(path);

        socket.on('connectionSuccess', (response) => {
            socket.close();
            expect(response).toHaveProperty('message');
            expect(response.message).toEqual(polyglot.t('ws_connect'));
            done();
        });
    });

    it('create room', (done) => {
        const socket = createSocket(path);

        socket.on('roomCreated', (response: CreateRoomResponse) => {
            socket.close();
            expect(response).toHaveProperty('roomId');
            expect(response).toHaveProperty('host');
            done();
        });

        socket.emit('createRoom');
    });

    it("can't create two rooms", (done) => {
        const socket = createSocket(path);

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
            done();
        });
    });

    it('join to room', (done) => {
        const socket1 = createSocket(path);
        const socket2 = createSocket(path);

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
        const socket = createSocket(path);

        socket.emit('joinRoom', 'non-existent-room');

        socket.on('guard', (response: JoinRoomResponse) => {
            socket.close();
            expect(response.success).toBeFalsy();
            expect(response.message).toEqual(
                polyglot.t('room.error.not_found'),
            );
            done();
        });
    });

    it('leave room', (done) => {
        const socket = createSocket(path);

        socket.emit('createRoom');

        socket.on('roomCreated', () => {
            socket.emit('leaveRoom');

            socket.on('roomLeft', (response: LeaveRoomResponse) => {
                socket.close();
                expect(response.success).toBeTruthy();
                expect(response.message).toEqual(polyglot.t('room.left'));
                done();
            });
            done();
        });
    });

    it('delete room', (done) => {
        const socket1 = createSocket(path);
        const socket2 = createSocket(path);

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
        const socket1 = createSocket(path);
        const socket2 = createSocket(path);

        socket1.emit('createRoom');

        socket1.on('roomCreated', (response: CreateRoomResponse) => {
            socket2.emit('joinRoom', response.roomId);

            socket2.on('roomJoined', () => {
                socket2.emit('deleteRoom', response.roomId);

                socket2.on('guard', (response: DeleteRoomResponse) => {
                    expect(response.success).toBeFalsy();
                    expect(response.message).toEqual(
                        polyglot.t('room.cant_delete_room'),
                    );
                    socket1.close();
                    socket2.close();
                    done();
                });
            });
            done();
        });
    });

    it('handle disconnect', (done) => {
        const socket1 = createSocket(path);
        const socket2 = createSocket(path);

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
        const socket = createSocket(path);

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
