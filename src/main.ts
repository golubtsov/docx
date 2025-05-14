import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import 'module-alias/register.js';
import {AppEnvironment} from "@/common/app.environment";

async function bootstrap() {
    const appPort = AppEnvironment.getAppPort();
    const wsPort = AppEnvironment.getWsPort();
    const app = await NestFactory.create(AppModule);
    await app.listen(appPort);
    console.log('Приложение запущено на', appPort, 'порту')
    console.log('WS запущен на', wsPort, 'порту')
}

bootstrap();
