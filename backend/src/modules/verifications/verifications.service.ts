import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  VerificationType,
  VerificationStatus,
  UserRole,
  Prisma,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { WorkPhasesService } from '../work-phases/work-phases.service';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

interface CreateVerificationDto {
  workPhaseId?: string;
  progressReportId?: string;
  type: VerificationType;
  comments?: string;
  findings?: string;
  recommendations?: string;
  checklistItems?: string;
}

@Injectable()
export class VerificationsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private workPhasesService: WorkPhasesService,
  ) {}

  async create(dto: CreateVerificationDto, user: JwtPayload) {
    // Validate that user has the right role for the verification type
    this.validateVerifierRole(dto.type, user.role);

    // Check if work phase or progress report exists
    if (dto.workPhaseId) {
      const workPhase = await this.prisma.workPhase.findUnique({
        where: { id: dto.workPhaseId },
      });
      if (!workPhase || workPhase.deletedAt) {
        throw new NotFoundException('Termin tidak ditemukan');
      }
    }

    if (dto.progressReportId) {
      const report = await this.prisma.progressReport.findUnique({
        where: { id: dto.progressReportId },
      });
      if (!report || report.deletedAt) {
        throw new NotFoundException('Laporan progres tidak ditemukan');
      }
    }

    // Check for duplicate verification by same user
    const existingVerification = await this.prisma.verification.findFirst({
      where: {
        verifierId: user.sub,
        workPhaseId: dto.workPhaseId || undefined,
        progressReportId: dto.progressReportId || undefined,
        type: dto.type,
      },
    });

    if (existingVerification) {
      throw new BadRequestException(
        'Anda sudah melakukan verifikasi untuk item ini',
      );
    }

    const verification = await this.prisma.verification.create({
      data: {
        type: dto.type,
        status: VerificationStatus.PENDING,
        comments: dto.comments,
        findings: dto.findings,
        recommendations: dto.recommendations,
        checklistItems: dto.checklistItems,
        verifierId: user.sub,
        workPhaseId: dto.workPhaseId,
        progressReportId: dto.progressReportId,
      },
      include: {
        verifier: {
          select: { id: true, fullName: true, role: true },
        },
      },
    });

    // Get contract ID for audit
    let contractId: string | undefined;
    if (dto.workPhaseId) {
      const phase = await this.prisma.workPhase.findUnique({
        where: { id: dto.workPhaseId },
        select: { contractId: true },
      });
      contractId = phase?.contractId;
    }

    await this.auditService.log({
      userId: user.sub,
      action: 'CREATE',
      entityType: 'Verification',
      entityId: verification.id,
      description: `Verifikasi ${dto.type} dibuat`,
      contractId,
    });

    return verification;
  }

  async approve(id: string, signatureHash: string, user: JwtPayload) {
    const verification = await this.findById(id);

    if (verification.verifierId !== user.sub) {
      throw new ForbiddenException('Hanya pembuat verifikasi yang dapat menyetujui');
    }

    if (verification.status !== VerificationStatus.PENDING) {
      throw new BadRequestException('Verifikasi sudah diproses');
    }

    const updated = await this.prisma.verification.update({
      where: { id },
      data: {
        status: VerificationStatus.APPROVED,
        signatureHash,
        verifiedAt: new Date(),
      },
    });

    // Get contract ID for audit
    let contractId: string | undefined;
    if (verification.workPhaseId) {
      const phase = await this.prisma.workPhase.findUnique({
        where: { id: verification.workPhaseId },
        select: { contractId: true },
      });
      contractId = phase?.contractId;
    }

    await this.auditService.log({
      userId: user.sub,
      action: 'APPROVE',
      entityType: 'Verification',
      entityId: id,
      description: `Verifikasi ${verification.type} disetujui`,
      contractId,
    });

    // Check if work phase verification is complete
    if (verification.workPhaseId) {
      await this.workPhasesService.checkVerificationComplete(
        verification.workPhaseId,
        user,
      );
    }

    return updated;
  }

  async reject(
    id: string,
    reason: string,
    user: JwtPayload,
  ) {
    const verification = await this.findById(id);

    if (verification.verifierId !== user.sub) {
      throw new ForbiddenException('Hanya pembuat verifikasi yang dapat menolak');
    }

    if (verification.status !== VerificationStatus.PENDING) {
      throw new BadRequestException('Verifikasi sudah diproses');
    }

    const updated = await this.prisma.verification.update({
      where: { id },
      data: {
        status: VerificationStatus.REJECTED,
        comments: reason,
        verifiedAt: new Date(),
      },
    });

    // Get contract ID for audit
    let contractId: string | undefined;
    if (verification.workPhaseId) {
      const phase = await this.prisma.workPhase.findUnique({
        where: { id: verification.workPhaseId },
        select: { contractId: true },
      });
      contractId = phase?.contractId;
    }

    await this.auditService.log({
      userId: user.sub,
      action: 'REJECT',
      entityType: 'Verification',
      entityId: id,
      description: `Verifikasi ${verification.type} ditolak: ${reason}`,
      contractId,
    });

    return updated;
  }

  async requestRevision(
    id: string,
    feedback: string,
    user: JwtPayload,
  ) {
    const verification = await this.findById(id);

    if (verification.verifierId !== user.sub) {
      throw new ForbiddenException(
        'Hanya pembuat verifikasi yang dapat meminta revisi',
      );
    }

    const updated = await this.prisma.verification.update({
      where: { id },
      data: {
        status: VerificationStatus.REVISION_REQUESTED,
        recommendations: feedback,
      },
    });

    await this.auditService.log({
      userId: user.sub,
      action: 'UPDATE',
      entityType: 'Verification',
      entityId: id,
      description: `Revisi diminta untuk verifikasi ${verification.type}`,
    });

    return updated;
  }

  async findById(id: string) {
    const verification = await this.prisma.verification.findUnique({
      where: { id },
      include: {
        verifier: {
          select: { id: true, fullName: true, role: true, email: true },
        },
        workPhase: {
          select: { id: true, name: true, phaseNumber: true, contractId: true },
        },
        progressReport: {
          select: { id: true, title: true, reportNumber: true },
        },
        evidenceFiles: true,
      },
    });

    if (!verification) {
      throw new NotFoundException('Verifikasi tidak ditemukan');
    }

    return verification;
  }

  async findByWorkPhase(workPhaseId: string) {
    return this.prisma.verification.findMany({
      where: { workPhaseId },
      orderBy: { createdAt: 'desc' },
      include: {
        verifier: {
          select: { id: true, fullName: true, role: true },
        },
      },
    });
  }

  async findPendingForUser(userId: string) {
    return this.prisma.verification.findMany({
      where: {
        verifierId: userId,
        status: VerificationStatus.PENDING,
      },
      include: {
        workPhase: {
          include: {
            contract: {
              select: { id: true, title: true, contractNumber: true },
            },
          },
        },
        progressReport: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private validateVerifierRole(type: VerificationType, role: UserRole) {
    const allowedRoles: Record<VerificationType, UserRole[]> = {
      [VerificationType.SUPERVISOR_VERIFICATION]: [
        UserRole.SUPERVISOR,
        UserRole.ADMIN,
      ],
      [VerificationType.WITNESS_VERIFICATION]: [UserRole.WITNESS, UserRole.ADMIN],
      [VerificationType.OWNER_APPROVAL]: [UserRole.OWNER, UserRole.ADMIN],
      [VerificationType.TECHNICAL_REVIEW]: [
        UserRole.SUPERVISOR,
        UserRole.WITNESS,
        UserRole.ADMIN,
      ],
    };

    if (!allowedRoles[type].includes(role)) {
      throw new ForbiddenException(
        `Role ${role} tidak dapat melakukan verifikasi ${type}`,
      );
    }
  }
}
