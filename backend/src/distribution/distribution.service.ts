import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  DistributionResponseDto,
  DistributionStatusDto,
  DistributionWaitingState,
  ExecuteDistributionDto,
  FinalRightsDto,
  PrepareDistributionDto,
  DistributionInstructionDto,
  TransferExecutionLogDto,
  TxStatus,
} from './dto/distribution.dto';
import { EvaluationWaitingState, ObjectionStatusType } from '../evaluation/dto/evaluation.dto';
import * as crypto from 'crypto';

@Injectable()
export class DistributionService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async prepareDistribution(contractId: string, userId: string, dto: PrepareDistributionDto): Promise<DistributionResponseDto<DistributionStatusDto>> {
    if (!dto.confirm) {
      throw new BadRequestException('Konfirmasi diperlukan untuk menyiapkan distribusi');
    }

    const contract = await this.ensureContract(contractId);
    const evaluation = await this.ensureEvaluationReady(contractId);
    const calculation = await this.getLatestCalculation(contractId);

    const provisional = calculation?.provisional as any;
    const net = provisional?.netPayable ?? 0;
    const penalties = Math.max((provisional?.totalDeductions ?? 0) - (provisional?.totalBonuses ?? 0), 0);
    const fees = Math.round(net * 0.02);
    const distributable = Math.max(net - fees - penalties, 0);
    const finalShareInvestor = Math.round(distributable * 0.7);
    const finalShareOperator = Math.max(distributable - finalShareInvestor, 0);

    const finalRights = await this.prisma.finalRights.upsert({
      where: { contractId },
      update: {
        calculationHash: evaluation.calculationHash ?? '0x0',
        finalShareInvestor,
        finalShareOperator,
        fees,
        penalties,
        currency: provisional?.currency ?? 'IDR',
        txStatus: TxStatus.PENDING,
        approvedBy: userId,
        approvedAt: new Date(),
      },
      create: {
        contractId: contract.id,
        calculationHash: evaluation.calculationHash ?? '0x0',
        finalShareInvestor,
        finalShareOperator,
        fees,
        penalties,
        currency: provisional?.currency ?? 'IDR',
        txStatus: TxStatus.PENDING,
        approvedBy: userId,
        approvedAt: new Date(),
      },
    });

    await this.prisma.distributionInstruction.deleteMany({ where: { contractId } });

    const instructions: Omit<DistributionInstructionDto, 'status'>[] = [
      { beneficiary: 'INVESTOR_ACCOUNT', role: 'INVESTOR', amount: finalShareInvestor },
      { beneficiary: 'OPERATOR_ACCOUNT', role: 'OPERATOR', amount: finalShareOperator },
    ];

    if (fees > 0) {
      instructions.push({ beneficiary: 'FEE_ACCOUNT', role: 'FEE', amount: fees });
    }
    if (penalties > 0) {
      instructions.push({ beneficiary: 'PENALTY_ACCOUNT', role: 'PENALTY', amount: penalties });
    }

    // Create instructions one by one (createMany not available for SQLite)
    for (const item of instructions) {
      await this.prisma.distributionInstruction.create({
        data: {
          contractId,
          finalRightsId: finalRights.id,
          beneficiary: item.beneficiary,
          role: item.role,
          amount: item.amount,
          status: TxStatus.PENDING,
        },
      });
    }

    await this.audit.log({
      action: 'DISTRIBUTION_PREPARED',
      entityType: 'Contract',
      entityId: contractId,
      description: dto.notes ?? 'Hak final ditetapkan dan instruksi distribusi dibuat',
      userId,
    });

