import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentStatus, PaymentMethod, PhaseStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import {
  PaginationDto,
  createPaginatedResult,
} from '../../common/dto/pagination.dto';

interface CreatePaymentDto {
  contractId: string;
  workPhaseId?: string;
  amount: number;
  currency?: string;
  method?: PaymentMethod;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
}

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreatePaymentDto, user: JwtPayload) {
    // Verify contract exists
    const contract = await this.prisma.contract.findUnique({
      where: { id: dto.contractId },
    });

    if (!contract || contract.deletedAt) {
      throw new NotFoundException('Kontrak tidak ditemukan');
    }

    // If work phase specified, verify it's approved
    if (dto.workPhaseId) {
      const workPhase = await this.prisma.workPhase.findUnique({
        where: { id: dto.workPhaseId },
      });

      if (!workPhase || workPhase.deletedAt) {
        throw new NotFoundException('Termin tidak ditemukan');
      }

      if (workPhase.status !== PhaseStatus.APPROVED) {
        throw new BadRequestException(
          'Pembayaran hanya dapat dibuat untuk termin yang sudah disetujui',
        );
      }
    }

    const paymentNumber = this.generatePaymentNumber();

    const payment = await this.prisma.payment.create({
      data: {
        paymentNumber,
        amount: dto.amount,
        currency: dto.currency || 'IDR',
        method: dto.method,
        status: PaymentStatus.PENDING,
        bankName: dto.bankName,
        accountNumber: dto.accountNumber,
        accountName: dto.accountName,
        contractId: dto.contractId,
        workPhaseId: dto.workPhaseId,
      },
      include: {
        contract: {
          select: { id: true, title: true, contractNumber: true },
        },
        workPhase: {
          select: { id: true, name: true, phaseNumber: true },
        },
      },
    });

    await this.auditService.log({
      userId: user.sub,
      action: 'PAYMENT',
      entityType: 'Payment',
      entityId: payment.id,
      description: `Pembayaran ${payment.paymentNumber} dibuat: ${dto.amount} ${dto.currency || 'IDR'}`,
      contractId: dto.contractId,
    });

    return payment;
  }

  async findAll(pagination: PaginationDto, contractId?: string) {
    const where = {
      deletedAt: null,
      ...(contractId && { contractId }),
    };

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
        include: {
          contract: {
            select: { id: true, title: true, contractNumber: true },
          },
          workPhase: {
            select: { id: true, name: true, phaseNumber: true },
          },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return createPaginatedResult(payments, total, pagination);
  }

  async findById(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        contract: {
          include: {
            project: {
              select: { id: true, name: true, projectCode: true },
            },
          },
        },
        workPhase: true,
        evidenceFiles: true,
      },
    });

    if (!payment || payment.deletedAt) {
      throw new NotFoundException('Pembayaran tidak ditemukan');
    }

    return payment;
  }

  async updateStatus(id: string, status: PaymentStatus, user: JwtPayload) {
    const payment = await this.findById(id);

    const updated = await this.prisma.payment.update({
      where: { id },
      data: {
        status,
        ...(status === PaymentStatus.COMPLETED && { paidAt: new Date() }),
      },
    });

    await this.auditService.log({
      userId: user.sub,
      action: 'UPDATE',
      entityType: 'Payment',
      entityId: id,
      description: `Status pembayaran diubah menjadi ${status}`,
      contractId: payment.contractId,
      oldValue: JSON.stringify({ status: payment.status }),
      newValue: JSON.stringify({ status }),
    });

    // If payment completed, update work phase status
    if (status === PaymentStatus.COMPLETED && payment.workPhaseId) {
      await this.prisma.workPhase.update({
        where: { id: payment.workPhaseId },
        data: { status: PhaseStatus.PAID },
      });
    }

    return updated;
  }

  async processPayment(
    id: string,
    transactionRef: string,
    user: JwtPayload,
  ) {
    const payment = await this.findById(id);

    if (payment.status !== PaymentStatus.APPROVED) {
      throw new BadRequestException(
        'Pembayaran harus disetujui sebelum diproses',
      );
    }

    const updated = await this.prisma.payment.update({
      where: { id },
      data: {
        status: PaymentStatus.PROCESSING,
        transactionRef,
      },
    });

    await this.auditService.log({
      userId: user.sub,
      action: 'PAYMENT',
      entityType: 'Payment',
      entityId: id,
      description: `Pembayaran diproses dengan referensi: ${transactionRef}`,
      contractId: payment.contractId,
    });

    return updated;
  }

  async simulateSmartContractPayment(
    id: string,
    user: JwtPayload,
  ) {
    const payment = await this.findById(id);

    // Simulate smart contract transaction
    const simulatedTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    const simulatedContractRef = `AMANTRA-${payment.paymentNumber}`;

    const updated = await this.prisma.payment.update({
      where: { id },
      data: {
        method: PaymentMethod.SMART_CONTRACT,
        blockchainTxHash: simulatedTxHash,
        smartContractRef: simulatedContractRef,
        status: PaymentStatus.COMPLETED,
        paidAt: new Date(),
      },
    });

    await this.auditService.log({
      userId: user.sub,
      action: 'PAYMENT',
      entityType: 'Payment',
      entityId: id,
      description: `Pembayaran via smart contract (simulasi): ${simulatedTxHash}`,
      contractId: payment.contractId,
    });

    return updated;
  }

  private generatePaymentNumber(): string {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PAY-${year}${month}-${random}`;
  }
}
