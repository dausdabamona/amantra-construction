import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import {
  PaginationDto,
  createPaginatedResult,
} from '../../common/dto/pagination.dto';

interface CreateProgressReportDto {
  workPhaseId: string;
  title: string;
  description: string;
  workCompleted: string;
  progressPercentage: number;
  issuesEncountered?: string;
  nextSteps?: string;
}

@Injectable()
export class ProgressReportsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateProgressReportDto, user: JwtPayload) {
    // Verify work phase exists
    const workPhase = await this.prisma.workPhase.findUnique({
      where: { id: dto.workPhaseId },
      include: { contract: true },
    });

    if (!workPhase || workPhase.deletedAt) {
      throw new NotFoundException('Termin tidak ditemukan');
    }

    const reportNumber = this.generateReportNumber();

    const report = await this.prisma.progressReport.create({
      data: {
        reportNumber,
        title: dto.title,
        description: dto.description,
        workCompleted: dto.workCompleted,
        progressPercentage: dto.progressPercentage,
        issuesEncountered: dto.issuesEncountered,
        nextSteps: dto.nextSteps,
        status: ReportStatus.DRAFT,
        workPhaseId: dto.workPhaseId,
        submittedById: user.sub,
      },
      include: {
        workPhase: {
          select: { id: true, name: true, phaseNumber: true, contractId: true },
        },
        submittedBy: {
          select: { id: true, fullName: true },
        },
      },
    });

    await this.auditService.log({
      userId: user.sub,
      action: 'CREATE',
      entityType: 'ProgressReport',
      entityId: report.id,
      description: `Laporan progres "${report.title}" dibuat`,
      contractId: workPhase.contractId,
    });

    return report;
  }

  async findByWorkPhase(workPhaseId: string, pagination: PaginationDto) {
    const where = {
      workPhaseId,
      deletedAt: null,
    };

    const [reports, total] = await Promise.all([
      this.prisma.progressReport.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
        include: {
          submittedBy: {
            select: { id: true, fullName: true },
          },
          _count: {
            select: { evidenceFiles: true, verifications: true },
          },
        },
      }),
      this.prisma.progressReport.count({ where }),
    ]);

    return createPaginatedResult(reports, total, pagination);
  }

  async findById(id: string) {
    const report = await this.prisma.progressReport.findUnique({
      where: { id },
      include: {
        workPhase: {
          include: {
            contract: {
              select: { id: true, title: true, contractNumber: true },
            },
          },
        },
        submittedBy: {
          select: { id: true, fullName: true, email: true },
        },
        evidenceFiles: {
          where: { deletedAt: null },
        },
        verifications: {
          include: {
            verifier: {
              select: { id: true, fullName: true, role: true },
            },
          },
        },
      },
    });

    if (!report || report.deletedAt) {
      throw new NotFoundException('Laporan progres tidak ditemukan');
    }

    return report;
  }

  async submit(id: string, user: JwtPayload) {
    const report = await this.findById(id);

    if (report.status !== ReportStatus.DRAFT) {
      throw new BadRequestException('Laporan sudah disubmit');
    }

    const updated = await this.prisma.progressReport.update({
      where: { id },
      data: {
        status: ReportStatus.SUBMITTED,
        submittedAt: new Date(),
      },
    });

    await this.auditService.log({
      userId: user.sub,
      action: 'SUBMIT',
      entityType: 'ProgressReport',
      entityId: id,
      description: `Laporan progres "${report.title}" disubmit untuk review`,
      contractId: report.workPhase.contract.id,
    });

    return updated;
  }

  async updateStatus(id: string, status: ReportStatus, user: JwtPayload) {
    const report = await this.findById(id);

    const updated = await this.prisma.progressReport.update({
      where: { id },
      data: { status },
    });

    await this.auditService.log({
      userId: user.sub,
      action: 'UPDATE',
      entityType: 'ProgressReport',
      entityId: id,
      description: `Status laporan diubah menjadi ${status}`,
      contractId: report.workPhase.contract.id,
      oldValue: JSON.stringify({ status: report.status }),
      newValue: JSON.stringify({ status }),
    });

    return updated;
  }

  async softDelete(id: string, user: JwtPayload) {
    const report = await this.findById(id);

    await this.prisma.progressReport.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditService.log({
      userId: user.sub,
      action: 'DELETE',
      entityType: 'ProgressReport',
      entityId: id,
      description: `Laporan progres "${report.title}" dihapus`,
      contractId: report.workPhase.contract.id,
    });

    return { message: 'Laporan progres berhasil dihapus' };
  }

  private generateReportNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `RPT-${year}${month}${day}-${random}`;
  }
}
