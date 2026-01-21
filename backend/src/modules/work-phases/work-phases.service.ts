import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PhaseStatus, Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

interface CreateWorkPhaseDto {
  contractId: string;
  phaseNumber: number;
  name: string;
  description?: string;
  deliverables: string;
  acceptanceCriteria?: string;
  phaseValue: number;
  paymentPercentage: number;
  plannedStartDate: string;
  plannedEndDate: string;
  minVerifications?: number;
}

@Injectable()
export class WorkPhasesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateWorkPhaseDto, user: JwtPayload) {
    // Verify contract exists
    const contract = await this.prisma.contract.findUnique({
      where: { id: dto.contractId },
    });

    if (!contract || contract.deletedAt) {
      throw new NotFoundException('Kontrak tidak ditemukan');
    }

    // Check if phase number already exists
    const existingPhase = await this.prisma.workPhase.findFirst({
      where: {
        contractId: dto.contractId,
        phaseNumber: dto.phaseNumber,
        deletedAt: null,
      },
    });

    if (existingPhase) {
      throw new BadRequestException(
        `Termin nomor ${dto.phaseNumber} sudah ada untuk kontrak ini`,
      );
    }

    const workPhase = await this.prisma.workPhase.create({
      data: {
        contractId: dto.contractId,
        phaseNumber: dto.phaseNumber,
        name: dto.name,
        description: dto.description,
        deliverables: dto.deliverables,
        acceptanceCriteria: dto.acceptanceCriteria,
        phaseValue: dto.phaseValue,
        paymentPercentage: dto.paymentPercentage,
        plannedStartDate: new Date(dto.plannedStartDate),
        plannedEndDate: new Date(dto.plannedEndDate),
        minVerifications: dto.minVerifications || 2,
        status: PhaseStatus.PENDING,
      },
    });

    await this.auditService.log({
      userId: user.sub,
      action: 'CREATE',
      entityType: 'WorkPhase',
      entityId: workPhase.id,
      description: `Termin "${workPhase.name}" dibuat`,
      contractId: dto.contractId,
    });

    return workPhase;
  }

  async findByContract(contractId: string) {
    return this.prisma.workPhase.findMany({
      where: {
        contractId,
        deletedAt: null,
      },
      orderBy: { phaseNumber: 'asc' },
      include: {
        progressReports: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        verifications: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            progressReports: true,
            verifications: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
    const workPhase = await this.prisma.workPhase.findUnique({
      where: { id },
      include: {
        contract: {
          include: {
            project: {
              select: { id: true, name: true, projectCode: true },
            },
          },
        },
        progressReports: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          include: {
            submittedBy: {
              select: { id: true, fullName: true },
            },
            evidenceFiles: true,
          },
        },
        verifications: {
          orderBy: { createdAt: 'desc' },
          include: {
            verifier: {
              select: { id: true, fullName: true, role: true },
            },
          },
        },
        payments: {
          where: { deletedAt: null },
        },
      },
    });

    if (!workPhase || workPhase.deletedAt) {
      throw new NotFoundException('Termin tidak ditemukan');
    }

    return workPhase;
  }

  async startPhase(id: string, user: JwtPayload) {
    const workPhase = await this.findById(id);

    if (workPhase.status !== PhaseStatus.PENDING) {
      throw new BadRequestException('Termin sudah dimulai atau selesai');
    }

    const updated = await this.prisma.workPhase.update({
      where: { id },
      data: {
        status: PhaseStatus.IN_PROGRESS,
        actualStartDate: new Date(),
      },
    });

    await this.auditService.log({
      userId: user.sub,
      action: 'UPDATE',
      entityType: 'WorkPhase',
      entityId: id,
      description: `Termin "${workPhase.name}" dimulai`,
      contractId: workPhase.contractId,
    });

    return updated;
  }

  async updateProgress(id: string, completionPercentage: number, user: JwtPayload) {
    const workPhase = await this.findById(id);

    if (completionPercentage < 0 || completionPercentage > 100) {
      throw new BadRequestException('Persentase harus antara 0 dan 100');
    }

    const updated = await this.prisma.workPhase.update({
      where: { id },
      data: { completionPercentage },
    });

    await this.auditService.log({
      userId: user.sub,
      action: 'UPDATE',
      entityType: 'WorkPhase',
      entityId: id,
      description: `Progress termin diupdate menjadi ${completionPercentage}%`,
      contractId: workPhase.contractId,
      oldValue: JSON.stringify({ completionPercentage: workPhase.completionPercentage }),
      newValue: JSON.stringify({ completionPercentage }),
    });

    return updated;
  }

  async submitForVerification(id: string, user: JwtPayload) {
    const workPhase = await this.findById(id);

    if (workPhase.status !== PhaseStatus.IN_PROGRESS) {
      throw new BadRequestException('Termin belum dimulai atau sudah dalam verifikasi');
    }

    const updated = await this.prisma.workPhase.update({
      where: { id },
      data: { status: PhaseStatus.PENDING_VERIFICATION },
    });

    await this.auditService.log({
      userId: user.sub,
      action: 'SUBMIT',
      entityType: 'WorkPhase',
      entityId: id,
      description: `Termin "${workPhase.name}" diajukan untuk verifikasi`,
      contractId: workPhase.contractId,
    });

    return updated;
  }

  async checkVerificationComplete(id: string, user: JwtPayload) {
    const workPhase = await this.findById(id);

    const approvedVerifications = workPhase.verifications.filter(
      (v) => v.status === 'APPROVED',
    );

    if (approvedVerifications.length >= workPhase.minVerifications) {
      const updated = await this.prisma.workPhase.update({
        where: { id },
        data: {
          status: PhaseStatus.VERIFIED,
          completionPercentage: 100,
        },
      });

      await this.auditService.log({
        userId: user.sub,
        action: 'VERIFY',
        entityType: 'WorkPhase',
        entityId: id,
        description: `Termin "${workPhase.name}" terverifikasi (${approvedVerifications.length}/${workPhase.minVerifications} verifikasi)`,
        contractId: workPhase.contractId,
      });

      return updated;
    }

    return workPhase;
  }

  async approvePhase(id: string, user: JwtPayload) {
    const workPhase = await this.findById(id);

    if (workPhase.status !== PhaseStatus.VERIFIED) {
      throw new BadRequestException('Termin belum terverifikasi');
    }

    const updated = await this.prisma.workPhase.update({
      where: { id },
      data: {
        status: PhaseStatus.APPROVED,
        actualEndDate: new Date(),
      },
    });

    await this.auditService.log({
      userId: user.sub,
      action: 'APPROVE',
      entityType: 'WorkPhase',
      entityId: id,
      description: `Termin "${workPhase.name}" disetujui, siap untuk pembayaran`,
      contractId: workPhase.contractId,
    });

    return updated;
  }

  async softDelete(id: string, user: JwtPayload) {
    const workPhase = await this.findById(id);

    await this.prisma.workPhase.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditService.log({
      userId: user.sub,
      action: 'DELETE',
      entityType: 'WorkPhase',
      entityId: id,
      description: `Termin "${workPhase.name}" dihapus`,
      contractId: workPhase.contractId,
    });

    return { message: 'Termin berhasil dihapus' };
  }
}
