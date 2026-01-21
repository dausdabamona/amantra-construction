import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction, Prisma } from '@prisma/client';
import {
  PaginationDto,
  createPaginatedResult,
} from '../../common/dto/pagination.dto';

interface AuditLogInput {
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  description: string;
  oldValue?: string;
  newValue?: string;
  projectId?: string;
  contractId?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  /**
   * Log an audit event
   */
  async log(input: AuditLogInput) {
    return this.prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        description: input.description,
        oldValue: input.oldValue,
        newValue: input.newValue,
        projectId: input.projectId,
        contractId: input.contractId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  }

  /**
   * Get audit logs with pagination and filters
   */
  async findAll(
    pagination: PaginationDto,
    filters?: {
      entityType?: string;
      entityId?: string;
      userId?: string;
      projectId?: string;
      contractId?: string;
      action?: AuditAction;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    const where: Prisma.AuditLogWhereInput = {
      ...(filters?.entityType && { entityType: filters.entityType }),
      ...(filters?.entityId && { entityId: filters.entityId }),
      ...(filters?.userId && { userId: filters.userId }),
      ...(filters?.projectId && { projectId: filters.projectId }),
      ...(filters?.contractId && { contractId: filters.contractId }),
      ...(filters?.action && { action: filters.action }),
      ...(filters?.startDate &&
        filters?.endDate && {
          createdAt: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
        }),
    };

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, fullName: true, email: true, role: true },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return createPaginatedResult(logs, total, pagination);
  }

  /**
   * Get audit trail for a specific entity
   */
  async getEntityAuditTrail(entityType: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, role: true },
        },
      },
    });
  }

  /**
   * Get audit logs for a project
   */
  async getProjectAuditTrail(projectId: string) {
    return this.prisma.auditLog.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, role: true },
        },
      },
    });
  }

  /**
   * Get audit logs for a contract
   */
  async getContractAuditTrail(contractId: string) {
    return this.prisma.auditLog.findMany({
      where: { contractId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, role: true },
        },
      },
    });
  }

  /**
   * Get user activity log
   */
  async getUserActivityLog(userId: string, pagination: PaginationDto) {
    const where: Prisma.AuditLogWhereInput = { userId };

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return createPaginatedResult(logs, total, pagination);
  }
}
