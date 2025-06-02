import { Module } from '@nestjs/common';
import { RoomGateway } from '@/rooms/room.gateway';
import { RoomService } from '@/rooms/room.service';
import { DocumentService } from '@docxservice/documentservice';
import { YsyncAdapterService } from '@/common/yjs/ysync.adapter.service';
import { RoomRepository } from '@/rooms/room.repository';
import { AppEnvironment } from '@/common/app/app.environment';
import { RedisService } from '@/common/app/redis.service';
import { YDocInitializerService } from '@/common/yjs/ydoc.initializer.service';

@Module({
    providers: [
        AppEnvironment,
        RoomGateway,
        RoomService,
        DocumentService,
        YsyncAdapterService,
        YDocInitializerService,
        RoomRepository,
        RedisService,
    ],
    exports: [RoomService, RoomRepository],
})
export class RoomModule {}
