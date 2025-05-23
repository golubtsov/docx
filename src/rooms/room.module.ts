import { Module } from '@nestjs/common';
import { RoomGateway } from '@/rooms/room.gateway';
import { RoomService } from '@/rooms/room.service';
import { DocumentService } from '@docxservice/documentservice';
import { YsyncAdapterService } from '@/common/yjs/ysync.adapter.service';
import { RoomRepository } from '@/rooms/room.repository';
import { AppEnvironment } from '@/common/app/app.environment';

@Module({
    providers: [
        AppEnvironment,
        RoomGateway,
        RoomService,
        DocumentService,
        YsyncAdapterService,
        RoomRepository,
    ],
    exports: [RoomService, RoomRepository],
})
export class RoomModule {}
