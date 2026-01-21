import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole, UserStatus, Prisma } from '@prisma/client';
import {
  PaginationDto,
  createPaginatedResult,
} from '../../common/dto/pagination.dto';

interface CreateUserData {
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  company?: string;
  position?: string;
  licenseNumber?: string;
  specialization?: string;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUserData) {
    return this.prisma.user.create({
      data: {
        ...data,
        status: UserStatus.ACTIVE, // For development; use PENDING_VERIFICATION in production
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        company: true,
        position: true,
        createdAt: true,
      },
    });
  }

  async findAll(pagination: PaginationDto, filters?: { role?: UserRole }) {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(filters?.role && { role: filters.role }),
      ...(pagination.search && {
        OR: [
          { fullName: { contains: pagination.search } },
          { email: { contains: pagination.search } },
          { company: { contains: pagination.search } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { [pagination.sortBy || 'createdAt']: pagination.sortOrder },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          status: true,
          phone: true,
          company: true,
          position: true,
          specialization: true,
          createdAt: true,
          lastLoginAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return createPaginatedResult(users, total, pagination);
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByRole(role: UserRole) {
    return this.prisma.user.findMany({
      where: {
        role,
        status: UserStatus.ACTIVE,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        company: true,
        licenseNumber: true,
        specialization: true,
      },
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    const user = await this.findById(id);
    if (!user || user.deletedAt) {
      throw new NotFoundException('Pengguna tidak ditemukan');
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        phone: true,
        company: true,
        position: true,
        updatedAt: true,
      },
    });
  }

  async updateLastLogin(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async softDelete(id: string) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: UserStatus.INACTIVE,
      },
    });
  }

  async getSupervisors() {
    return this.findByRole(UserRole.SUPERVISOR);
  }

  async getWitnesses() {
    return this.findByRole(UserRole.WITNESS);
  }

  async getContractors() {
    return this.findByRole(UserRole.CONTRACTOR);
  }
}
