import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppStateEnum } from '@/common/app/app.state.enum';

export function wsPortHelper(): number {
    const environment = new AppEnvironment(new ConfigService());
    return Number(environment.getWsPort());
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
