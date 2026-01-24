import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { OperationService } from './operation.service';
import { OperationController } from './operation.controller';

@Module({
  imports: [PrismaModule, AuditModule],
  providers: [OperationService],
  controllers: [OperationController],
  exports: [OperationService],
})
export class OperationModule {}
