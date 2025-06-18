import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppEnvironment } from '@/common/app/app.environment';
import { ConfigService } from '@nestjs/config';
import { AppStateEnum } from './common/app/app.state.enum';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
    const appEnv = new AppEnvironment(new ConfigService());
    const appPort = appEnv.getAppPort();
    const yjsPort = appEnv.getYJSPort();
    const wsPort = appEnv.getWsPort();
    const app = await NestFactory.create(AppModule);
    appEnv.nodeEnv === AppStateEnum.Development ? app.enableCors() : null;
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
        }),
    );
    await app.listen(appPort, '0.0.0.0');
    console.log('Приложение запущено на', appPort, 'порту');
    console.log('WS запущен на', wsPort, 'порту');
    console.log('YJS запущен на', yjsPort, 'порту');
}

bootstrap();
