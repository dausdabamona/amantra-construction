import { Injectable, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  LockFundsDto,
  ContractStateDto,
  LockedStatusCardDto,
  RightObligationItemDto,
  NextConditionDto,
  LockFundsResponseDto,
  ContractStateResponseDto,
} from './dto/lock.dto';
import * as crypto from 'crypto';

@Injectable()
export class LockService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  /**
   * Lock contract funds - transition from PRE_CONTRACT_REVIEW to CONTRACT_ACTIVE_LOCKED
   */
  async lockFunds(userId: string, dto: LockFundsDto): Promise<LockFundsResponseDto> {
    // 1. Verify user has permission
    const contract = await this.verifyContractOwnership(dto.contractId, userId);

    // 2. Verify state is PRE_CONTRACT_REVIEW
    const currentState = await this.getContractState(dto.contractId, userId);
    if (currentState.state !== 'PRE_CONTRACT_REVIEW') {
      throw new ForbiddenException(
        `Kontrak harus dalam status PRE_CONTRACT_REVIEW untuk dikunci. Status saat ini: ${currentState.state}`,
      );
    }

    // 3. Verify pre-contract approval
    const preApprovalLog = await this.prisma.auditLog.findFirst({
      where: {
        userId,
        entityId: dto.contractId,
        action: 'CONTRACT_PRE_APPROVED_LOCK_INITIATED',
      },
    });

    if (!preApprovalLog) {
      throw new ForbiddenException('Persetujuan pra-kontrak belum diselesaikan');
    }

    // 4. Verify cooldown is complete
    const ackLog = await this.prisma.auditLog.findFirst({
      where: {
        userId,
        entityId: dto.contractId,
        action: 'CONTRACT_REVIEW_ACKNOWLEDGED',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (ackLog) {
      // Parse description as JSON to get cooldownEndTime
      let cooldownEndTime = null;
      try {
        const desc = JSON.parse(ackLog.description || '{}');
        cooldownEndTime = desc?.cooldownEndTime;
      } catch {
        // Description is not JSON, skip
      }
      if (cooldownEndTime && Date.now() < new Date(cooldownEndTime).getTime()) {
        throw new ForbiddenException(
          `Periode pendinginan belum berakhir. Tunggu hingga ${new Date(cooldownEndTime).toISOString()}`,
        );
      }
    }

    // 5. Verify explicit confirmation
    if (!dto.confirmLockFunds) {
      throw new BadRequestException('Anda harus secara eksplisit mengkonfirmasi penguncian dana');
    }

    // 6. Generate transaction hash (mock)
    const txHash = this.generateTxHash();
    const lockTimestamp = new Date();

    // 7. Log to audit trail (immutable)
    await this.audit.log({
      action: 'CONTRACT_FUNDS_LOCKED',
      entityType: 'ContractLock',
      entityId: dto.contractId,
      userId,
      description: JSON.stringify({
        lockedAmount: dto.amount,
        lockTimestamp,
        transactionHash: txHash,
        state: 'CONTRACT_ACTIVE_LOCKED',
        escrowStatus: 'HELD',
        confirmLockFunds: dto.confirmLockFunds,
      }),
    });

    // 8. Emit domain event (would be published via event bus in production)
    this.emitContractLockedEvent({
      contractId: dto.contractId,
      amount: dto.amount,
      userId,
      timestamp: lockTimestamp,
      txHash,
    });

    // 9. Return new state
    return {
      success: true,
      message: 'Dana berhasil dikunci dalam escrow. Kontrak sekarang aktif dan binding.',
      data: await this.getContractState(dto.contractId, userId),
      error: null,
      timestamp: new Date(),
    };
  }

  /**
   * Get current contract state - comprehensive state information
   */
  async getContractState(contractId: string, userId: string): Promise<ContractStateDto> {
    // Verify ownership
    await this.verifyContractOwnership(contractId, userId);

    // Check if funds are locked
    const lockLog = await this.prisma.auditLog.findFirst({
      where: {
        entityId: contractId,
        action: 'CONTRACT_FUNDS_LOCKED',
      },
      orderBy: { createdAt: 'desc' },
    });

    const preApprovalLog = await this.prisma.auditLog.findFirst({
      where: {
        entityId: contractId,
        action: 'CONTRACT_PRE_APPROVED_LOCK_INITIATED',
      },
      orderBy: { createdAt: 'desc' },
    });

    // Determine current state
    let state: 'INTENT_DECLARED' | 'PRE_CONTRACT_REVIEW' | 'CONTRACT_ACTIVE_LOCKED' | 'OPERATION_RUNNING' =
      'INTENT_DECLARED';
    let lockedAmount = 0;
    let lockTimestamp: Date | null = null;
    let txHash: string | null = null;
    let isFundsLocked = false;

    if (lockLog) {
      state = 'CONTRACT_ACTIVE_LOCKED';
      // Parse description as JSON
      try {
        const desc = JSON.parse(lockLog.description || '{}');
        lockedAmount = desc?.lockedAmount || 0;
        txHash = desc?.transactionHash;
      } catch {
        lockedAmount = 0;
        txHash = null;
      }
      lockTimestamp = lockLog.createdAt;
      isFundsLocked = true;
    } else if (preApprovalLog) {
      state = 'PRE_CONTRACT_REVIEW';
    } else {
      state = 'INTENT_DECLARED';
    }

    // Mock operation start date (from contract, in production)
    const operationStartDate = '2026-02-01';

    // Calculate days remaining
    const now = new Date();
    const startDate = new Date(operationStartDate);
    const daysRemaining = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      state,
      lockedAmount,
      lockTimestamp,
      lockingTxHash: txHash,
      currentMilestone: 1,
      substatus: isFundsLocked ? 'AWAITING_OPERATION_START' : 'AWAITING_LOCK',
      isFundsLocked,
      operationStartDate: isFundsLocked ? operationStartDate : null,
      nextResponsibleParty: isFundsLocked ? 'Contractor' : 'ProjectOwner',
      rightsObligations: {
        contractor: [
          'Hak: Akses ke lokasi konstruksi selama masa kontrak',
          'Hak: Memperoleh pembayaran sesuai milestone yang diselesaikan',
          'Hak: Menerima material berkualitas dari pemilik proyek',
          'Kewajiban: Menyediakan pekerja terampil dan berpengalaman',
          'Kewajiban: Mematuhi standar keselamatan kerja',
          'Kewajiban: Menyelesaikan pekerjaan sesuai jadwal dan spesifikasi',
        ],
        projectOwner: [
          'Hak: Memantau kemajuan pekerjaan secara berkala',
          'Hak: Melakukan inspeksi kualitas pekerjaan',
          'Hak: Menolak pekerjaan yang tidak memenuhi standar',
          'Kewajiban: Memberikan akses ke lokasi konstruksi',
          'Kewajiban: Menyediakan material yang dijanjikan',
          'Kewajiban: Melakukan pembayaran tepat waktu sesuai milestone',
        ],
      },
    };
  }

  /**
   * Get locked status card information
   */
  async getLockedStatusCard(contractId: string, userId: string): Promise<LockedStatusCardDto> {
    // Verify ownership
    await this.verifyContractOwnership(contractId, userId);

    // Get lock log
    const lockLog = await this.prisma.auditLog.findFirst({
      where: {
        entityId: contractId,
        action: 'CONTRACT_FUNDS_LOCKED',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!lockLog) {
      throw new ForbiddenException('Kontrak belum dikunci');
    }

    // Parse description as JSON
    let lockedAmount = 0;
    let txHash = '';
    try {
      const desc = JSON.parse(lockLog.description || '{}');
      lockedAmount = desc?.lockedAmount || 0;
      txHash = desc?.transactionHash || '';
    } catch {
      // Description is not JSON
    }

    return {
      lockedAmount,
      lockTimestamp: lockLog.createdAt,
      transactionHash: txHash,
      explorerLink: this.getExplorerLink(txHash),
      holdingStatus: 'ESCROW_HELD',
      percentageHeld: 100,
    };
  }

  /**
   * Get rights and obligations
   */
  async getRightsObligations(contractId: string, userId: string): Promise<RightObligationItemDto[]> {
    // Verify ownership
    await this.verifyContractOwnership(contractId, userId);

    return [
      {
        itemId: 'RO-001',
        type: 'right',
        party: 'Contractor',
        description: 'Akses ke lokasi konstruksi',
        details: 'Hak untuk mengakses lokasi konstruksi tanpa hambatan selama periode kontrak',
        importance: 'critical',
        contractReference: 'Section 3.1',
      },
      {
        itemId: 'RO-002',
        type: 'right',
        party: 'Contractor',
        description: 'Pembayaran milestone',
        details: 'Hak menerima pembayaran IDR 3.33 Miliar per milestone yang diselesaikan',
        importance: 'critical',
        contractReference: 'Section 5.1',
      },
      {
        itemId: 'RO-003',
        type: 'right',
        party: 'Contractor',
        description: 'Material dari pemilik proyek',
        details: 'Hak menerima material berkualitas sesuai spesifikasi yang dijanjikan',
        importance: 'high',
        contractReference: 'Section 2.3',
      },
      {
        itemId: 'RO-004',
        type: 'obligation',
        party: 'Contractor',
        description: 'Pekerja terampil',
        details: 'Wajib menyediakan pekerja berkualifikasi dan berpengalaman minimal 5 tahun',
        importance: 'critical',
        contractReference: 'Section 3.2',
      },
      {
        itemId: 'RO-005',
        type: 'obligation',
        party: 'Contractor',
        description: 'Keselamatan kerja',
        details: 'Wajib menerapkan protokol keselamatan kerja dan asuransi minimal IDR 5 Miliar',
        importance: 'critical',
        contractReference: 'Section 3.5',
      },
      {
        itemId: 'RO-006',
        type: 'obligation',
        party: 'Contractor',
        description: 'Kualitas pekerjaan',
        details: 'Wajib menyelesaikan pekerjaan sesuai spesifikasi dan standar industri',
        importance: 'critical',
        contractReference: 'Section 4.1',
      },
      {
        itemId: 'RO-007',
        type: 'right',
        party: 'ProjectOwner',
        description: 'Inspeksi berkala',
        details: 'Hak melakukan inspeksi mingguan terhadap kemajuan dan kualitas pekerjaan',
        importance: 'high',
        contractReference: 'Section 4.2',
      },
      {
        itemId: 'RO-008',
        type: 'right',
        party: 'ProjectOwner',
        description: 'Penolakan pekerjaan',
        details: 'Hak menolak pekerjaan yang tidak memenuhi standar tanpa penalti',
        importance: 'high',
        contractReference: 'Section 4.3',
      },
      {
        itemId: 'RO-009',
        type: 'obligation',
        party: 'ProjectOwner',
        description: 'Akses lokasi',
        details: 'Wajib memberikan akses penuh ke lokasi konstruksi bagi tim kontraktor',
        importance: 'high',
        contractReference: 'Section 2.1',
      },
      {
        itemId: 'RO-010',
        type: 'obligation',
        party: 'ProjectOwner',
        description: 'Pembayaran tepat waktu',
        details: 'Wajib melakukan pembayaran milestone dalam 7 hari setelah persetujuan',
        importance: 'critical',
        contractReference: 'Section 5.2',
      },
    ];
  }

  /**
   * Get next condition/action
   */
  async getNextCondition(contractId: string, userId: string): Promise<NextConditionDto> {
    // Verify ownership
    await this.verifyContractOwnership(contractId, userId);

    // Get contract state
    const state = await this.getContractState(contractId, userId);

    if (!state.isFundsLocked) {
      return {
        actionRequired: 'CONTRACT_LOCK_REQUIRED',
        responsibleParty: 'ProjectOwner',
        description: 'Dana kontrak harus dikunci dalam escrow sebelum operasi dapat dimulai',
        deadline: '2026-01-31',
        daysRemaining: Math.ceil((new Date('2026-01-31').getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        consequence: 'Jika tidak dikunci, kontrak dapat dibatalkan oleh pemilik proyek',
        isOverdue: false,
        isBlocking: true,
      };
    }

    // Operation start is required
    const operationStartDate = state.operationStartDate || '2026-02-01';
    const daysRemaining = Math.ceil(
      (new Date(operationStartDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );

    return {
      actionRequired: 'OPERATION_START_CONFIRMATION',
      responsibleParty: 'Contractor',
      description:
        'Kontraktor harus mengkonfirmasi siap memulai pekerjaan. Penguncian dana berarti komitmen untuk memulai pada tanggal yang dijadwalkan.',
      deadline: operationStartDate,
      daysRemaining: Math.max(0, daysRemaining),
      consequence:
        'Jika kontraktor tidak memulai pada tanggal yang dijadwalkan, pemilik proyek dapat membatalkan dan menjalankan denda keterlambatan.',
      isOverdue: daysRemaining < 0,
      isBlocking: false,
    };
  }

  /**
   * Helper: Verify contract ownership
   */
  private async verifyContractOwnership(contractId: string, userId: string): Promise<any> {
    // In production, fetch from database and verify user is owner or contractor
    // For now, mock verification
    if (!contractId || !userId) {
      throw new ForbiddenException('Contract ID dan User ID diperlukan');
    }
    return { contractId, userId };
  }

  /**
   * Helper: Generate mock transaction hash
   */
  private generateTxHash(): string {
    return '0x' + crypto.randomBytes(32).toString('hex');
  }

  /**
   * Helper: Get blockchain explorer link
   */
  private getExplorerLink(txHash: string): string {
    if (!txHash) return '';
    // Adjust for actual blockchain network
    return `https://etherscan.io/tx/${txHash}`;
  }

  /**
   * Helper: Emit domain event (mock)
   */
  private emitContractLockedEvent(event: {
    contractId: string;
    amount: number;
    userId: string;
    timestamp: Date;
    txHash: string;
  }): void {
    // In production, publish via event bus (e.g., Kafka, RabbitMQ)
    console.log('[EVENT] ContractLocked:', event);
  }
}
