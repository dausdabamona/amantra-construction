import { Module } from '@nestjs/common';
import { ProgressReportsService } from './progress-reports.service';
import { ProgressReportsController } from './progress-reports.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [ProgressReportsController],
  providers: [ProgressReportsService],
  exports: [ProgressReportsService],
})
export class ProgressReportsModule {}
