import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppStateEnum } from '@/common/app/app.state.enum';

export function wsPortHelper(): number {
    const environment = new AppEnvironment(new ConfigService());
    return Number(environment.getWsPort());
}

/**
 * При извлечении snapshot из Redis, snapshot не представляет собой Uint8Array,
 * функция создает Uint8Array из snapshot, который был получен из Redis
 * @param snapshot
 */
export function generateUint8Array(snapshot: object) {
    const length = Object.keys(snapshot).reduce(
        (max, key) => Math.max(max, parseInt(key, 10) + 1),
        0,
    );

    const uint8Array = new Uint8Array(length);
    Object.entries(snapshot).forEach(([key, value]) => {
        uint8Array[parseInt(key, 10)] = value;
    });

    return uint8Array;
}

export function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

@Injectable()
export class AppEnvironment {
    constructor(private readonly configService: ConfigService) {}

    private get nodeEnv(): string {
        return this.configService.get<string>('NODE_ENV');
    }

    private get appPort(): number {
        return this.configService.get<number>('APP_PORT');
    }

    private get yjsPort(): number {
        return this.configService.get<number>('YJS_PORT');
    }

    private get wsPort(): number {
        return this.configService.get<number>('WS_PORT');
    }

    private readonly WS_PORT_TEST = 4500;
    private readonly APP_PORT_TEST = 3500;

    getWsPort(): number {
        if (this.nodeEnv === AppStateEnum.Jest) {
            return this.WS_PORT_TEST;
        }
        return this.wsPort;
    }

    getAppPort(): number {
        if (this.nodeEnv === AppStateEnum.Jest) {
            return this.APP_PORT_TEST;
        }
        return this.appPort;
    }

    getYJSPort(): number {
        return this.yjsPort;
    }

    getNodeEnv(): string {
        return this.nodeEnv;
    }
}
