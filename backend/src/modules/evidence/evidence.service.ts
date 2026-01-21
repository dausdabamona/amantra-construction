import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EvidenceType } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

interface UploadEvidenceDto {
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  filePath: string;
  type: EvidenceType;
  description?: string;
  capturedAt?: string;
  location?: string;
  contractId?: string;
  progressReportId?: string;
  verificationId?: string;
  paymentId?: string;
}

@Injectable()
export class EvidenceService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async upload(dto: UploadEvidenceDto, fileBuffer: Buffer, user: JwtPayload) {
    // Generate file hash for integrity
    const fileHash = this.generateFileHash(fileBuffer);

    const evidence = await this.prisma.evidenceFile.create({
      data: {
        fileName: dto.fileName,
        originalName: dto.originalName,
        mimeType: dto.mimeType,
        fileSize: dto.fileSize,
        filePath: dto.filePath,
        fileHash,
        type: dto.type,
        description: dto.description,
        capturedAt: dto.capturedAt ? new Date(dto.capturedAt) : null,
        location: dto.location,
        contractId: dto.contractId,
        progressReportId: dto.progressReportId,
        verificationId: dto.verificationId,
        paymentId: dto.paymentId,
      },
    });

    await this.auditService.log({
      userId: user.sub,
      action: 'UPLOAD',
      entityType: 'EvidenceFile',
      entityId: evidence.id,
      description: `File "${dto.originalName}" diupload sebagai bukti ${dto.type}`,
      contractId: dto.contractId,
    });

    return evidence;
  }

  async findById(id: string) {
    const evidence = await this.prisma.evidenceFile.findUnique({
      where: { id },
    });

    if (!evidence || evidence.deletedAt) {
      throw new NotFoundException('File bukti tidak ditemukan');
    }

    return evidence;
  }

  async findByContract(contractId: string) {
    return this.prisma.evidenceFile.findMany({
      where: {
        contractId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByProgressReport(progressReportId: string) {
    return this.prisma.evidenceFile.findMany({
      where: {
        progressReportId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByVerification(verificationId: string) {
    return this.prisma.evidenceFile.findMany({
      where: {
        verificationId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async verifyIntegrity(id: string, fileBuffer: Buffer) {
    const evidence = await this.findById(id);
    const currentHash = this.generateFileHash(fileBuffer);

    return {
      isValid: evidence.fileHash === currentHash,
      originalHash: evidence.fileHash,
      currentHash,
      fileName: evidence.originalName,
    };
  }

  async softDelete(id: string, user: JwtPayload) {
    const evidence = await this.findById(id);

    await this.prisma.evidenceFile.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditService.log({
      userId: user.sub,
      action: 'DELETE',
      entityType: 'EvidenceFile',
      entityId: id,
      description: `File bukti "${evidence.originalName}" dihapus`,
      contractId: evidence.contractId || undefined,
    });

    return { message: 'File bukti berhasil dihapus' };
  }

  private generateFileHash(fileBuffer: Buffer): string {
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }
}
