import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectStatus, Prisma, UserRole } from '@prisma/client';
import { CreateProjectDto } from './dto/create-project.dto';
import {
  PaginationDto,
  createPaginatedResult,
} from '../../common/dto/pagination.dto';
import { AuditService } from '../audit/audit.service';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(createProjectDto: CreateProjectDto, user: JwtPayload) {
    const projectCode = this.generateProjectCode();

    const project = await this.prisma.project.create({
      data: {
        projectCode,
        name: createProjectDto.name,
        description: createProjectDto.description,
        location: createProjectDto.location,
        estimatedBudget: createProjectDto.estimatedBudget,
        currency: createProjectDto.currency || 'IDR',
        startDate: new Date(createProjectDto.startDate),
        endDate: new Date(createProjectDto.endDate),
        ownerId: user.sub,
        contractorId: createProjectDto.contractorId,
        status: ProjectStatus.DRAFT,
      },
      include: {
        owner: {
          select: { id: true, fullName: true, email: true, company: true },
        },
        contractor: {
          select: { id: true, fullName: true, email: true, company: true },
        },
      },
    });

    // Assign supervisors
    if (createProjectDto.supervisorIds?.length) {
      await this.assignSupervisors(project.id, createProjectDto.supervisorIds);
    }

    // Assign witnesses
    if (createProjectDto.witnessIds?.length) {
      await this.assignWitnesses(project.id, createProjectDto.witnessIds);
    }

    // Audit log
    await this.auditService.log({
      userId: user.sub,
      action: 'CREATE',
      entityType: 'Project',
      entityId: project.id,
      description: `Proyek "${project.name}" dibuat`,
      projectId: project.id,
    });

    return project;
  }

  async findAll(pagination: PaginationDto, user: JwtPayload) {
    const where: Prisma.ProjectWhereInput = {
      deletedAt: null,
      // Filter berdasarkan role
      ...(user.role === UserRole.OWNER && { ownerId: user.sub }),
      ...(user.role === UserRole.CONTRACTOR && { contractorId: user.sub }),
      ...(user.role === UserRole.SUPERVISOR && {
        supervisors: { some: { userId: user.sub, isActive: true } },
      }),
      ...(user.role === UserRole.WITNESS && {
        witnesses: { some: { userId: user.sub, isActive: true } },
      }),
      ...(pagination.search && {
        OR: [
          { name: { contains: pagination.search } },
          { projectCode: { contains: pagination.search } },
          { location: { contains: pagination.search } },
        ],
      }),
    };

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { [pagination.sortBy || 'createdAt']: pagination.sortOrder },
        include: {
          owner: {
            select: { id: true, fullName: true, company: true },
          },
          contractor: {
            select: { id: true, fullName: true, company: true },
          },
          _count: {
            select: { contracts: true },
          },
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    return createPaginatedResult(projects, total, pagination);
  }

  async findById(id: string, user: JwtPayload) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            company: true,
          },
        },
        contractor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            company: true,
          },
        },
        supervisors: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                licenseNumber: true,
              },
            },
          },
        },
        witnesses: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                specialization: true,
              },
            },
          },
        },
        contracts: {
          where: { deletedAt: null },
          select: {
            id: true,
            contractNumber: true,
            title: true,
            totalValue: true,
            status: true,
          },
        },
      },
    });

    if (!project || project.deletedAt) {
      throw new NotFoundException('Proyek tidak ditemukan');
    }

    // Check access
    this.checkProjectAccess(project, user);

    return project;
  }

  async updateStatus(id: string, status: ProjectStatus, user: JwtPayload) {
    const project = await this.findById(id, user);

    // Only owner can change status
    if (project.ownerId !== user.sub && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Hanya pemilik proyek yang dapat mengubah status');
    }

    const updated = await this.prisma.project.update({
      where: { id },
      data: { status },
    });

    await this.auditService.log({
      userId: user.sub,
      action: 'UPDATE',
      entityType: 'Project',
      entityId: id,
      description: `Status proyek diubah menjadi ${status}`,
      projectId: id,
      oldValue: JSON.stringify({ status: project.status }),
      newValue: JSON.stringify({ status }),
    });

    return updated;
  }

  async assignSupervisors(projectId: string, supervisorIds: string[]) {
    const data = supervisorIds.map((userId) => ({
      projectId,
      userId,
    }));

    await this.prisma.projectSupervisor.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async assignWitnesses(projectId: string, witnessIds: string[]) {
    const data = witnessIds.map((userId) => ({
      projectId,
      userId,
    }));

    await this.prisma.projectWitness.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async softDelete(id: string, user: JwtPayload) {
    const project = await this.findById(id, user);

    if (project.ownerId !== user.sub && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Hanya pemilik proyek yang dapat menghapus');
    }

    await this.prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditService.log({
      userId: user.sub,
      action: 'DELETE',
      entityType: 'Project',
      entityId: id,
      description: `Proyek "${project.name}" dihapus`,
      projectId: id,
    });

    return { message: 'Proyek berhasil dihapus' };
  }

  private generateProjectCode(): string {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PRJ-${year}-${random}`;
  }

  private checkProjectAccess(project: any, user: JwtPayload) {
    if (user.role === UserRole.ADMIN || user.role === UserRole.AUDITOR) {
      return; // Admin and Auditor can access all
    }

    const hasAccess =
      project.ownerId === user.sub ||
      project.contractorId === user.sub ||
      project.supervisors?.some((s: any) => s.userId === user.sub) ||
      project.witnesses?.some((w: any) => w.userId === user.sub);

    if (!hasAccess) {
      throw new ForbiddenException('Anda tidak memiliki akses ke proyek ini');
    }
  }
}
