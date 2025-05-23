import { Module } from '@nestjs/common';
import { RoomModule } from '@/rooms/room.module';
import { ConfigModule } from '@nestjs/config';
import { AppEnvironmentModule } from '@/common/app/app.environment.module';
import { VersionModule } from '@/versions/version.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        AppEnvironmentModule,
        RoomModule,
        VersionModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
