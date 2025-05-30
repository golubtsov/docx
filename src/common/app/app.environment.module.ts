import { Module } from '@nestjs/common';
import { AppEnvironment } from '@/common/app/app.environment';
import { PrismaService } from '@/common/app/prisma.service';
import { RedisService } from '@/common/app/redis.service';

@Module({
    providers: [AppEnvironment, PrismaService, RedisService],
    exports: [AppEnvironment, PrismaService, RedisService],
})
export class AppEnvironmentModule {}
