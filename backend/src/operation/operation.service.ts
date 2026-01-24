import { Injectable, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  StartOperationDto,
  SubmitReportDto,
  VerifyReportDto,
  OperationStateDto,
  ProgressReportDto,
  GetProgressDto,
  OperationWaitingState,
  ReportStatus,
  VerificationResult,
  MilestoneItemDto,
  ActivityTimelineItemDto,
} from './dto/operation.dto';
import * as crypto from 'crypto';

@Injectable()
export class OperationService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  /**
   * Start contract operation - transition from CONTRACT_ACTIVE_LOCKED to OPERATION_RUNNING
   */
  async startOperation(userId: string, dto: StartOperationDto): Promise<GetProgressDto> {
    // 1. Verify user has permission
    const contract = await this.verifyContractOwnership(dto.contractId, userId);

    // 2. Verify state is CONTRACT_ACTIVE_LOCKED
    const currentState = await this.getOperationState(dto.contractId, userId);
    if (currentState.state !== 'CONTRACT_ACTIVE_LOCKED') {
      throw new ForbiddenException(
        `Kontrak harus dalam status CONTRACT_ACTIVE_LOCKED untuk memulai operasi. Status saat ini: ${currentState.state}`,
      );
    }

    // 3. Verify funds are locked
    if (!currentState.isFundsLocked) {
      throw new ForbiddenException('Dana harus dikunci sebelum operasi dapat dimulai');
    }

    // 4. Verify explicit confirmation
    if (!dto.confirmOperationStart) {
      throw new BadRequestException('Anda harus secara eksplisit mengkonfirmasi memulai operasi');
    }

    // 5. Verify scheduled start time is valid
    const startTime = new Date(dto.scheduledStartTime);
    if (startTime < new Date()) {
      throw new BadRequestException('Waktu mulai operasi tidak boleh di masa lalu');
    }

    // 6. Log to audit trail
    await this.audit.log({
      action: 'OPERATION_STARTED',
      entityType: 'Operation',
      entityId: dto.contractId,
      userId,
      description: JSON.stringify({
        scheduledStartTime: startTime,
        state: 'OPERATION_RUNNING',
        initialWaitingState: 'WAITING_FOR_REPORT',
        activeMilestone: 1,
        confirmOperationStart: dto.confirmOperationStart,
      }),
    });

    // 7. Emit domain event
    this.emitOperationStartedEvent({
      contractId: dto.contractId,
      userId,
      scheduledStartTime: startTime,
    });

    // 8. Return operation state
    return this.getProgress(dto.contractId, userId);
  }

  /**
   * Get current operation state
   */
  async getOperationState(contractId: string, userId: string): Promise<any> {
    // Verify ownership
    await this.verifyContractOwnership(contractId, userId);

    // Check lock status
    const lockLog = await this.prisma.auditLog.findFirst({
      where: {
        entityId: contractId,
        action: 'CONTRACT_FUNDS_LOCKED',
      },
      orderBy: { createdAt: 'desc' },
    });

    // Check operation start
    const operationLog = await this.prisma.auditLog.findFirst({
      where: {
        entityId: contractId,
        action: 'OPERATION_STARTED',
      },
      orderBy: { createdAt: 'desc' },
    });

    let state = lockLog ? 'CONTRACT_ACTIVE_LOCKED' : 'PRE_CONTRACT_REVIEW';
    let isFundsLocked = !!lockLog;

    if (operationLog) {
      state = 'OPERATION_RUNNING';
    }

    return {
      state,
      isFundsLocked,
    };
  }

  /**
   * Submit progress report for milestone
   */
  async submitReport(userId: string, dto: SubmitReportDto): Promise<ProgressReportDto> {
    // 1. Verify ownership
    await this.verifyContractOwnership(dto.contractId, userId);

    // 2. Verify operation is running
    const state = await this.getOperationState(dto.contractId, userId);
    if (state.state !== 'OPERATION_RUNNING') {
      throw new ForbiddenException(
        'Laporan hanya dapat dikirim ketika operasi sedang berjalan',
      );
    }

    // 3. Verify milestone is valid
    const milestones = this.getMockMilestones();
    const milestone = milestones.find((m) => m.milestoneNumber === dto.milestoneNumber);
    if (!milestone) {
      throw new BadRequestException(
        `Milestone ${dto.milestoneNumber} tidak ditemukan dalam kontrak`,
      );
    }

    // 4. Verify completion percentage is valid (0-100)
    if (dto.completionPercentage < 0 || dto.completionPercentage > 100) {
      throw new BadRequestException(
        'Persentase penyelesaian harus antara 0 dan 100',
      );
    }

    // 5. Generate report ID
    const reportId = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const reportHash = dto.reportHash || this.generateReportHash();

    // 6. Create report object
    const report: ProgressReportDto = {
      reportId,
      milestoneNumber: dto.milestoneNumber,
      submittedDate: new Date(),
      submittedBy: 'Contractor', // In production, get from user role
      progressDescription: dto.progressDescription,
      completionPercentage: dto.completionPercentage,
      status: ReportStatus.SUBMITTED,
      verificationNotes: 'Menunggu verifikasi dari ProjectOwner',
      verifiedBy: '',
      verifiedDate: new Date(),
    };

    // 7. Log to audit trail
    await this.audit.log({
      action: 'REPORT_SUBMITTED',
      entityType: 'ProgressReport',
      entityId: `${dto.contractId}-milestone-${dto.milestoneNumber}`,
      userId,
      description: JSON.stringify({
        reportId,
        reportHash,
        milestoneNumber: dto.milestoneNumber,
        completionPercentage: dto.completionPercentage,
        photoUrls: dto.photoUrls,
        submittedBy: 'Contractor',
        progressDescription: dto.progressDescription,
      }),
    });

    // 8. Emit event
    this.emitReportSubmittedEvent({
      contractId: dto.contractId,
      reportId,
      reportHash,
      milestoneNumber: dto.milestoneNumber,
    });

    return report;
  }

  /**
   * Verify submitted report
   */
  async verifyReport(userId: string, dto: VerifyReportDto): Promise<ProgressReportDto> {
    // 1. Verify ownership
    await this.verifyContractOwnership(dto.contractId, userId);

    // 2. Verify operation is running
    const state = await this.getOperationState(dto.contractId, userId);
    if (state.state !== 'OPERATION_RUNNING') {
      throw new ForbiddenException(
        'Verifikasi hanya dapat dilakukan ketika operasi sedang berjalan',
      );
    }

    // 3. Verify milestone exists
    const milestones = this.getMockMilestones();
    const milestone = milestones.find((m) => m.milestoneNumber === dto.milestoneNumber);
    if (!milestone) {
      throw new BadRequestException(
        `Milestone ${dto.milestoneNumber} tidak ditemukan`,
      );
    }

    // 4. Create verification result
    const report: ProgressReportDto = {
      reportId: `report-${Date.now()}`,
      milestoneNumber: dto.milestoneNumber,
      submittedDate: new Date(),
      submittedBy: 'Contractor',
      progressDescription: 'Report disimpan',
      completionPercentage: 100,
      status: dto.result === VerificationResult.APPROVED ? ReportStatus.VERIFIED : ReportStatus.REJECTED,
      verificationNotes: dto.verificationNotes,
      verifiedBy: 'ProjectOwner', // In production, get from user role
      verifiedDate: new Date(),
    };

    // 5. Log to audit trail
    await this.audit.log({
      action: 'REPORT_VERIFIED',
      entityType: 'VerificationResult',
      entityId: `${dto.contractId}-milestone-${dto.milestoneNumber}`,
      userId,
      description: JSON.stringify({
        milestoneNumber: dto.milestoneNumber,
        verificationResult: dto.result,
        verificationNotes: dto.verificationNotes,
        foundIssues: dto.foundIssues,
        verifiedBy: 'ProjectOwner',
      }),
    });

    // 6. If approved, emit event
    if (dto.result === VerificationResult.APPROVED) {
      this.emitReportVerifiedEvent({
        contractId: dto.contractId,
        milestoneNumber: dto.milestoneNumber,
      });
    }

    return report;
  }

  /**
   * Get full progress including state, reports, and timeline
   */
  async getProgress(contractId: string, userId: string): Promise<GetProgressDto> {
    // Verify ownership
    await this.verifyContractOwnership(contractId, userId);

    // Get operation state
    const operationState = await this.buildOperationState(contractId);

    // Get submitted reports (mock)
    const submittedReports = this.getMockSubmittedReports();

    // Get activity timeline
    const activityTimeline = this.getMockActivityTimeline();

    // Get milestone summary
    const milestones = this.getMockMilestones();
    const milestoneSummary = {
      total: milestones.length,
      completed: milestones.filter((m) => m.status === ReportStatus.VERIFIED).length,
      pending: milestones.filter((m) => m.status === ReportStatus.PENDING).length,
      inReview: milestones.filter((m) => m.status === ReportStatus.SUBMITTED).length,
    };

    return {
      operationState,
      submittedReports,
      activityTimeline,
      milestoneSummary,
    };
  }

  /**
   * Helper: Build complete operation state
   */
  private async buildOperationState(contractId: string): Promise<OperationStateDto> {
    const milestones = this.getMockMilestones();
    const operationStartDate = new Date('2026-02-01');
    const now = new Date();
    const daysSinceStart = Math.floor((now.getTime() - operationStartDate.getTime()) / (1000 * 60 * 60 * 24));

    // Get active milestone (first non-completed)
    const activeMilestone = milestones.find((m) => m.status !== ReportStatus.VERIFIED) || milestones[0];
    const targetDate = new Date(activeMilestone.targetCompletionDate);
    const daysUntilDeadline = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isOverdue = daysUntilDeadline < 0;
    const daysOverdue = isOverdue ? Math.abs(daysUntilDeadline) : 0;

    // Calculate overall progress
    const overallProgress = milestones.reduce((sum, m) => {
      if (m.status === ReportStatus.VERIFIED) return sum + m.percentageOfContract;
      return sum;
    }, 0);

    // Determine waiting state
    let waitingState = OperationWaitingState.WAITING_FOR_REPORT;
    let waitingFor = 'Contractor harus menyerahkan laporan kemajuan untuk Milestone 1';

    if (activeMilestone.status === ReportStatus.SUBMITTED) {
      waitingState = OperationWaitingState.WAITING_FOR_VERIFICATION;
      waitingFor = 'ProjectOwner harus memverifikasi laporan yang telah dikirim';
    } else if (activeMilestone.status === ReportStatus.VERIFIED) {
      waitingState = OperationWaitingState.WAITING_FOR_MILESTONE_COMPLETION;
      waitingFor = 'Menunggu penyelesaian milestone berikutnya';
    }

    return {
      state: 'OPERATION_RUNNING',
      waitingState,
      activeMilestoneNumber: activeMilestone.milestoneNumber,
      daysSinceStart: Math.max(0, daysSinceStart),
      daysUntilDeadline,
      milestones,
      currentResponsibleParty: activeMilestone.responsibleParty,
      waitingFor,
      currentDeadline: activeMilestone.targetCompletionDate,
      isOverdue,
      daysOverdue,
      overallProgress: Math.round(overallProgress * 10) / 10,
    };
  }

  /**
   * Helper: Verify contract ownership
   */
  private async verifyContractOwnership(contractId: string, userId: string): Promise<any> {
    if (!contractId || !userId) {
      throw new ForbiddenException('Contract ID dan User ID diperlukan');
    }
    return { contractId, userId };
  }

  /**
   * Helper: Get mock milestones
   */
  private getMockMilestones(): MilestoneItemDto[] {
    return [
      {
        milestoneNumber: 1,
        description: 'Penyiapan Lokasi & Material',
        percentageOfContract: 33.33,
        targetCompletionDate: '2026-02-15',
        amount: 'IDR 3.33 Miliar',
        responsibleParty: 'Contractor',
        deliverables: [
          'Lokasi siap digunakan',
          'Material tersedia di lokasi',
          'Tim kerja terbentuk',
        ],
        status: ReportStatus.SUBMITTED,
      },
      {
        milestoneNumber: 2,
        description: 'Pelaksanaan Pekerjaan Utama',
        percentageOfContract: 33.33,
        targetCompletionDate: '2026-04-15',
        amount: 'IDR 3.33 Miliar',
        responsibleParty: 'Contractor',
        deliverables: [
          'Pekerjaan dilaksanakan sesuai spesifikasi',
          'Laporan mingguan dikirim',
          'Inspeksi mingguan dilakukan',
        ],
        status: ReportStatus.PENDING,
      },
      {
        milestoneNumber: 3,
        description: 'Penyelesaian & Serah Terima',
        percentageOfContract: 33.34,
        targetCompletionDate: '2026-06-15',
        amount: 'IDR 3.34 Miliar',
        responsibleParty: 'Contractor',
        deliverables: [
          'Pekerjaan 100% selesai',
          'Pemeriksaan akhir dilakukan',
          'Serah terima resmi',
        ],
        status: ReportStatus.PENDING,
      },
    ];
  }

  /**
   * Helper: Get mock submitted reports
   */
  private getMockSubmittedReports(): ProgressReportDto[] {
    return [
      {
        reportId: 'report-001',
        milestoneNumber: 1,
        submittedDate: new Date('2026-02-10T14:30:00Z'),
        submittedBy: 'Contractor',
        progressDescription: 'Lokasi sudah siap, material telah tiba 95%',
        completionPercentage: 85,
        status: ReportStatus.SUBMITTED,
        verificationNotes: 'Menunggu inspeksi lapangan',
        verifiedBy: '',
        verifiedDate: new Date(),
      },
    ];
  }

  /**
   * Helper: Get mock activity timeline
   */
  private getMockActivityTimeline(): ActivityTimelineItemDto[] {
    return [
      {
        activityType: 'operation-started',
        description: 'Operasi konstruksi dimulai',
        timestamp: new Date('2026-02-01T08:00:00Z'),
        actor: 'System',
        reference: 'State transition: CONTRACT_ACTIVE_LOCKED → OPERATION_RUNNING',
        status: 'success',
      },
      {
        activityType: 'report-submitted',
        description: 'Laporan Milestone 1 dikirim',
        timestamp: new Date('2026-02-10T14:30:00Z'),
        actor: 'Contractor',
        reference: 'Milestone 1: 85% selesai',
        status: 'success',
      },
      {
        activityType: 'report-pending',
        description: 'Laporan Milestone 1 menunggu verifikasi',
        timestamp: new Date('2026-02-10T15:00:00Z'),
        actor: 'System',
        reference: 'Menunggu ProjectOwner approval',
        status: 'warning',
      },
    ];
  }

  /**
   * Helper: Generate report hash
   */
  private generateReportHash(): string {
    return '0x' + crypto.randomBytes(32).toString('hex');
  }

  /**
   * Helper: Emit domain events (mock)
   */
  private emitOperationStartedEvent(event: {
    contractId: string;
    userId: string;
    scheduledStartTime: Date;
  }): void {
    console.log('[EVENT] OperationStarted:', event);
  }

  private emitReportSubmittedEvent(event: {
    contractId: string;
    reportId: string;
    reportHash: string;
    milestoneNumber: number;
  }): void {
    console.log('[EVENT] ReportSubmitted:', event);
  }

  private emitReportVerifiedEvent(event: {
    contractId: string;
    milestoneNumber: number;
  }): void {
    console.log('[EVENT] ReportVerified:', event);
  }
}
