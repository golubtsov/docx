import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import 'module-alias/register.js';
import {AppEnvironment} from "@/common/app/app.environment";

async function bootstrap() {
    const appPort = AppEnvironment.getAppPort();
    const app = await NestFactory.create(AppModule);
    await app.listen(appPort);
    console.log('Приложение запущено')
    console.log('WS запущен')
}

bootstrap();
