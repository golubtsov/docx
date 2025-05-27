import { io } from 'socket.io-client';
import { AppEnvironment } from '@/common/app/app.environment';
import { ConfigService } from '@nestjs/config';

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
