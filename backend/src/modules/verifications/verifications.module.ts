import { Module } from '@nestjs/common';
import { VerificationsService } from './verifications.service';
import { VerificationsController } from './verifications.controller';
import { AuditModule } from '../audit/audit.module';
import { WorkPhasesModule } from '../work-phases/work-phases.module';

@Module({
  imports: [AuditModule, WorkPhasesModule],
  controllers: [VerificationsController],
  providers: [VerificationsService],
  exports: [VerificationsService],
})
export class VerificationsModule {}
