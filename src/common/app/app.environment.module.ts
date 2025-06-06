import { Module } from '@nestjs/common';
import { AppEnvironment } from '@/common/app/app.environment';
import { PrismaService } from '@/common/app/prisma.service';
import { RedisService } from '@/common/app/redis.service';
import { LogicCenterService } from '@/common/api/logic.center.service';

@Module({
    providers: [
        AppEnvironment,
        PrismaService,
        RedisService,
        LogicCenterService,
    ],
    exports: [AppEnvironment, PrismaService, RedisService, LogicCenterService],
})
export class AppEnvironmentModule {}
