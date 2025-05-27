import { Module } from '@nestjs/common';
import { AppEnvironment } from '@/common/app/app.environment';
import { PrismaService } from '@/common/app/prisma.service';

@Module({
    providers: [AppEnvironment, PrismaService],
    exports: [AppEnvironment, PrismaService],
})
export class AppEnvironmentModule {}
