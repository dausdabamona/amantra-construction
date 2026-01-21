import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { JwtPayload } from '../common/jwt-payload.interface';
import { PaymentStatus, TermStatus } from '../common/types';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async confirmPayment(
    termId: string,
    data: { proofUrl?: string; transactionRef?: string },
    user: JwtPayload,
  ) {
    if (user.role !== 'OWNER') {
      throw new ForbiddenException('Hanya Owner yang dapat mengkonfirmasi pembayaran');
    }

    const term = await this.prisma.term.findUnique({
      where: { id: termId },
      include: {
        contract: { include: { project: true } },
        payment: true,
      },
    });

    if (!term) {
      throw new NotFoundException('Termin tidak ditemukan');
    }

    // Check if user is the owner of this project
    if (term.contract.project.ownerId !== user.sub) {
      throw new ForbiddenException('Anda bukan owner proyek ini');
    }

    // Can only pay if status is VALID or payment status is READY
    if (term.status !== TermStatus.VALID || term.payment?.status !== PaymentStatus.READY) {
      throw new BadRequestException('Termin belum valid untuk dibayar');
    }

    // Update payment
    const payment = await this.prisma.payment.update({
      where: { termId },
      data: {
        status: PaymentStatus.PAID,
        proofUrl: data.proofUrl,
        transactionRef: data.transactionRef,
        paidAt: new Date(),
      },
    });

    // Update term status to PAID
    await this.prisma.term.update({
      where: { id: termId },
      data: { status: TermStatus.PAID },
    });

    await this.auditService.log({
      action: 'PAYMENT_CONFIRM',
      entityType: 'Payment',
      entityId: payment.id,
      description: `Pembayaran termin "${term.name}" dikonfirmasi sebesar Rp ${payment.amount.toLocaleString('id-ID')}`,
      userId: user.sub,
    });

    return payment;
  }

  async getPaymentStatus(termId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { termId },
      include: {
        term: {
          include: {
            verifications: {
              include: {
                verifier: { select: { id: true, name: true, role: true } },
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment tidak ditemukan');
    }

    return payment;
  }

  async getReadyPayments(user: JwtPayload) {
    if (user.role !== 'OWNER') {
      return [];
    }

    return this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.READY,
        term: {
          contract: {
            project: {
              ownerId: user.sub,
            },
          },
        },
      },
      include: {
        term: {
          include: {
            contract: {
              include: {
                project: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });
  }
}
