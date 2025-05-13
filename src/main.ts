import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import 'module-alias/register.js';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    await app.listen(process.env.APP_PORT);
    console.log('Приложение запущено на', process.env.APP_PORT, 'порту')
    console.log('WS запущен на', process.env.WS_PORT, 'порту')
}

bootstrap();
