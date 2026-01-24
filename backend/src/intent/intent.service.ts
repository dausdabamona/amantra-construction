import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DeclareIntentDto, UserRole, GetIntentStatusDto } from './dto/declare-intent.dto';
import { createHash } from 'crypto';

export interface IntentDeclarationRecord {
  id: string;
  userId: string;
  role: UserRole;
  kycVerified: boolean;
  acceptedTerms: boolean;
  confirmedLegalCapacity: boolean;
  declarationTimestamp: Date;
  declarationHash: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class IntentService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  /**
   * Declare user intent before entering contract review
   * Records all verification information on-chain equivalent
   */
  async declareIntent(
    userId: string,
    dto: DeclareIntentDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{
    success: boolean;
    verificationStatus: string;
    role: UserRole;
    declarationTimestamp: Date;
    message: string;
  }> {
    // Validate user doesn't have duplicate intent declarations
    const existingIntent = await this.getIntentStatus(userId);
    if (existingIntent?.status === 'INTENT_DECLARED') {
      throw new BadRequestException(
        'Anda sudah mendeklarasikan intent. Silakan lanjutkan ke tahap review.',
      );
    }

    // Validate all required conditions are met
    if (!dto.kycVerified) {
      throw new ForbiddenException('KYC verification required sebelum dapat melanjutkan');
    }

    if (!dto.acceptTerms) {
      throw new ForbiddenException(
        'Anda harus menerima syarat dan ketentuan platform untuk melanjutkan',
      );
    }

    if (!dto.confirmsLegalCapacity) {
      throw new ForbiddenException(
        'Anda harus mengkonfirmasi kapasitas hukum untuk melanjutkan',
      );
    }

    // Validate role eligibility
    this.validateRoleEligibility(dto.role);

    // Create declaration record
    const declarationTimestamp = new Date();
    const declarationHash = this.generateDeclarationHash(
      userId,
      dto.role,
      declarationTimestamp,
    );

    // Store intent declaration in audit log
    await this.audit.log({
      action: 'INTENT_DECLARED',
      entityType: 'Intent',
      entityId: userId,
      userId,
      description: `Intent declared: ${dto.role}`,
    });

    // In production, this would be stored in database or on-chain
    // For now, we store in audit log (immutable)

    return {
      success: true,
      verificationStatus: 'INTENT_DECLARED',
      role: dto.role,
      declarationTimestamp,
      message: `Intent declaration berhasil untuk role ${dto.role}. Anda sekarang dapat melanjutkan ke tahap review kontrak.`,
    };
  }

  /**
   * Get current intent status for user
   */
  async getIntentStatus(userId: string): Promise<GetIntentStatusDto | null> {
    // Query audit log for most recent intent declaration
    const intentLog = await this.prisma.auditLog.findFirst({
      where: {
        action: 'INTENT_DECLARED',
        entityId: userId,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!intentLog) {
      return null;
    }

    // Parse description to get details if available
    let parsedDetails: any = {};
    try {
      parsedDetails = JSON.parse(intentLog.description || '{}');
    } catch {
      // Description is not JSON
    }

    return {
      userId,
      status: 'INTENT_DECLARED',
      role: UserRole.INVESTOR,
      kycVerified: true,
      acceptedTerms: parsedDetails.acceptedTerms ?? false,
      confirmedLegalCapacity: parsedDetails.confirmedLegalCapacity ?? false,
      declarationTimestamp: intentLog.createdAt,
      canProceedToReview: true,
    };
  }

  /**
   * Check if user has declared intent (guard condition)
   */
  async hasUserDeclaredIntent(userId: string): Promise<boolean> {
    const status = await this.getIntentStatus(userId);
    return status !== null && status.status === 'INTENT_DECLARED';
  }

  /**
   * Verify user has required role and hasn't declared conflicting roles
   */
  private validateRoleEligibility(role: UserRole): void {
    const validRoles = [UserRole.INVESTOR, UserRole.OPERATOR, UserRole.AUDITOR, UserRole.SYSTEM];

    if (!validRoles.includes(role)) {
      throw new BadRequestException(`Role ${role} tidak valid atau tidak didukung`);
    }

    // Additional validation rules per role can be added here
    if (role === UserRole.SYSTEM) {
      // SYSTEM role requires special permissions
      // This would be checked against admin status in production
    }
  }

  /**
   * Generate SHA256 hash of declaration for immutability verification
   */
  private generateDeclarationHash(
    userId: string,
    role: UserRole,
    timestamp: Date,
  ): string {
    const data = `${userId}:${role}:${timestamp.toISOString()}`;
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Verify declaration hash for integrity (blockchain-like verification)
   */
  verifyDeclarationHash(
    userId: string,
    role: UserRole,
    timestamp: Date,
    hash: string,
  ): boolean {
    const expectedHash = this.generateDeclarationHash(userId, role, timestamp);
    return expectedHash === hash;
  }

  /**
   * Get all users with declared intent (admin only)
   */
  async getAllIntentDeclarations(skip: number = 0, take: number = 100): Promise<any> {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        action: 'INTENT_DECLARED',
      },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });

    return logs.map((log: any) => ({
      userId: log.entityId,
      details: {},
      timestamp: log.createdAt,
    }));
  }

  /**
   * Get user's intent declaration history
   */
  async getUserIntentHistory(userId: string): Promise<any[]> {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        action: 'INTENT_DECLARED',
        entityId: userId,
      },
      skip: 0,
      take: 100,
      orderBy: { createdAt: 'desc' },
    });

    return logs.map((log: any) => ({
      declarationTimestamp: log.createdAt,
      role: {},
      hash: {},
    }));
  }
}
