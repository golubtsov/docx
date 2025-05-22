import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'module-alias/register.js';
import { AppEnvironment } from '@/common/app/app.environment';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
    const appEnv = new AppEnvironment(new ConfigService());
    const appPort = appEnv.getAppPort();
    const yjsPort = appEnv.getYJSPort();
    const wsPort = appEnv.getWsPort();
    const app = await NestFactory.create(AppModule);
    await app.listen(appPort, '0.0.0.0');
    console.log('Приложение запущено на', appPort, 'порту');
    console.log('WS запущен на', wsPort, 'порту');
    console.log('YJS запущен на', yjsPort, 'порту');
}

bootstrap();
