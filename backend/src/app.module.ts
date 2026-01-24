import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { CommonModule } from './common/common.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { IntentModule } from './intent/intent.module';
import { ContractReviewModule } from './contract-review/contract-review.module';
import { LockModule } from './lock/lock.module';
import { ProjectsModule } from './projects/projects.module';
import { TermsModule } from './terms/terms.module';
import { ProgressModule } from './progress/progress.module';
import { VerificationsModule } from './verifications/verifications.module';
import { PaymentsModule } from './payments/payments.module';
import { AuditModule } from './audit/audit.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { OperationModule } from './operation/operation.module';
import { EvaluationModule } from './evaluation/evaluation.module';
import { DistributionModule } from './distribution/distribution.module';
import { ArchiveModule } from './archive/archive.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    CommonModule,
    PrismaModule,
    AuthModule,
    IntentModule,
    ContractReviewModule,
    LockModule,
    ProjectsModule,
    TermsModule,
    ProgressModule,
    VerificationsModule,
    PaymentsModule,
    AuditModule,
    BlockchainModule,
    OperationModule,
    EvaluationModule,
    DistributionModule,
    ArchiveModule,
  ],
})
export class AppModule {}
