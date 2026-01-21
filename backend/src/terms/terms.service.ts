import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { JwtPayload } from '../common/jwt-payload.interface';
import { TermStatus, PaymentStatus } from '../common/types';

@Injectable()
export class TermsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(
    contractId: string,
    data: {
      termNumber: number;
      name: string;
      description?: string;
      percentage: number;
      value: number;
    },
    user: JwtPayload,
  ) {
    if (user.role !== 'OWNER') {
      throw new ForbiddenException('Hanya Owner yang dapat membuat termin');
    }

    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { project: true },
    });

    if (!contract) {
      throw new NotFoundException('Kontrak tidak ditemukan');
    }

    // Create term and payment record together
    const term = await this.prisma.term.create({
      data: {
        termNumber: data.termNumber,
        name: data.name,
        description: data.description,
        percentage: data.percentage,
        value: data.value,
        status: TermStatus.DRAFT,
        contractId,
        payment: {
          create: {
            amount: data.value,
            status: PaymentStatus.PENDING,
          },
        },
      },
      include: {
        payment: true,
      },
    });

    await this.auditService.log({
      action: 'CREATE',
      entityType: 'Term',
      entityId: term.id,
      description: `Termin ${data.termNumber} "${data.name}" dibuat dengan nilai Rp ${data.value.toLocaleString('id-ID')}`,
      userId: user.sub,
    });

    return term;
  }

  async findById(id: string) {
    const term = await this.prisma.term.findUnique({
      where: { id },
      include: {
        contract: {
          include: {
            project: {
              include: {
                owner: { select: { id: true, name: true, company: true } },
                contractor: { select: { id: true, name: true, company: true } },
                supervisor: { select: { id: true, name: true, company: true } },
                witness: { select: { id: true, name: true, company: true } },
              },
            },
          },
        },
        progress: {
          orderBy: { createdAt: 'desc' },
          include: {
            uploadedBy: { select: { id: true, name: true } },
          },
        },
        verifications: {
          include: {
            verifier: { select: { id: true, name: true, role: true } },
          },
        },
        payment: true,
      },
    });

    if (!term) {
      throw new NotFoundException('Termin tidak ditemukan');
    }

    return term;
  }

  async findByContract(contractId: string) {
    return this.prisma.term.findMany({
      where: { contractId },
      orderBy: { termNumber: 'asc' },
      include: {
        progress: { orderBy: { createdAt: 'desc' }, take: 1 },
        verifications: true,
        payment: true,
      },
    });
  }

  // Called when 2 verifications are approved - updates term to VALID
  async updateStatusToValid(termId: string, userId: string) {
    const term = await this.prisma.term.update({
      where: { id: termId },
      data: { status: TermStatus.VALID },
    });

    // Also update payment status to READY
    await this.prisma.payment.update({
      where: { termId },
      data: { status: PaymentStatus.READY },
    });

    await this.auditService.log({
      action: 'UPDATE',
      entityType: 'Term',
      entityId: termId,
      description: `Termin "${term.name}" divalidasi dan siap dibayar`,
      userId,
    });

    return term;
  }

  // Called when progress is submitted
  async updateStatusToSubmitted(termId: string, userId: string) {
    const term = await this.prisma.term.update({
      where: { id: termId },
      data: { status: TermStatus.SUBMITTED },
    });

    await this.auditService.log({
      action: 'SUBMIT_PROGRESS',
      entityType: 'Term',
      entityId: termId,
      description: `Progres termin "${term.name}" diajukan untuk verifikasi`,
      userId,
    });

    return term;
  }
}
