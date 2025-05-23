import { Module } from '@nestjs/common';
import { VersionService } from '@/versions/version.service';
import { VersionRepository } from '@/versions/version.repository';
import { RoomModule } from '@/rooms/room.module';
import { VersionGateway } from '@/versions/version.gateway';

@Module({
    imports: [RoomModule],
    providers: [VersionGateway, VersionService, VersionRepository],
    exports: [VersionService, VersionRepository],
})
export class VersionModule {}
