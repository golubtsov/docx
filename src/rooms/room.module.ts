import {Module} from '@nestjs/common';
import {RoomGateway} from "@/rooms/room.gateway";
import {RoomService} from "@/rooms/room.service";
import {DocumentService} from "@docxservice/documentservice";
import {YsyncAdapterService} from "@/yjs/ysync.adapter.service";

@Module({
    providers: [
        RoomGateway,
        RoomService,
        DocumentService,
        YsyncAdapterService
    ]
})
export class RoomModule {}