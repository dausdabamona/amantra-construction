import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import {
  CalculationRequestDto,
  CalculationResponseDto,
  CalculationLineItemDto,
  EvaluationDataDto,
  EvaluationResponseDto,
  EvaluationWaitingState,
  ManualAdjustmentDto,
  ObjectionDto,
  ObjectionStatusDto,
  ObjectionStatusType,
  ProvisionalResultDto,
  StartEvaluationDto,
  CalculationLineType,
  AuditLogItemDto,
} from './dto/evaluation.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class EvaluationService {
  constructor(private readonly audit: AuditService, private readonly prisma: PrismaService) {}

  async startEvaluation(userId: string, dto: StartEvaluationDto): Promise<EvaluationResponseDto<EvaluationDataDto>> {
    if (!dto.confirmStart) {
      throw new BadRequestException('Konfirmasi diperlukan untuk memulai evaluasi');
    }

    const contract = await this.ensureContract(dto.contractId);
    await this.ensureOperationRunning(dto.contractId);
    await this.ensureMilestonesVerified(dto.contractId);

    const now = new Date();
    const objectionDeadline = this.addDays(now, 3);
    const correctionDeadline = this.addDays(now, 7);

    const record = await this.prisma.evaluationRecord.upsert({
      where: { contractId: dto.contractId },
      update: {
        state: 'EVALUATION_AND_CALCULATION',
        waitingState: EvaluationWaitingState.WAITING_FOR_AUDIT,
        isDataFrozen: true,
        objectionStatus: ObjectionStatusType.NONE,
        correctionRounds: 0,
        objectionDeadline,
        correctionDeadline,
        calculationHash: null,
      },
      create: {
        contractId: contract.id,
        state: 'EVALUATION_AND_CALCULATION',
        waitingState: EvaluationWaitingState.WAITING_FOR_AUDIT,
        isDataFrozen: true,
        objectionStatus: ObjectionStatusType.NONE,
        correctionRounds: 0,
        objectionDeadline,
        correctionDeadline,
      },
    });

    const calculationResult = await this.ensureBaseCalculation(dto.contractId);

    await this.audit.log({
      action: 'EVALUATION_STARTED',
      entityType: 'Contract',
      entityId: dto.contractId,
      description: dto.evaluationNotes ?? 'Evaluasi dimulai dan data dibekukan',
      userId,
    });

    const data = await this.mapToEvaluation(record, calculationResult);
    return this.wrapData('Evaluasi dimulai, data dibekukan untuk perhitungan', data);
  }

  async getEvaluation(contractId: string, userId: string): Promise<EvaluationResponseDto<EvaluationDataDto>> {
    await this.ensureContract(contractId);

    const record = await this.prisma.evaluationRecord.findUnique({ where: { contractId } });
    if (!record) {
      const snapshot = await this.buildDefaultEvaluationSnapshot(contractId);
      return this.wrapData('Evaluasi belum dimulai. Mulai untuk membekukan data.', snapshot);
    }

    const result = await this.prisma.calculationResult.findFirst({
      where: { contractId },
      orderBy: { createdAt: 'desc' },
    });

    const data = await this.mapToEvaluation(record, result);
    return this.wrapData('Data evaluasi diambil', data);
  }

  async calculate(userId: string, dto: CalculationRequestDto): Promise<CalculationResponseDto> {
    const record = await this.ensureEvaluationStarted(dto.contractId, userId);

    const breakdown = this.buildCalculationBreakdown(dto.manualAdjustments);
    const provisional = this.buildProvisionalResult(breakdown);
    const calculationHash = this.generateCalculationHash(dto.contractId, breakdown, provisional);

    const result = await this.prisma.calculationResult.findFirst({
      where: { contractId: dto.contractId },
      orderBy: { createdAt: 'desc' },
    });

    const calculationData = {
      contractId: dto.contractId,
      breakdown: JSON.stringify(breakdown),
      provisional: JSON.stringify(provisional),
      verifiedPerformance: JSON.stringify(this.getVerifiedPerformanceData()),
      appliedClauses: JSON.stringify(this.getAppliedClauses()),
      objection: record.objectionStatus,
      isFinal: false,
    };

    const savedResult = result 
      ? await this.prisma.calculationResult.update({
          where: { id: result.id },
          data: calculationData,
        })
      : await this.prisma.calculationResult.create({
          data: calculationData,
        });

    const updatedRecord = await this.prisma.evaluationRecord.update({
      where: { contractId: dto.contractId },
      data: {
        waitingState: EvaluationWaitingState.WAITING_FOR_FINAL_APPROVAL,
        objectionStatus: ObjectionStatusType.UNDER_REVIEW,
        calculationHash,
      },
    });

    await this.audit.log({
      action: 'EVALUATION_CALCULATION_COMPUTED',
      entityType: 'Contract',
      entityId: dto.contractId,
      description: 'Perhitungan provisional disiapkan dan menunggu persetujuan final',
      userId,
      newValue: JSON.stringify({ calculationHash }),
    });

    const data = await this.mapToEvaluation(updatedRecord, savedResult);
    return {
      success: true,
      message: 'Perhitungan provisional berhasil dibuat dan menunggu persetujuan final',
      data,
      error: null,
      timestamp: new Date(),
    };
  }

  async submitObjection(userId: string, dto: ObjectionDto): Promise<EvaluationResponseDto<ObjectionStatusDto>> {
    const record = await this.ensureEvaluationStarted(dto.contractId, userId);

    const now = new Date();
    const resolutionDeadline = this.addDays(now, 7);

    const status: ObjectionStatusDto = {
      status: ObjectionStatusType.SUBMITTED,
      submittedAt: now.toISOString(),
      submittedBy: userId,
      resolutionDeadline: resolutionDeadline.toISOString(),
      resolutionNotes: dto.requestedChanges,
    };

    await this.prisma.evaluationRecord.update({
      where: { contractId: dto.contractId },
      data: {
        objectionStatus: status.status,
        waitingState: EvaluationWaitingState.WAITING_FOR_CORRECTION,
        correctionRounds: record.correctionRounds + 1,
        correctionDeadline: resolutionDeadline,
      },
    });

    await this.prisma.calculationResult.updateMany({
      where: { contractId: dto.contractId },
      data: { objection: JSON.stringify(status) },
    });

    await this.audit.log({
      action: 'EVALUATION_OBJECTION_SUBMITTED',
      entityType: 'Contract',
      entityId: dto.contractId,
      description: dto.reason,
      userId,
      newValue: JSON.stringify({ requestedChanges: dto.requestedChanges, evidenceUrls: dto.evidenceUrls ?? [] }),
    });

    return this.wrapData('Keberatan tercatat dan menunggu koreksi', status);
  }

  private async ensureContract(contractId: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id: contractId } });
    if (!contract) {
      throw new NotFoundException('Kontrak tidak ditemukan');
    }
    return contract;
  }

  private async ensureOperationRunning(contractId: string) {
    const operationLog = await this.prisma.auditLog.findFirst({
      where: { entityId: contractId, action: 'OPERATION_STARTED' },
      orderBy: { createdAt: 'desc' },
    });

    if (!operationLog) {
      throw new ForbiddenException('Operasi belum berjalan, tidak dapat masuk ke evaluasi');
    }
  }

  private async ensureMilestonesVerified(contractId: string) {
    const pendingTerm = await this.prisma.term.findFirst({
      where: {
        contractId,
        status: { notIn: ['VERIFIED', 'VALID', 'PAID'] },
      },
    });

    if (pendingTerm) {
      throw new ForbiddenException('Semua milestone harus diverifikasi sebelum evaluasi dimulai');
    }
  }

  private async ensureEvaluationStarted(contractId: string, userId: string) {
    await this.ensureContract(contractId);
    const record = await this.prisma.evaluationRecord.findUnique({ where: { contractId } });
    if (!record || !record.isDataFrozen) {
      throw new BadRequestException('Evaluasi belum dimulai');
    }
    return record;
  }

  private async ensureBaseCalculation(contractId: string) {
    const existing = await this.prisma.calculationResult.findFirst({
      where: { contractId },
      orderBy: { createdAt: 'desc' },
    });
    if (existing) return existing;

    return this.prisma.calculationResult.create({
      data: {
        contractId,
        breakdown: JSON.stringify(this.buildCalculationBreakdown()),
        provisional: JSON.stringify(this.buildProvisionalResult(this.buildCalculationBreakdown())),
        verifiedPerformance: JSON.stringify(this.getVerifiedPerformanceData()),
        appliedClauses: JSON.stringify(this.getAppliedClauses()),
        objection: JSON.stringify({ status: ObjectionStatusType.NONE }),
        isFinal: false,
      },
    });
  }

  private buildCalculationBreakdown(manualAdjustments?: ManualAdjustmentDto[]): CalculationLineItemDto[] {
    const base: CalculationLineItemDto[] = [
      {
        label: 'Nilai kontrak dasar',
        amount: 10000000000,
        type: CalculationLineType.BASE_VALUE,
        description: 'Nilai kontrak yang telah diverifikasi',
        impactOnPayment: 'Menjadi dasar perhitungan',
      },
      {
        label: 'Denda keterlambatan',
        amount: -700000000,
        type: CalculationLineType.DEDUCTION,
        description: '7% dari nilai termin terpengaruh',
        impactOnPayment: 'Mengurangi pembayaran',
      },
      {
        label: 'Bonus percepatan',
        amount: 150000000,
        type: CalculationLineType.BONUS,
        description: 'Bonus karena efisiensi material',
        impactOnPayment: 'Menambah pembayaran',
      },
    ];

    const adjustments: CalculationLineItemDto[] = (manualAdjustments ?? []).map((item) => ({
      label: item.label,
      amount: item.amount,
      type: item.type,
      description: item.description ?? 'Penyesuaian manual',
      impactOnPayment: item.amount >= 0 ? 'Menambah pembayaran' : 'Mengurangi pembayaran',
    }));

    return [...base, ...adjustments];
  }

  private buildProvisionalResult(breakdown: CalculationLineItemDto[]): ProvisionalResultDto {
    const gross = breakdown
      .filter((b) => b.type === CalculationLineType.BASE_VALUE)
      .reduce((sum, item) => sum + item.amount, 0);
    const deductions = breakdown
      .filter((b) => b.type === CalculationLineType.DEDUCTION || b.type === CalculationLineType.PENALTY)
      .reduce((sum, item) => sum + item.amount, 0);
    const bonuses = breakdown
      .filter((b) => b.type === CalculationLineType.BONUS)
      .reduce((sum, item) => sum + item.amount, 0);

    const net = gross + deductions + bonuses;

    return {
      grossPayable: gross,
      totalDeductions: Math.abs(deductions),
      totalBonuses: bonuses,
      netPayable: net,
      currency: 'IDR',
      isFinal: false,
    };
  }

  private async buildDefaultEvaluationSnapshot(contractId: string): Promise<EvaluationDataDto> {
    const breakdown = this.buildCalculationBreakdown();
    const provisional = this.buildProvisionalResult(breakdown);
    const auditTrail = await this.fetchAuditTrail(contractId);

    return {
      state: 'EVALUATION_AND_CALCULATION',
      waitingState: EvaluationWaitingState.WAITING_FOR_AUDIT,
      isDataFrozen: false,
      verifiedPerformanceData: this.getVerifiedPerformanceData(),
      appliedContractClauses: this.getAppliedClauses(),
      calculationBreakdown: breakdown,
      provisionalResults: provisional,
      objectionStatus: { status: ObjectionStatusType.NONE },
      correctionRounds: 0,
      objectionDeadline: this.addDays(new Date(), 3).toISOString(),
      correctionDeadline: this.addDays(new Date(), 7).toISOString(),
      waitingFor: 'Menunggu audit hasil perhitungan',
      calculationHash: undefined,
      auditTrail,
    };
  }

  private async mapToEvaluation(record: any, result: any | null): Promise<EvaluationDataDto> {
    const breakdown: CalculationLineItemDto[] = result?.breakdown ?? this.buildCalculationBreakdown();
    const provisional: ProvisionalResultDto = result?.provisional ?? this.buildProvisionalResult(breakdown);
    const auditTrail = await this.fetchAuditTrail(record.contractId);

    return {
      state: record.state ?? 'EVALUATION_AND_CALCULATION',
      waitingState: record.waitingState as EvaluationWaitingState,
      isDataFrozen: record.isDataFrozen,
      verifiedPerformanceData: (result?.verifiedPerformance as any) ?? this.getVerifiedPerformanceData(),
      appliedContractClauses: (result?.appliedClauses as any) ?? this.getAppliedClauses(),
      calculationBreakdown: breakdown,
      provisionalResults: provisional,
      objectionStatus: this.normalizeObjection(result?.objection, record.objectionStatus),
      correctionRounds: record.correctionRounds,
      objectionDeadline: record.objectionDeadline?.toISOString?.() ?? this.addDays(new Date(), 3).toISOString(),
      correctionDeadline: record.correctionDeadline?.toISOString?.() ?? this.addDays(new Date(), 7).toISOString(),
      waitingFor: this.describeWaiting(record.waitingState),
      calculationHash: record.calculationHash ?? undefined,
      auditTrail,
    };
  }

  private describeWaiting(waitingState: EvaluationWaitingState): string {
    switch (waitingState) {
      case EvaluationWaitingState.WAITING_FOR_CORRECTION:
        return 'Menunggu koreksi atas keberatan yang diajukan';
      case EvaluationWaitingState.WAITING_FOR_FINAL_APPROVAL:
        return 'Menunggu persetujuan final dan pembekuan hasil untuk on-chain anchor';
      default:
        return 'Menunggu audit hasil perhitungan';
    }
  }

  private normalizeObjection(objection: any, defaultStatus: string): ObjectionStatusDto {
    if (!objection) {
      return { status: defaultStatus as ObjectionStatusType };
    }
    return {
      status: (objection.status ?? defaultStatus) as ObjectionStatusType,
      submittedAt: objection.submittedAt,
      submittedBy: objection.submittedBy,
      resolutionDeadline: objection.resolutionDeadline,
      resolutionNotes: objection.resolutionNotes,
    };
  }

  private getVerifiedPerformanceData() {
    const now = new Date();
    return [
      {
        milestoneNumber: 1,
        plannedValue: 3300000000,
        actualValue: 3300000000,
        deviation: 0,
        unit: 'IDR',
        evidenceLinks: ['https://example.com/photo-1'],
        verifiedBy: 'SUPERVISOR',
        verifiedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        milestoneNumber: 2,
        plannedValue: 3300000000,
        actualValue: 3300000000,
        deviation: 0,
        unit: 'IDR',
        evidenceLinks: ['https://example.com/photo-2'],
        verifiedBy: 'WITNESS',
        verifiedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }

  private getAppliedClauses() {
    return [
      {
        clauseId: 'CL-4.2',
        title: 'Keterlambatan dan Denda',
        description: 'Denda 1% per minggu keterlambatan',
        appliedReason: 'Milestone 2 terlambat 7 hari',
        impact: 'Pengurangan 7% dari nilai termin terkait',
      },
      {
        clauseId: 'CL-5.1',
        title: 'Bonus Efisiensi',
        description: 'Bonus jika material dihemat',
        appliedReason: 'Efisiensi material 5%',
        impact: 'Bonus 1,5% dari nilai kontrak',
      },
    ];
  }

  private async fetchAuditTrail(contractId: string): Promise<AuditLogItemDto[]> {
    const entries = await this.prisma.auditLog.findMany({
      where: { entityId: contractId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { user: { select: { name: true, id: true } } },
    });

    return entries.map((log) => ({
      action: log.action,
      description: log.description,
      timestamp: log.createdAt.toISOString(),
      actor: log.user?.name ?? log.userId,
    }));
  }

  private generateCalculationHash(contractId: string, breakdown: CalculationLineItemDto[], provisional: ProvisionalResultDto) {
    const serialized = JSON.stringify({ contractId, breakdown, provisional });
    return '0x' + crypto.createHash('sha256').update(serialized).digest('hex');
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private wrapData<T>(message: string, data: T): EvaluationResponseDto<T> {
    return {
      success: true,
      message,
      data,
      error: null,
      timestamp: new Date(),
    };
  }
}
