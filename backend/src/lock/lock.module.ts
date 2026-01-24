import { Module } from '@nestjs/common';
import { LockService } from './lock.service';
import { LockController } from './lock.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  providers: [LockService],
  controllers: [LockController],
  exports: [LockService],
})
export class LockModule {}
