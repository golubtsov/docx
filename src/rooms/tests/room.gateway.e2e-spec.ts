import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as io from 'socket.io-client';
import {RoomGateway} from "@/rooms/room.gateway";
import {RoomModule} from "@/rooms/room.module";
import {AppEnvironment} from "@/common/app.environment";

describe('RoomGateway', () => {
    let app: INestApplication;
    let gateway: RoomGateway;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [RoomModule],
        }).compile();

        app = moduleRef.createNestApplication();
        app.useWebSocketAdapter(new IoAdapter(app));
        await app.listen(AppEnvironment.getAppPort());

        gateway = moduleRef.get<RoomGateway>(RoomGateway);
    });

    afterAll(async () => {
        await app.close();
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    it('create room', (done) => {
        const socket = io.connect(
            `http://localhost:${AppEnvironment.getWsPort()}`,
            {
                reconnection: false,
                timeout: 5000
            }
        );

        socket.on('roomCreated', (response) => {
            expect(response.success).toBe(true);
            socket.disconnect();
            done();
        });

        socket.emit('createRoom');
    });
});
