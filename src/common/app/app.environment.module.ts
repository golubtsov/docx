import { Module } from '@nestjs/common';
import { AppEnvironment } from '@/common/app/app.environment';

@Module({
    providers: [AppEnvironment],
    exports: [AppEnvironment],
})
export class AppEnvironmentModule {}
