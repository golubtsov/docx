import { Module } from '@nestjs/common';
import { AppEnvironment } from '@/common/app/app.environment';
import { PrismaService } from '@/common/app/prisma.service';
import { RedisService } from '@/common/app/redis.service';
import { LogicCenterService } from '@/common/api/logic.center.service';
import { YsyncAdapterService } from '@/common/yjs/ysync.adapter.service';

@Module({
    providers: [
        AppEnvironment,
        PrismaService,
        RedisService,
        LogicCenterService,
        YsyncAdapterService,
    ],
    exports: [AppEnvironment, PrismaService, RedisService, LogicCenterService],
})
export class AppEnvironmentModule {}
