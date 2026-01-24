import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CloseContractDto, ArchiveResponseDto, ArchiveSnapshotDto, AuditTrailItemDto, FinalReportDto } from './dto/archive.dto';
import { TxStatus } from '../distribution/dto/distribution.dto';

@Injectable()
export class ArchiveService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async close(contractId: string, userId: string, dto: CloseContractDto): Promise<ArchiveResponseDto<ArchiveSnapshotDto>> {
    if (!dto.confirm) {
      throw new BadRequestException('Konfirmasi diperlukan untuk menutup dan mengarsipkan kontrak');
    }

    const contract = await this.ensureContract(contractId);
    const { finalRights, instructions, logs } = await this.ensureDistributionComplete(contractId);
    await this.ensureNoActiveException(contractId);

    const transactionHashes = this.collectTxHashes(dto.finalHash, instructions, logs);
    const transitionLog = await this.buildTransitionLog(contractId);
    const phaseTimestamps = this.buildPhaseTimestamps(transitionLog);
    const finalRightsSnapshot = {
      finalRights,
      instructions,
      logs,
    };

    const archive = await this.prisma.contractArchive.upsert({
      where: { contractId },
      update: {
        finalState: 'CONTRACT_CLOSED_AND_ARCHIVED',
        finalHash: dto.finalHash ?? finalRights.calculationHash,
        finalRightsSnapshot: JSON.stringify(finalRightsSnapshot),
        transactionHashes: JSON.stringify(transactionHashes),
        transitionLog: JSON.stringify(transitionLog),
        phaseTimestamps: JSON.stringify(phaseTimestamps),
        distributionCompleted: true,
        closedBy: userId,
        notes: dto.notes,
        archivedAt: new Date(),
      },
      create: {
        contractId,
        finalState: 'CONTRACT_CLOSED_AND_ARCHIVED',
        finalHash: dto.finalHash ?? finalRights.calculationHash,
        finalRightsSnapshot: JSON.stringify(finalRightsSnapshot),
        transactionHashes: JSON.stringify(transactionHashes),
        transitionLog: JSON.stringify(transitionLog),
        phaseTimestamps: JSON.stringify(phaseTimestamps),
        distributionCompleted: true,
        closedBy: userId,
        notes: dto.notes,
      },
    });

    if (dto.finalReportTitle || dto.finalReportSummary || dto.totalFunds || dto.totalResult || dto.documentUrl) {
      await this.prisma.finalReport.deleteMany({ where: { archiveId: archive.id } });
      await this.prisma.finalReport.create({
        data: {
          contractId,
          archiveId: archive.id,
          title: dto.finalReportTitle ?? 'Final Completion Report',
          summary: dto.finalReportSummary,
          totalFunds: dto.totalFunds,
          totalResult: dto.totalResult,
          durationDays: dto.durationDays,
          documentUrl: dto.documentUrl,
        },
      });
    }

    await this.prisma.auditTrail.deleteMany({ where: { archiveId: archive.id } });
    const auditTrailPayload = this.buildAuditTrailPayload(logs, instructions, userId, dto.finalHash);
    if (auditTrailPayload.length > 0) {
      // Use loop instead of createMany (not available for SQLite)
      for (const item of auditTrailPayload) {
        await this.prisma.auditTrail.create({
          data: {
            contractId,
            archiveId: archive.id,
            action: item.action,
            message: item.message,
            actorId: item.actorId,
            txHash: item.txHash,
          },
        });
      }
    }

    await this.audit.log({
      action: 'CONTRACT_CLOSED_AND_ARCHIVED',
      entityType: 'Contract',
      entityId: contractId,
      description: dto.notes ?? 'Kontrak ditutup dan diarsipkan. Semua data read-only.',
      userId,
      newValue: JSON.stringify({ archiveId: archive.id, transactionHashes }),
    });

