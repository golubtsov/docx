import { io } from 'socket.io-client';
import { AppEnvironment } from '@/common/app/app.environment';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { RoomGateway } from '@/rooms/room.gateway';
import { Test } from '@nestjs/testing';
import { AppEnvironmentModule } from '@/common/app/app.environment.module';
import { RoomModule } from '@/rooms/room.module';
import { IoAdapter } from '@nestjs/platform-socket.io';

/**
 * @example
 *      const socket = createSocket('rooms/id');
 */
export function createSocket(path: string) {
    const appEnv = new AppEnvironment(new ConfigService());

    const socket = io(`ws://localhost:${appEnv.getWsPort()}/${path}`, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 5000,
        autoConnect: true,
        forceNew: true,
    });

    socket.on('connect_error', (err) => {
        console.error('Connection error:', err.message);
    });

    return socket;
}
