import { Module } from '@nestjs/common';
import { RoomModule } from '@/rooms/room.module';
import { ConfigModule } from '@nestjs/config';
import { AppEnvironmentModule } from '@/common/app/app.environment.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        AppEnvironmentModule,
        RoomModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
