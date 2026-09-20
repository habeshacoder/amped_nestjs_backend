import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const configService = app.get(ConfigService);
  app.useLogger(app.get(Logger));

  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const rawCorsOrigin = configService.get<string>('CORS_ORIGIN') || '*';
  const corsOrigin =
    rawCorsOrigin === '*'
      ? '*'
      : rawCorsOrigin.includes(',')
      ? rawCorsOrigin.split(',').map((origin) => origin.trim())
      : rawCorsOrigin;

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });
  app.enableShutdownHooks();

  if (configService.get<string>('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('AMPED API')
      .setDescription('AMPED Digital Publishing & Streaming REST API')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const port = configService.get<number>('PORT') || 3007;
  await app.listen(port);
}
void bootstrap();
