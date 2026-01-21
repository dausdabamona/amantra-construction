import { Module } from '@nestjs/common';
import { WorkPhasesService } from './work-phases.service';
import { WorkPhasesController } from './work-phases.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [WorkPhasesController],
  providers: [WorkPhasesService],
  exports: [WorkPhasesService],
})
export class WorkPhasesModule {}
