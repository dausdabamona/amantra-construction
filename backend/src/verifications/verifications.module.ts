import { Module } from '@nestjs/common';
import { VerificationsService } from './verifications.service';
import { VerificationsController } from './verifications.controller';
import { TermsModule } from '../terms/terms.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TermsModule, AuditModule],
  controllers: [VerificationsController],
  providers: [VerificationsService],
  exports: [VerificationsService],
})
export class VerificationsModule {}