    const status = await this.buildStatus(contractId, finalRights, DistributionWaitingState.WAITING_FOR_ESCROW_RELEASE);
    return this.wrap('Distribusi siap dieksekusi', status);
  }

  async executeDistribution(contractId: string, userId: string, dto: ExecuteDistributionDto): Promise<DistributionResponseDto<DistributionStatusDto>> {
    const finalRights = await this.prisma.finalRights.findUnique({ where: { contractId } });
    if (!finalRights) {
      throw new NotFoundException('Hak final belum disiapkan');
    }

    const instructions = await this.prisma.distributionInstruction.findMany({ where: { contractId } });
    if (instructions.length === 0) {
      throw new BadRequestException('Instruksi distribusi belum tersedia');
    }

    const txHash = dto.txHash ?? this.generateHash();

    await this.prisma.distributionInstruction.updateMany({
      where: { contractId },
      data: { status: TxStatus.CONFIRMED, txHash },
    });

    await this.prisma.finalRights.update({
      where: { contractId },
      data: { txStatus: TxStatus.CONFIRMED },
    });

    // Log execution steps
    await this.prisma.transferExecutionLog.create({
      data: {
        contractId,
        finalRightsId: finalRights.id,
        action: 'ESCROW_RELEASE',
        status: 'SUCCESS',
        message: 'Dana escrow dilepas untuk distribusi',
        txHash,
        executedBy: userId,
      },
    });

    for (const instr of instructions) {
      await this.prisma.transferExecutionLog.create({
        data: {
          contractId,
          finalRightsId: finalRights.id,
          instructionId: instr.id,
          action: 'TRANSFER_EXECUTED',
          status: 'SUCCESS',
          message: `Transfer ke ${instr.beneficiary} sebesar ${instr.amount}`,
          txHash,
          executedBy: userId,
        },
      });
    }

    await this.prisma.transferExecutionLog.create({
      data: {
        contractId,
        finalRightsId: finalRights.id,
        action: 'DISTRIBUTION_COMPLETED',
        status: 'SUCCESS',
        message: 'Semua transfer dikonfirmasi',
        txHash,
        executedBy: userId,
      },
    });

    await this.audit.log({
      action: 'DISTRIBUTION_EXECUTED',
      entityType: 'Contract',
      entityId: contractId,
      description: 'Distribusi dana dieksekusi dan dikonfirmasi',
      userId,
      newValue: JSON.stringify({ txHash }),
    });

    const refreshedRights = await this.prisma.finalRights.findUnique({ where: { contractId } });
    const status = await this.buildStatus(contractId, refreshedRights!, DistributionWaitingState.WAITING_FOR_TRANSFER_CONFIRMATION);
    return this.wrap('Distribusi dieksekusi dan menunggu konfirmasi akhir', status);
  }

  async getStatus(contractId: string): Promise<DistributionResponseDto<DistributionStatusDto>> {
    const finalRights = await this.prisma.finalRights.findUnique({ where: { contractId } });
    if (!finalRights) {
      throw new NotFoundException('Hak final belum tersedia untuk kontrak ini');
    }

    const waitingState = finalRights.txStatus === TxStatus.CONFIRMED
      ? DistributionWaitingState.WAITING_FOR_TRANSFER_CONFIRMATION
      : DistributionWaitingState.WAITING_FOR_ESCROW_RELEASE;

    const status = await this.buildStatus(contractId, finalRights, waitingState);
    return this.wrap('Status distribusi diambil', status);
  }

  private async ensureContract(contractId: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id: contractId } });
    if (!contract) {
      throw new NotFoundException('Kontrak tidak ditemukan');
    }
    return contract;
  }

  private async ensureEvaluationReady(contractId: string) {
    const evaluation = await this.prisma.evaluationRecord.findUnique({ where: { contractId } });
    if (!evaluation) {
      throw new ForbiddenException('Evaluasi belum dimulai');
    }
    if (evaluation.waitingState !== EvaluationWaitingState.WAITING_FOR_FINAL_APPROVAL) {
      throw new ForbiddenException('Perhitungan final belum disetujui');
    }
    if (!evaluation.calculationHash) {
      throw new ForbiddenException('Hash perhitungan belum di-anchored');
    }
    if ([ObjectionStatusType.SUBMITTED, ObjectionStatusType.UNDER_REVIEW].includes(evaluation.objectionStatus as ObjectionStatusType)) {
      throw new ForbiddenException('Masih ada keberatan yang aktif');
    }
    return evaluation;
  }

  private async getLatestCalculation(contractId: string) {
    return this.prisma.calculationResult.findFirst({
      where: { contractId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async buildStatus(contractId: string, finalRights: any, waitingState: DistributionWaitingState): Promise<DistributionStatusDto> {
    const instructions = await this.prisma.distributionInstruction.findMany({ where: { contractId } });
    const logs = await this.prisma.transferExecutionLog.findMany({
      where: { contractId },
      orderBy: { createdAt: 'desc' },
    });

    const finalDto: FinalRightsDto = {
      calculationHash: finalRights.calculationHash,
      finalShareInvestor: finalRights.finalShareInvestor,
      finalShareOperator: finalRights.finalShareOperator,
      fees: finalRights.fees,
      penalties: finalRights.penalties,
      currency: finalRights.currency,
      txStatus: finalRights.txStatus as TxStatus,
    };

    return {
      waitingState,
      finalRights: finalDto,
      instructions: instructions.map((item) => ({
        beneficiary: item.beneficiary,
        role: item.role,
        amount: item.amount,
        status: item.status,
        txHash: item.txHash ?? undefined,
      })),
      logs: logs.map((log) => ({
        action: log.action,
        status: log.status,
        message: log.message,
        txHash: log.txHash ?? undefined,
        timestamp: log.createdAt.toISOString(),
      })),
    };
  }

  private generateHash() {
    return '0x' + crypto.randomBytes(16).toString('hex');
  }

  private wrap<T>(message: string, data: T): DistributionResponseDto<T> {
    return {
      success: true,
      message,
      data,
      error: null,
      timestamp: new Date(),
    };
  }
}
