import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { JwtPayload } from '../common/jwt-payload.interface';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(
    data: {
      name: string;
      description?: string;
      location?: string;
      contractorId?: string;
      supervisorId?: string;
      witnessId?: string;
    },
    user: JwtPayload,
  ) {
    if (user.role !== 'OWNER') {
      throw new ForbiddenException('Hanya Owner yang dapat membuat proyek');
    }

    const project = await this.prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        location: data.location,
        ownerId: user.sub,
        contractorId: data.contractorId,
        supervisorId: data.supervisorId,
        witnessId: data.witnessId,
      },
      include: {
        owner: { select: { id: true, name: true, company: true } },
        contractor: { select: { id: true, name: true, company: true } },
        supervisor: { select: { id: true, name: true, company: true } },
        witness: { select: { id: true, name: true, company: true } },
      },
    });

    await this.auditService.log({
      action: 'CREATE',
      entityType: 'Project',
      entityId: project.id,
      description: `Proyek "${project.name}" dibuat`,
      userId: user.sub,
    });

    return project;
  }

  async findAll(user: JwtPayload) {
    // Different users see different projects based on role
    let where: any = {};

    switch (user.role) {
      case 'OWNER':
        where = { ownerId: user.sub };
        break;
      case 'CONTRACTOR':
        where = { contractorId: user.sub };
        break;
      case 'SUPERVISOR':
        where = { supervisorId: user.sub };
        break;
      case 'WITNESS':
        where = { witnessId: user.sub };
        break;
    }

    return this.prisma.project.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, company: true } },
        contractor: { select: { id: true, name: true, company: true } },
        supervisor: { select: { id: true, name: true, company: true } },
        witness: { select: { id: true, name: true, company: true } },
        contract: {
          include: {
            terms: {
              orderBy: { termNumber: 'asc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, user: JwtPayload) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, company: true, email: true, phone: true } },
        contractor: { select: { id: true, name: true, company: true, email: true, phone: true } },
        supervisor: { select: { id: true, name: true, company: true, email: true, phone: true } },
        witness: { select: { id: true, name: true, company: true, email: true, phone: true } },
        contract: {
          include: {
            terms: {
              orderBy: { termNumber: 'asc' },
              include: {
                progress: { orderBy: { createdAt: 'desc' }, take: 1 },
                verifications: true,
                payment: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Proyek tidak ditemukan');
    }

    return project;
  }

  async createContract(
    projectId: string,
    data: { totalValue: number; termCount: number },
    user: JwtPayload,
  ) {
    if (user.role !== 'OWNER') {
      throw new ForbiddenException('Hanya Owner yang dapat membuat kontrak');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { contract: true },
    });

    if (!project) {
      throw new NotFoundException('Proyek tidak ditemukan');
    }

    if (project.ownerId !== user.sub) {
      throw new ForbiddenException('Anda bukan owner proyek ini');
    }

    if (project.contract) {
      throw new ForbiddenException('Proyek sudah memiliki kontrak');
    }

    const contractNumber = `KTR-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const contract = await this.prisma.contract.create({
      data: {
        contractNumber,
        totalValue: data.totalValue,
        termCount: data.termCount,
        projectId,
      },
    });

    await this.auditService.log({
      action: 'CREATE',
      entityType: 'Contract',
      entityId: contract.id,
      description: `Kontrak ${contractNumber} dibuat dengan nilai Rp ${data.totalValue.toLocaleString('id-ID')}`,
      userId: user.sub,
    });

    return contract;
  }
}
