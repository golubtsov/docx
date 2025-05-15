import {Test} from '@nestjs/testing';
import {INestApplication} from '@nestjs/common';
import {IoAdapter} from '@nestjs/platform-socket.io';
import {io} from "socket.io-client";
import {RoomGateway} from "@/rooms/room.gateway";
import {RoomModule} from "@/rooms/room.module";
import {AppEnvironment} from "@/common/app/app.environment";
import {CreateRoomResponse} from "@/rooms/responses/create.room.response";

describe('RoomGateway', () => {
    const socket = io(`ws://localhost:${AppEnvironment.getWsPort()}`, {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 5000,
    });

    let app: INestApplication;
    let gateway: RoomGateway;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [RoomModule],
        }).compile();

        app = moduleRef.createNestApplication();
        app.useWebSocketAdapter(new IoAdapter(app));
        await app.init();
        await app.listen(AppEnvironment.getAppPort());

        gateway = moduleRef.get<RoomGateway>(RoomGateway);
    }, 10000);

    afterEach(() => {});

    afterAll(async () => {
        await app.close();
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    it('create room', (done) => {
        socket.on("roomCreated", (response: CreateRoomResponse) => {
            socket.disconnect()
            expect(response).toHaveProperty('roomId')
            expect(response).toHaveProperty('host')
            done();
        });

        socket.emit('createRoom');

        socket.on('error', (err) => {
            console.log('error', err)
            done(err);
        });
    }, 10000);
});