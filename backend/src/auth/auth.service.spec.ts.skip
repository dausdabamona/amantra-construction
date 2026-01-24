import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

// Mock bcrypt
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  // Mock user data
  const mockUser = {
    id: 'user-1',
    email: 'test@test.com',
    name: 'Test User',
    role: 'OWNER',
    company: 'Test Company',
    phone: '081234567890',
    passwordHash: 'hashed-password',
  const mockUser = {
    id: 'user-uuid-1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'OWNER',
    company: 'Test Company',
    passwordHash: 'hashed_password',
    phone: '+62812345678',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login('test@test.com', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login('test@test.com', 'wrong-password')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return user and accessToken on successful login', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login('test@test.com', 'correct-password');

      expect(result).toEqual({
        user: {
          id: 'user-1',
          email: 'test@test.com',
          name: 'Test User',
          role: 'OWNER',
          company: 'Test Company',
        },
        accessToken: 'jwt-token',
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'test@test.com',
        role: 'OWNER',
        name: 'Test User',
      });
    });
  });

  describe('getMe', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getMe('non-existent-id')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return user data without password', async () => {
      const userWithoutPassword = {
        id: 'user-1',
        email: 'test@test.com',
        name: 'Test User',
        role: 'OWNER',
        phone: '081234567890',
        company: 'Test Company',
      };
      mockPrismaService.user.findUnique.mockResolvedValue(userWithoutPassword);

      const result = await service.getMe('user-1');

      expect(result).toEqual(userWithoutPassword);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          company: true,
        },
      });
    });
  });

  describe('getAllUsers', () => {
    it('should return all users without passwords', async () => {
      const mockUsers = [
        { id: 'user-1', email: 'user1@test.com', name: 'User 1', role: 'OWNER', company: 'Company 1' },
        { id: 'user-2', email: 'user2@test.com', name: 'User 2', role: 'CONTRACTOR', company: 'Company 2' },
      ];
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.getAllUsers();

      expect(result).toEqual(mockUsers);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          company: true,
        },
      });
    });
  });

  describe('getUsersByRole', () => {
    it('should return users filtered by role', async () => {
      const mockContractors = [
        { id: 'user-2', email: 'contractor@test.com', name: 'Contractor', role: 'CONTRACTOR', company: 'Company' },
      ];
      mockPrismaService.user.findMany.mockResolvedValue(mockContractors);

      const result = await service.getUsersByRole('CONTRACTOR');

      expect(result).toEqual(mockContractors);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: { role: 'CONTRACTOR' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          company: true,
        },
      });
    it('should successfully login user with valid credentials', async () => {
      const loginDto = { email: 'test@example.com', password: 'password123' };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto.email, loginDto.password);

      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
          company: mockUser.company,
        },
        accessToken: 'jwt-token',
      });

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.passwordHash,
      );
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const loginDto = { email: 'nonexistent@example.com', password: 'password123' };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.login(loginDto.email, loginDto.password),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      const loginDto = { email: 'test@example.com', password: 'wrongpassword' };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login(loginDto.email, loginDto.password),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
