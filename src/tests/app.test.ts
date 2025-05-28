import { AppEnvironment } from '@/common/app/app.environment';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppEnvironmentModule } from '@/common/app/app.environment.module';
import { RoomModule } from '@/rooms/room.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { RoomGateway } from '@/rooms/room.gateway';
import { VersionGateway } from '@/versions/version.gateway';
import { VersionModule } from '@/versions/version.module';

const appEnv = new AppEnvironment(new ConfigService());

export class AppTest {
    private app: INestApplication;

    private moduleRef: TestingModule;

    private static instance: AppTest;

    public static async getInstance(): Promise<AppTest> {
        if (!this.instance) {
            this.instance = new AppTest();
            await this.instance.init();
        }
        return this.instance;
    }

    private async init() {
        await this.createModuleRef();
        return this;
    }

    private async createModuleRef() {
        this.moduleRef = await Test.createTestingModule({
            imports: [
                await ConfigModule.forRoot({ isGlobal: true }),
                AppEnvironmentModule,
                RoomModule,
                VersionModule,
            ],
        }).compile();

        this.app = this.moduleRef.createNestApplication();
        this.app.useWebSocketAdapter(new IoAdapter(this.app));
        await this.app.init();
        await this.app.listen(appEnv.getAppPort());
    }

    getApp() {
        return this.app;
    }

    //TODO Эти три метода не очень мне нравятся
    getRoomGateway() {
        return this.moduleRef.get<RoomGateway>(RoomGateway);
    }

    getVersionGateway() {
        return this.moduleRef.get<VersionGateway>(VersionGateway);
    }

    clearAllConnections() {
        this.getRoomGateway()['server'].disconnectSockets(true);
        this.getVersionGateway()['server'].disconnectSockets(true);
    }
}
