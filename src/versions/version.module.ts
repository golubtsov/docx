import { Module } from '@nestjs/common';
import { VersionService } from '@/versions/version.service';
import { VersionRepository } from '@/versions/version.repository';
import { RoomModule } from '@/rooms/room.module';
import { VersionGateway } from '@/versions/version.gateway';
import { AppEnvironmentModule } from '@/common/app/app.environment.module';
import { VersionController } from '@/versions/version.controller';

@Module({
    imports: [RoomModule, AppEnvironmentModule],
    providers: [VersionGateway, VersionService, VersionRepository],
    exports: [VersionService, VersionRepository],
    controllers: [VersionController],
})
export class VersionModule {}
