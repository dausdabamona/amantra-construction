import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TermsService } from '../terms/terms.service';
import { AuditService } from '../audit/audit.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { JwtPayload } from '../common/jwt-payload.interface';
import { VerificationRole, VerificationStatus, TermStatus } from '../common/types';

@Injectable()
export class VerificationsService {
  private readonly logger = new Logger(VerificationsService.name);

  constructor(
    private prisma: PrismaService,
    private termsService: TermsService,
    private auditService: AuditService,
    private blockchainService: BlockchainService,
  ) {}

  async verify(
    termId: string,
    data: { status: 'APPROVED' | 'REJECTED'; notes?: string },
    user: JwtPayload,
  ) {
    // Only SUPERVISOR or WITNESS can verify
    if (!['SUPERVISOR', 'WITNESS'].includes(user.role)) {
      throw new ForbiddenException('Hanya Pengawas atau Saksi yang dapat melakukan verifikasi');
    }

    const term = await this.termsService.findById(termId);

    // Check if user is assigned to this project
    const project = term.contract.project;
    if (user.role === 'SUPERVISOR' && project.supervisor?.id !== user.sub) {
      throw new ForbiddenException('Anda bukan pengawas untuk proyek ini');
    }
    if (user.role === 'WITNESS' && project.witness?.id !== user.sub) {
      throw new ForbiddenException('Anda bukan saksi untuk proyek ini');
    }

    // Can only verify if term is SUBMITTED
    if (term.status !== TermStatus.SUBMITTED) {
      throw new BadRequestException('Termin belum diajukan untuk verifikasi');
    }

    // Map user role to verification role
    const verificationRole: VerificationRole =
      user.role === 'SUPERVISOR' ? VerificationRole.SUPERVISOR : VerificationRole.WITNESS;

    // Check if already verified by this role
    const existingVerification = await this.prisma.verification.findUnique({
      where: {
        termId_role: {
          termId,
          role: verificationRole,
        },
      },
    });

    if (existingVerification) {
      throw new BadRequestException(`Termin sudah diverifikasi oleh ${user.role}`);
    }

    // Create verification
    const verification = await this.prisma.verification.create({
      data: {
        role: verificationRole,
        status: data.status as VerificationStatus,
        notes: data.notes,
        verifiedAt: new Date(),
        termId,
        verifierId: user.sub,
      },
      include: {
        verifier: { select: { id: true, name: true, role: true } },
      },
    });

    // Log the action
    const action = data.status === 'APPROVED' ? 'VERIFY_APPROVE' : 'VERIFY_REJECT';
    await this.auditService.log({
      action,
      entityType: 'Verification',
      entityId: verification.id,
      description: `Termin "${term.name}" ${data.status === 'APPROVED' ? 'disetujui' : 'ditolak'} oleh ${user.role === 'SUPERVISOR' ? 'Pengawas' : 'Saksi'}`,
      userId: user.sub,
    });

    // Record verification on blockchain (non-blocking)
    this.recordVerificationOnBlockchain(termId, term, verificationRole, data.status === 'APPROVED', data.notes);

    // Check if both verifications are done and approved
    await this.checkAndUpdateTermStatus(termId, user.sub);

    return verification;
  }

  private async checkAndUpdateTermStatus(termId: string, userId: string) {
    const verifications = await this.prisma.verification.findMany({
      where: { termId },
    });

    // Need both SUPERVISOR and WITNESS verifications
    const supervisorVerification = verifications.find((v: { role: string }) => v.role === 'SUPERVISOR');
    const witnessVerification = verifications.find((v: { role: string }) => v.role === 'WITNESS');

    if (supervisorVerification && witnessVerification) {
      // Both have verified
      if (
        supervisorVerification.status === 'APPROVED' &&
        witnessVerification.status === 'APPROVED'
      ) {
        // Both approved - mark as VALID
        await this.termsService.updateStatusToValid(termId, userId);
      } else if (
        supervisorVerification.status === 'REJECTED' ||
        witnessVerification.status === 'REJECTED'
      ) {
        // One rejected - mark term as REJECTED
        await this.prisma.term.update({
          where: { id: termId },
          data: { status: TermStatus.REJECTED },
        });

        await this.auditService.log({
          action: 'VERIFY_REJECT',
          entityType: 'Term',
          entityId: termId,
          description: 'Termin ditolak karena salah satu verifikasi ditolak',
          userId,
        });
      }
    }
  }

  async getTermVerifications(termId: string) {
    return this.prisma.verification.findMany({
      where: { termId },
      include: {
        verifier: { select: { id: true, name: true, role: true } },
      },
    });
  }

  async getPendingVerifications(user: JwtPayload) {
    // Only SUPERVISOR or WITNESS can have pending verifications
    if (!['SUPERVISOR', 'WITNESS'].includes(user.role)) {
      return [];
    }

    const verificationRole: VerificationRole =
      user.role === 'SUPERVISOR' ? VerificationRole.SUPERVISOR : VerificationRole.WITNESS;

    // Find terms that are SUBMITTED and don't have a verification from this user's role
    const projectCondition =
      user.role === 'SUPERVISOR' ? { supervisorId: user.sub } : { witnessId: user.sub };

    const terms = await this.prisma.term.findMany({
      where: {
        status: TermStatus.SUBMITTED,
        contract: {
          project: projectCondition,
        },
        verifications: {
          none: {
            role: verificationRole,
          },
        },
      },
      include: {
        contract: {
          include: {
            project: {
              select: { id: true, name: true, location: true },
            },
          },
        },
        progress: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            uploadedBy: { select: { id: true, name: true } },
          },
        },
      },
    });

    return terms;
  }

  /**
   * Record verification on blockchain (non-blocking)
   */
  private async recordVerificationOnBlockchain(
    termId: string,
    term: any,
    role: string,
    approved: boolean,
    notes?: string,
  ) {
    try {
      // Create term data string for hashing
      const termData = JSON.stringify({
        termId,
        termName: term.name,
        termNumber: term.termNumber,
        value: term.value,
        projectName: term.contract.project.name,
      });

      const result = await this.blockchainService.recordVerification(
        termId,
        termData,
        role,
        approved,
        notes || '',
      );

      if (result.success) {
        this.logger.log(`Verification recorded on blockchain: ${result.transactionHash}`);
      }
    } catch (error) {
      // Non-blocking - just log the error
      this.logger.error(`Failed to record verification on blockchain: ${error.message}`);
    }
  }
}
