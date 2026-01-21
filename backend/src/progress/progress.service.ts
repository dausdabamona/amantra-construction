import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TermsService } from '../terms/terms.service';
import { AuditService } from '../audit/audit.service';
import { JwtPayload } from '../common/jwt-payload.interface';
import { TermStatus } from '../common/types';

@Injectable()
export class ProgressService {
  constructor(
    private prisma: PrismaService,
    private termsService: TermsService,
    private auditService: AuditService,
  ) {}

  async uploadProgress(
    termId: string,
    data: {
      description: string;
      claimPercentage: number;
      photoUrl?: string;
    },
    user: JwtPayload,
  ) {
    if (user.role !== 'CONTRACTOR') {
      throw new ForbiddenException('Hanya Kontraktor yang dapat upload progres');
    }

    const term = await this.termsService.findById(termId);

    // Check if contractor is assigned to this project
    if (term.contract.project.contractor?.id !== user.sub) {
      throw new ForbiddenException('Anda bukan kontraktor untuk proyek ini');
    }

    // Can only upload progress if term is DRAFT, SUBMITTED, or REJECTED
    if (!['DRAFT', 'SUBMITTED', 'REJECTED'].includes(term.status)) {
      throw new BadRequestException('Tidak dapat upload progres untuk termin dengan status ini');
    }

    const progress = await this.prisma.progress.create({
      data: {
        description: data.description,
        claimPercentage: data.claimPercentage,
        photoUrl: data.photoUrl,
        termId,
        uploadedById: user.sub,
      },
      include: {
        uploadedBy: { select: { id: true, name: true } },
      },
    });

    await this.auditService.log({
      action: 'SUBMIT_PROGRESS',
      entityType: 'Progress',
      entityId: progress.id,
      description: `Progres termin "${term.name}" diupload dengan klaim ${data.claimPercentage}%`,
      userId: user.sub,
    });

    return progress;
  }

  async submitForVerification(termId: string, user: JwtPayload) {
    if (user.role !== 'CONTRACTOR') {
      throw new ForbiddenException('Hanya Kontraktor yang dapat mengajukan verifikasi');
    }

    const term = await this.termsService.findById(termId);

    // Check if contractor is assigned to this project
    if (term.contract.project.contractor?.id !== user.sub) {
      throw new ForbiddenException('Anda bukan kontraktor untuk proyek ini');
    }

    // Check if there's at least one progress
    if (term.progress.length === 0) {
      throw new BadRequestException('Harus upload progres terlebih dahulu');
    }

    // Update term status to SUBMITTED
    await this.termsService.updateStatusToSubmitted(termId, user.sub);

    // Clear any existing verifications (for resubmission)
    await this.prisma.verification.deleteMany({
      where: { termId },
    });

    return { message: 'Progres berhasil diajukan untuk verifikasi' };
  }

  async findByTerm(termId: string) {
    return this.prisma.progress.findMany({
      where: { termId },
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: { select: { id: true, name: true } },
      },
    });
  }
}
