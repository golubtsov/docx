import { Module } from '@nestjs/common';
import {RoomModule} from "@/rooms/room.module";

@Module({
  imports: [RoomModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