    const snapshot = await this.getSnapshot(contractId);
    return this.wrap('Kontrak berhasil ditutup dan diarsipkan', snapshot);
  }

  async getArchive(contractId: string): Promise<ArchiveResponseDto<ArchiveSnapshotDto>> {
    const snapshot = await this.getSnapshot(contractId);
    return this.wrap('Arsip kontrak diambil', snapshot);
  }

  async getHistory(contractId: string): Promise<ArchiveResponseDto<{ transitionLog: any[]; auditTrail: AuditTrailItemDto[] }>> {
    const archive = await this.prisma.contractArchive.findUnique({ where: { contractId } });
    if (!archive) {
      throw new NotFoundException('Arsip kontrak belum tersedia');
    }

    const auditTrail = await this.prisma.auditTrail.findMany({
      where: { archiveId: archive.id },
      orderBy: { createdAt: 'desc' },
    });

    return this.wrap('Riwayat arsip diambil', {
      transitionLog: archive.transitionLog ? JSON.parse(archive.transitionLog) : [],
      auditTrail: auditTrail.map((item) => ({
        action: item.action,
        message: item.message,
        actorId: item.actorId ?? undefined,
        txHash: item.txHash ?? undefined,
        timestamp: item.createdAt.toISOString(),
      })),
    });
  }

  private async ensureContract(contractId: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id: contractId } });
    if (!contract) {
      throw new NotFoundException('Kontrak tidak ditemukan');
    }
    return contract;
  }

  private async ensureDistributionComplete(contractId: string) {
    const finalRights = await this.prisma.finalRights.findUnique({ where: { contractId } });
    if (!finalRights) {
      throw new ForbiddenException('Hak final belum disiapkan');
    }

    const instructions = await this.prisma.distributionInstruction.findMany({ where: { contractId } });
    const logs = await this.prisma.transferExecutionLog.findMany({ where: { contractId }, orderBy: { createdAt: 'asc' } });

    const hasPendingInstruction = instructions.some((item) => item.status !== TxStatus.CONFIRMED);
    const hasConfirmedTx = finalRights.txStatus === TxStatus.CONFIRMED;
    const hasCompletionLog = logs.some((log) => log.action === 'DISTRIBUTION_COMPLETED' && log.status === 'SUCCESS');

    if (hasPendingInstruction || !hasConfirmedTx || !hasCompletionLog) {
      throw new ForbiddenException('Distribusi belum terkonfirmasi penuh. Semua transaksi harus selesai sebelum arsip.');
    }

    return { finalRights, instructions, logs };
  }

  private async ensureNoActiveException(contractId: string) {
    const evaluation = await this.prisma.evaluationRecord.findUnique({ where: { contractId } });
    if (evaluation && ['SUBMITTED', 'UNDER_REVIEW'].includes(evaluation.objectionStatus)) {
      throw new ForbiddenException('Masih ada keberatan yang aktif. Selesaikan sebelum menutup kontrak.');
    }

    const activeEmergency = await this.prisma.auditLog.findFirst({
      where: {
        entityId: contractId,
        action: 'EXCEPTION_AND_FORCE_MAJEURE',
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    if (activeEmergency) {
      throw new ForbiddenException('Ada exception/force majeure yang belum diselesaikan.');
    }
  }

  private collectTxHashes(finalHash: string | undefined, instructions: any[], logs: any[]): string[] {
    const hashes: string[] = [];

    if (finalHash) hashes.push(finalHash);
    instructions.forEach((item) => {
      if (item.txHash) hashes.push(item.txHash);
    });
    logs.forEach((log) => {
      if (log.txHash) hashes.push(log.txHash);
    });

    return Array.from(new Set(hashes));
  }

  private async buildTransitionLog(contractId: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: { entityId: contractId },
      orderBy: { createdAt: 'asc' },
    });

    return logs.map((log) => ({
      action: log.action,
      entityType: log.entityType,
      description: log.description,
      userId: log.userId,
      timestamp: log.createdAt.toISOString(),
    }));
  }

  private buildPhaseTimestamps(transitionLog: any[]) {
    const lookup = (action: string) => transitionLog.find((log) => log.action === action)?.timestamp ?? null;

    return {
      intentDeclaredAt: transitionLog[0]?.timestamp ?? null,
      lockedAt: lookup('CONTRACT_LOCKED'),
      operationStartedAt: lookup('OPERATION_STARTED') ?? lookup('EXECUTION_STARTED'),
      evaluationStartedAt: lookup('EVALUATION_STARTED') ?? lookup('EVALUATION_INITIATED'),
      rightsFinalizedAt: lookup('RIGHTS_FINALIZED'),
      distributionPreparedAt: lookup('DISTRIBUTION_PREPARED'),
      distributionExecutedAt: lookup('DISTRIBUTION_EXECUTED'),
      distributionCompletedAt: lookup('DISTRIBUTION_COMPLETED') ?? lookup('DISTRIBUTION_EXECUTED'),
      archivedAt: lookup('CONTRACT_CLOSED_AND_ARCHIVED') ?? lookup('CONTRACT_ARCHIVED'),
    };
  }

  private buildAuditTrailPayload(logs: any[], instructions: any[], actorId: string, finalHash?: string) {
    const trail: AuditTrailItemDto[] = [];

    if (finalHash) {
      trail.push({
        action: 'FINAL_HASH_RECORDED',
        message: 'Hash final dicatat untuk arsip',
        actorId,
        txHash: finalHash,
        timestamp: new Date().toISOString(),
      });
    }

    instructions.forEach((instr) => {
      trail.push({
        action: 'INSTRUCTION_CONFIRMED',
        message: `Instruksi ${instr.role} dikonfirmasi sebesar ${instr.amount}`,
        actorId,
        txHash: instr.txHash ?? undefined,
        timestamp: new Date().toISOString(),
      });
    });

    logs.forEach((log) => {
      trail.push({
        action: log.action,
        message: log.message,
        actorId: log.executedBy ?? actorId,
        txHash: log.txHash ?? undefined,
        timestamp: log.createdAt?.toISOString?.() ?? new Date().toISOString(),
      });
    });

    trail.push({
      action: 'ARCHIVE_FINALIZED',
      message: 'Kontrak berada dalam status terminal dan read-only',
      actorId,
      timestamp: new Date().toISOString(),
    });

    return trail;
  }

  private async getSnapshot(contractId: string): Promise<ArchiveSnapshotDto> {
    const archive = await this.prisma.contractArchive.findUnique({
      where: { contractId },
      include: {
        finalReport: true,
        auditTrails: true,
      },
    });

    if (!archive) {
      throw new NotFoundException('Arsip kontrak belum dibuat');
    }

    const auditTrail = archive.auditTrails.map((item) => ({
      action: item.action,
      message: item.message,
      actorId: item.actorId ?? undefined,
      txHash: item.txHash ?? undefined,
      timestamp: item.createdAt.toISOString(),
    }));

    let finalReport: FinalReportDto | undefined;
    if (archive.finalReport) {
      finalReport = {
        title: archive.finalReport.title,
        summary: archive.finalReport.summary ?? undefined,
        totalFunds: archive.finalReport.totalFunds ?? undefined,
        totalResult: archive.finalReport.totalResult ?? undefined,
        durationDays: archive.finalReport.durationDays ?? undefined,
        documentUrl: archive.finalReport.documentUrl ?? undefined,
        createdAt: archive.finalReport.createdAt.toISOString(),
      };
    }

    return {
      contractId,
      finalState: archive.finalState,
      finalHash: archive.finalHash ?? undefined,
      finalRightsSnapshot: archive.finalRightsSnapshot ? JSON.parse(archive.finalRightsSnapshot) : null,
      transactionHashes: archive.transactionHashes ? JSON.parse(archive.transactionHashes) : [],
      transitionLog: archive.transitionLog ? JSON.parse(archive.transitionLog) : [],
      phaseTimestamps: archive.phaseTimestamps ? JSON.parse(archive.phaseTimestamps) : {},
      distributionCompleted: archive.distributionCompleted,
      closedBy: archive.closedBy ?? undefined,
      archivedAt: archive.archivedAt.toISOString(),
      notes: archive.notes ?? undefined,
      finalReport,
      auditTrail,
    };
  }

  private wrap<T>(message: string, data: T): ArchiveResponseDto<T> {
    return {
      success: true,
      message,
      data,
      error: null,
      timestamp: new Date(),
    };
  }
}
