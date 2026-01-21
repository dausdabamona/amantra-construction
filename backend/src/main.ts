import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global prefix
  const apiPrefix = configService.get('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN', 'http://localhost:3000'),
    credentials: configService.get('CORS_CREDENTIALS', true),
  });

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('AMANTRA Construction API')
    .setDescription(
      'API untuk sistem manajemen kontrak konstruksi berbasis termin dengan verifikasi berlapis',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Autentikasi & Otorisasi')
    .addTag('users', 'Manajemen Pengguna')
    .addTag('projects', 'Manajemen Proyek')
    .addTag('contracts', 'Manajemen Kontrak')
    .addTag('work-phases', 'Termin Pekerjaan')
    .addTag('progress-reports', 'Laporan Progres')
    .addTag('verifications', 'Verifikasi Berlapis')
    .addTag('payments', 'Pembayaran')
    .addTag('evidence', 'Bukti & Dokumen')
    .addTag('audit', 'Audit Trail')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Start server
  const port = configService.get('PORT', 3001);
  await app.listen(port);

  console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🏗️  AMANTRA Construction API Server                     ║
  ║                                                           ║
  ║   Server running at: http://localhost:${port}              ║
  ║   API Docs:          http://localhost:${port}/docs         ║
  ║   API Prefix:        /${apiPrefix}                        ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
