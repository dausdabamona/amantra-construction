import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ContractStatus, Prisma, UserRole } from '@prisma/client';
import { CreateContractDto } from './dto/create-contract.dto';
import {
  PaginationDto,
  createPaginatedResult,
} from '../../common/dto/pagination.dto';
import { AuditService } from '../audit/audit.service';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class ContractsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(createContractDto: CreateContractDto, user: JwtPayload) {
    // Verify project exists and user has access
    const project = await this.prisma.project.findUnique({
      where: { id: createContractDto.projectId },
    });

    if (!project || project.deletedAt) {
      throw new NotFoundException('Proyek tidak ditemukan');
    }

    if (project.ownerId !== user.sub && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Hanya pemilik proyek yang dapat membuat kontrak');
    }

    const contractNumber = this.generateContractNumber();

    const contract = await this.prisma.contract.create({
      data: {
        contractNumber,
        title: createContractDto.title,
        description: createContractDto.description,
        scope: createContractDto.scope,
        totalValue: createContractDto.totalValue,
        currency: createContractDto.currency || 'IDR',
        retentionPercentage: createContractDto.retentionPercentage || 5,
        termsConditions: createContractDto.termsConditions,
        projectId: createContractDto.projectId,
        status: ContractStatus.DRAFT,
      },
      include: {
        project: {
          select: { id: true, projectCode: true, name: true },
        },
      },
    });

    await this.auditService.log({
      userId: user.sub,
      action: 'CREATE',
      entityType: 'Contract',
      entityId: contract.id,
      description: `Kontrak "${contract.title}" dibuat`,
      projectId: project.id,
      contractId: contract.id,
    });

    return contract;
  }

  async findAll(pagination: PaginationDto, user: JwtPayload, projectId?: string) {
    const where: Prisma.ContractWhereInput = {
      deletedAt: null,
      ...(projectId && { projectId }),
      ...(pagination.search && {
        OR: [
          { title: { contains: pagination.search } },
          { contractNumber: { contains: pagination.search } },
        ],
      }),
    };

    const [contracts, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { [pagination.sortBy || 'createdAt']: pagination.sortOrder },
        include: {
          project: {
            select: { id: true, projectCode: true, name: true },
          },
          _count: {
            select: { workPhases: true, payments: true },
          },
        },
      }),
      this.prisma.contract.count({ where }),
    ]);

    return createPaginatedResult(contracts, total, pagination);
  }

  async findById(id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            owner: {
              select: { id: true, fullName: true, company: true },
            },
            contractor: {
              select: { id: true, fullName: true, company: true },
            },
          },
        },
        workPhases: {
          where: { deletedAt: null },
          orderBy: { phaseNumber: 'asc' },
        },
        payments: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!contract || contract.deletedAt) {
      throw new NotFoundException('Kontrak tidak ditemukan');
    }

    return contract;
  }

  async updateStatus(id: string, status: ContractStatus, user: JwtPayload) {
    const contract = await this.findById(id);

    const updated = await this.prisma.contract.update({
      where: { id },
      data: { status },
    });

    await this.auditService.log({
      userId: user.sub,
      action: 'UPDATE',
      entityType: 'Contract',
      entityId: id,
      description: `Status kontrak diubah menjadi ${status}`,
      projectId: contract.projectId,
      contractId: id,
      oldValue: JSON.stringify({ status: contract.status }),
      newValue: JSON.stringify({ status }),
    });

    return updated;
  }

  async signContract(
    id: string,
    signatureHash: string,
    signatureType: 'owner' | 'contractor',
    user: JwtPayload,
  ) {
    const contract = await this.findById(id);

    const updateData =
      signatureType === 'owner'
        ? { ownerSignatureHash: signatureHash }
        : { contractorSignatureHash: signatureHash };

    const updated = await this.prisma.contract.update({
      where: { id },
      data: updateData,
    });

    await this.auditService.log({
      userId: user.sub,
      action: 'SIGN',
      entityType: 'Contract',
      entityId: id,
      description: `Kontrak ditandatangani oleh ${signatureType}`,
      projectId: contract.projectId,
      contractId: id,
    });

    // If both signatures are present, activate contract
    if (updated.ownerSignatureHash && updated.contractorSignatureHash) {
      await this.prisma.contract.update({
        where: { id },
        data: {
          status: ContractStatus.ACTIVE,
          signedDate: new Date(),
          effectiveDate: new Date(),
        },
      });
    }

    return updated;
  }

  async softDelete(id: string, user: JwtPayload) {
    const contract = await this.findById(id);

    await this.prisma.contract.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditService.log({
      userId: user.sub,
      action: 'DELETE',
      entityType: 'Contract',
      entityId: id,
      description: `Kontrak "${contract.title}" dihapus`,
      projectId: contract.projectId,
      contractId: id,
    });

    return { message: 'Kontrak berhasil dihapus' };
  }

  private generateContractNumber(): string {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `KTR-${year}${month}-${random}`;
  }
}
