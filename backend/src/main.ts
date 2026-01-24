import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggerService } from './common/logger/logger.service';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const loggerService = app.get(LoggerService);

  // Global prefix
  const apiPrefix = configService.get('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN', 'http://localhost:3000'),
    credentials: configService.get('CORS_CREDENTIALS', true),
  });

  // Global Validation Pipe with enhanced error handling
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      errorHttpStatusCode: 400,
      stopAtFirstError: false,
    }),
  );

  // Global Exception Filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global Logging Interceptor
  app.useGlobalInterceptors(new LoggingInterceptor(loggerService));

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('AMANTRA Construction API')
    .setDescription(
      'API untuk sistem manajemen kontrak konstruksi berbasis termin dengan verifikasi berlapis. Sistem ini mendukung alur kerja termin amanah dengan verifikasi bertingkat oleh pengawas dan saksi ahli.',
    )
    .setVersion('1.0.0')
    .setContact(
      'AMANTRA Team',
      'https://amantra.construction',
      'support@amantra.construction',
    )
    .setLicense(
      'UNLICENSED',
      'https://amantra.construction/license',
    )
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT',
    )
    .addTag('auth', 'Autentikasi & Otorisasi')
    .addTag('projects', 'Manajemen Proyek')
    .addTag('terms', 'Termin Pekerjaan')
    .addTag('progress', 'Laporan Progres')
    .addTag('verifications', 'Verifikasi Berlapis')
    .addTag('payments', 'Pembayaran')
    .addTag('audit', 'Audit Trail')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Start server
  const port = configService.get('PORT', 3001);
  await app.listen(port);

  loggerService.log(
    `🏗️  AMANTRA Construction API Server started on port ${port}`,
    'Bootstrap',
  );
  loggerService.log(
    `📚 Swagger Docs available at http://localhost:${port}/docs`,
    'Bootstrap',
  );
}

bootstrap();
