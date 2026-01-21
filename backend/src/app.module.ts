import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { WorkPhasesModule } from './modules/work-phases/work-phases.module';
import { ProgressReportsModule } from './modules/progress-reports/progress-reports.module';
import { VerificationsModule } from './modules/verifications/verifications.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { EvidenceModule } from './modules/evidence/evidence.module';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    ContractsModule,
    WorkPhasesModule,
    ProgressReportsModule,
    VerificationsModule,
    PaymentsModule,
    EvidenceModule,
    AuditModule,
  ],
})
export class AppModule {}
