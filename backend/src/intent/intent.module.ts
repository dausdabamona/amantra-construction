import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { IntentService } from './intent.service';
import { IntentController } from './intent.controller';

@Module({
  imports: [PrismaModule, AuditModule],
  providers: [IntentService],
  controllers: [IntentController],
  exports: [IntentService],
})
export class IntentModule {}
