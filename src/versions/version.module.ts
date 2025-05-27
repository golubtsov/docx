import { Module } from '@nestjs/common';
import { VersionService } from '@/versions/version.service';
import { VersionRepository } from '@/versions/version.repository';
import { RoomModule } from '@/rooms/room.module';
import { VersionGateway } from '@/versions/version.gateway';
import { AppEnvironmentModule } from '@/common/app/app.environment.module';

@Module({
    imports: [RoomModule, AppEnvironmentModule],
    providers: [VersionGateway, VersionService, VersionRepository],
    exports: [VersionService, VersionRepository],
})
export class VersionModule {}
