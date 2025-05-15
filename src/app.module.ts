import { Module } from '@nestjs/common';
import { RoomModule } from '@/rooms/room.module';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [ConfigModule.forRoot(), RoomModule],
    controllers: [],
    providers: [],
})
export class AppModule {}
