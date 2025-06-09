import { Module } from '@nestjs/common';
import { RoomGateway } from '@/rooms/room.gateway';
import { RoomService } from '@/rooms/room.service';
import { DocumentService } from '@docxservice/documentservice';
import { YsyncAdapterService } from '@/common/yjs/ysync.adapter.service';
import { RoomRepository } from '@/rooms/room.repository';
import { AppEnvironment } from '@/common/app/app.environment';
import { RedisService } from '@/common/app/redis.service';
import { YDocInitializerService } from '@/common/yjs/ydoc.initializer.service';
import { PrismaService } from '@/common/app/prisma.service';
import { LogicCenterService } from '@/common/api/logic.center.service';
import { VersionRepository } from '@/versions/version.repository';

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
        PrismaService,
        LogicCenterService,
        VersionRepository,
    ],
    exports: [RoomService, RoomRepository],
})
export class RoomModule {}
