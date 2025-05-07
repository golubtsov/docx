import { Module } from '@nestjs/common';
import {RoomGateway} from "@/rooms/room.gateway";
import {RoomService} from "@/rooms/room.service";

@Module({
    providers: [RoomGateway, RoomService]
})
export class RoomModule {}