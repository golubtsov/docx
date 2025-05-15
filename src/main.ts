import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'module-alias/register.js';
import { AppEnvironment } from '@/common/app/app.environment';

async function bootstrap() {
    const appPort = AppEnvironment.getAppPort();
    const wsPort = AppEnvironment.getWsPort();
    const yjsPort = AppEnvironment.getYJSPort();
    const app = await NestFactory.create(AppModule);
    await app.listen(appPort);
    console.log('Приложение запущено на', appPort, 'порту');
    console.log('WS запущен на', wsPort, 'порту');
    console.log('YJS запущен на', yjsPort, 'порту');
}

bootstrap();
