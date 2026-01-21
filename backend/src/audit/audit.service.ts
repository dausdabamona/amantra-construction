import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '../common/types';

interface LogInput {
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  userId: string;
  oldValue?: string;
  newValue?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(input: LogInput) {
    return this.prisma.auditLog.create({
      data: {
        action: input.action as AuditAction,
        entityType: input.entityType,
        entityId: input.entityId,
        description: input.description,
        userId: input.userId,
        oldValue: input.oldValue,
        newValue: input.newValue,
      },
    });
  }

  async findAll(limit = 50) {
    return this.prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    });
  }

  async findByEntity(entityType: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    });
  }

  async findByUser(userId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
}
