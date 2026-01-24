import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { PrismaService } from '../prisma/prisma.service';
import { TermsService } from '../terms/terms.service';
import { AuditService } from '../audit/audit.service';
import { JwtPayload } from '../common/jwt-payload.interface';
import { TermStatus } from '../common/types';

describe('ProgressService', () => {
  let service: ProgressService;
  let prismaService: PrismaService;
  let termsService: TermsService;
  let auditService: AuditService;

  const mockPrismaService = {
    progress: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    verification: {
      deleteMany: jest.fn(),
    },
  };

  const mockTermsService = {
    findById: jest.fn(),
    updateStatusToSubmitted: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  // Mock users
  const mockContractor: JwtPayload = {
    sub: 'contractor-id',
    email: 'contractor@test.com',
    role: 'CONTRACTOR',
    name: 'Test Contractor',
  };

  const mockOwner: JwtPayload = {
    sub: 'owner-id',
    email: 'owner@test.com',
    role: 'OWNER',
    name: 'Test Owner',
  };

  // Mock term
  const mockTerm = {
    id: 'term-1',
    name: 'Termin 1',
    status: TermStatus.DRAFT,
    contract: {
      project: {
        contractor: { id: 'contractor-id' },
      },
    },
    progress: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: TermsService, useValue: mockTermsService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<ProgressService>(ProgressService);
    prismaService = module.get<PrismaService>(PrismaService);
    termsService = module.get<TermsService>(TermsService);
    auditService = module.get<AuditService>(AuditService);

    jest.clearAllMocks();
  });

  describe('uploadProgress', () => {
    const uploadData = {
      description: 'Progress update',
      claimPercentage: 50,
      photoUrl: '/uploads/photo.jpg',
    };

    it('should throw ForbiddenException if user is not CONTRACTOR', async () => {
      await expect(
        service.uploadProgress('term-1', uploadData, mockOwner),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if contractor is not assigned to project', async () => {
      const termWithDifferentContractor = {
        ...mockTerm,
        contract: {
          project: {
            contractor: { id: 'different-contractor-id' },
          },
        },
      };
      mockTermsService.findById.mockResolvedValue(termWithDifferentContractor);

      await expect(
        service.uploadProgress('term-1', uploadData, mockContractor),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if term status is VALID', async () => {
      const validTerm = { ...mockTerm, status: TermStatus.VALID };
      mockTermsService.findById.mockResolvedValue(validTerm);

      await expect(
        service.uploadProgress('term-1', uploadData, mockContractor),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if term status is PAID', async () => {
      const paidTerm = { ...mockTerm, status: TermStatus.PAID };
      mockTermsService.findById.mockResolvedValue(paidTerm);

      await expect(
        service.uploadProgress('term-1', uploadData, mockContractor),
      ).rejects.toThrow(BadRequestException);
    });

    it('should upload progress successfully for DRAFT term', async () => {
      mockTermsService.findById.mockResolvedValue(mockTerm);
      mockPrismaService.progress.create.mockResolvedValue({
        id: 'progress-1',
        ...uploadData,
        termId: 'term-1',
        uploadedById: 'contractor-id',
        uploadedBy: { id: 'contractor-id', name: 'Test Contractor' },
      });

      const result = await service.uploadProgress('term-1', uploadData, mockContractor);

      expect(result.description).toBe('Progress update');
      expect(result.claimPercentage).toBe(50);
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should allow upload progress for REJECTED term (resubmission)', async () => {
      const rejectedTerm = { ...mockTerm, status: TermStatus.REJECTED };
      mockTermsService.findById.mockResolvedValue(rejectedTerm);
      mockPrismaService.progress.create.mockResolvedValue({
        id: 'progress-1',
        ...uploadData,
        termId: 'term-1',
        uploadedById: 'contractor-id',
        uploadedBy: { id: 'contractor-id', name: 'Test Contractor' },
      });

      const result = await service.uploadProgress('term-1', uploadData, mockContractor);

      expect(result).toBeDefined();
    });
  });

  describe('submitForVerification', () => {
    it('should throw ForbiddenException if user is not CONTRACTOR', async () => {
      await expect(
        service.submitForVerification('term-1', mockOwner),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if contractor is not assigned to project', async () => {
      const termWithDifferentContractor = {
        ...mockTerm,
        contract: {
          project: {
            contractor: { id: 'different-contractor-id' },
          },
        },
      };
      mockTermsService.findById.mockResolvedValue(termWithDifferentContractor);

      await expect(
        service.submitForVerification('term-1', mockContractor),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if no progress uploaded', async () => {
      mockTermsService.findById.mockResolvedValue(mockTerm);

      await expect(
        service.submitForVerification('term-1', mockContractor),
      ).rejects.toThrow(BadRequestException);
    });

    it('should submit for verification successfully', async () => {
      const termWithProgress = {
        ...mockTerm,
        progress: [{ id: 'progress-1', description: 'Some progress' }],
      };
      mockTermsService.findById.mockResolvedValue(termWithProgress);
      mockTermsService.updateStatusToSubmitted.mockResolvedValue({
        ...termWithProgress,
        status: TermStatus.SUBMITTED,
      });

      const result = await service.submitForVerification('term-1', mockContractor);

      expect(result.message).toBe('Progres berhasil diajukan untuk verifikasi');
      expect(mockTermsService.updateStatusToSubmitted).toHaveBeenCalledWith(
        'term-1',
        'contractor-id',
      );
      expect(mockPrismaService.verification.deleteMany).toHaveBeenCalledWith({
        where: { termId: 'term-1' },
      });
    });
  });

  describe('findByTerm', () => {
    it('should return all progress for a term', async () => {
      const mockProgressList = [
        { id: 'progress-1', description: 'Progress 1', claimPercentage: 50 },
        { id: 'progress-2', description: 'Progress 2', claimPercentage: 80 },
      ];
      mockPrismaService.progress.findMany.mockResolvedValue(mockProgressList);

      const result = await service.findByTerm('term-1');

      expect(result).toEqual(mockProgressList);
      expect(mockPrismaService.progress.findMany).toHaveBeenCalledWith({
        where: { termId: 'term-1' },
        orderBy: { createdAt: 'desc' },
        include: {
          uploadedBy: { select: { id: true, name: true } },
        },
      });
    });
  });
});
