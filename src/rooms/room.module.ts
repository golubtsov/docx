import { Module } from '@nestjs/common';
import { RoomGateway } from '@/rooms/room.gateway';
import { RoomService } from '@/rooms/room.service';
import { DocumentService } from '@docxservice/documentservice';
import { YsyncAdapterService } from '@/common/yjs/ysync.adapter.service';
import { RoomManager } from '@/rooms/room.manager';
import { AppEnvironment } from '@/common/app/app.environment';

@Module({
    providers: [
        AppEnvironment,
        RoomGateway,
        RoomService,
        DocumentService,
        YsyncAdapterService,
        RoomManager,
    ],
})
export class RoomModule {}
