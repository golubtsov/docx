import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppStateEnum } from '@/common/app/app.state.enum';

export function wsPortHelper(): number {
    const environment = new AppEnvironment(new ConfigService());
    return Number(environment.getWsPort());
}

export function logicCenterUrlHelper(): string {
    const environment = new AppEnvironment(new ConfigService());
    return environment.getLogicCenterUrl();
}

@Injectable()
export class AppEnvironment {
    private readonly WS_PORT_TEST = 4500;
    private readonly APP_PORT_TEST = 3500;

    constructor(private readonly configService: ConfigService) {}

    private get nodeEnv(): string {
        return this.configService.get<string>('NODE_ENV');
    }

    getWsPort(): number {
        if (this.nodeEnv === AppStateEnum.Jest) {
            return this.WS_PORT_TEST;
        }
        return this.configService.get<number>('WS_PORT');
    }

    getAppPort(): number {
        if (this.nodeEnv === AppStateEnum.Jest) {
            return this.APP_PORT_TEST;
        }
        return this.configService.get<number>('APP_PORT');
    }

    getYJSPort(): number {
        return this.configService.get<number>('YJS_PORT');
    }

    getLogicCenterUrl() {
        return this.configService.get<string>('LOGIC_CENTER_URL');
    }
}
