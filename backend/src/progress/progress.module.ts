import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';
import { TermsModule } from '../terms/terms.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads/progress',
        filename: (req, file, cb) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
    TermsModule,
    AuditModule,
  ],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
