import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { ContractReviewService } from './contract-review.service';
import { ContractReviewController } from './contract-review.controller';

@Module({
  imports: [PrismaModule, AuditModule],
  providers: [ContractReviewService],
  controllers: [ContractReviewController],
  exports: [ContractReviewService],
})
export class ContractReviewModule {}
