import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { VerificationsService } from './verifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { TermsService } from '../terms/terms.service';
import { AuditService } from '../audit/audit.service';
import { JwtPayload } from '../common/jwt-payload.interface';
import { TermStatus, VerificationRole } from '../common/types';

describe('VerificationsService', () => {
  let service: VerificationsService;
  let prismaService: PrismaService;
  let termsService: TermsService;
  let auditService: AuditService;

  const mockPrismaService = {
    verification: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    term: {
      update: jest.fn(),
    },
  };

  const mockTermsService = {
    findById: jest.fn(),
    updateStatusToValid: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  // Mock data
  const mockSupervisor: JwtPayload = {
    sub: 'supervisor-id',
    email: 'supervisor@test.com',
    role: 'SUPERVISOR',
    name: 'Test Supervisor',
  };

  const mockWitness: JwtPayload = {
    sub: 'witness-id',
    email: 'witness@test.com',
    role: 'WITNESS',
    name: 'Test Witness',
  };

  const mockOwner: JwtPayload = {
    sub: 'owner-id',
    email: 'owner@test.com',
    role: 'OWNER',
    name: 'Test Owner',
  };

  const mockTerm = {
    id: 'term-1',
    name: 'Termin 1',
    status: TermStatus.SUBMITTED,
    contract: {
      project: {
        supervisor: { id: 'supervisor-id' },
        witness: { id: 'witness-id' },
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerificationsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: TermsService, useValue: mockTermsService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<VerificationsService>(VerificationsService);
    prismaService = module.get<PrismaService>(PrismaService);
    termsService = module.get<TermsService>(TermsService);
    auditService = module.get<AuditService>(AuditService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('verify', () => {
    it('should throw ForbiddenException if user is not SUPERVISOR or WITNESS', async () => {
      await expect(
        service.verify('term-1', { status: 'APPROVED' }, mockOwner),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if supervisor is not assigned to project', async () => {
      const wrongSupervisor: JwtPayload = {
        ...mockSupervisor,
        sub: 'wrong-supervisor-id',
      };

      mockTermsService.findById.mockResolvedValue(mockTerm);

      await expect(
        service.verify('term-1', { status: 'APPROVED' }, wrongSupervisor),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if witness is not assigned to project', async () => {
      const wrongWitness: JwtPayload = {
        ...mockWitness,
        sub: 'wrong-witness-id',
      };

      mockTermsService.findById.mockResolvedValue(mockTerm);

      await expect(
        service.verify('term-1', { status: 'APPROVED' }, wrongWitness),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if term is not SUBMITTED', async () => {
      const termNotSubmitted = {
        ...mockTerm,
        status: TermStatus.DRAFT,
      };

      mockTermsService.findById.mockResolvedValue(termNotSubmitted);

      await expect(
        service.verify('term-1', { status: 'APPROVED' }, mockSupervisor),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if already verified by same role', async () => {
      mockTermsService.findById.mockResolvedValue(mockTerm);
      mockPrismaService.verification.findUnique.mockResolvedValue({
        id: 'existing-verification',
        role: VerificationRole.SUPERVISOR,
      });

      await expect(
        service.verify('term-1', { status: 'APPROVED' }, mockSupervisor),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create verification successfully for SUPERVISOR', async () => {
      mockTermsService.findById.mockResolvedValue(mockTerm);
      mockPrismaService.verification.findUnique.mockResolvedValue(null);
      mockPrismaService.verification.create.mockResolvedValue({
        id: 'new-verification',
        role: VerificationRole.SUPERVISOR,
        status: 'APPROVED',
        verifier: { id: 'supervisor-id', name: 'Test Supervisor', role: 'SUPERVISOR' },
      });
      mockPrismaService.verification.findMany.mockResolvedValue([
        { role: 'SUPERVISOR', status: 'APPROVED' },
      ]);

      const result = await service.verify(
        'term-1',
        { status: 'APPROVED', notes: 'Looks good' },
        mockSupervisor,
      );

      expect(result.role).toBe(VerificationRole.SUPERVISOR);
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should create verification successfully for WITNESS', async () => {
      mockTermsService.findById.mockResolvedValue(mockTerm);
      mockPrismaService.verification.findUnique.mockResolvedValue(null);
      mockPrismaService.verification.create.mockResolvedValue({
        id: 'new-verification',
        role: VerificationRole.WITNESS,
        status: 'APPROVED',
        verifier: { id: 'witness-id', name: 'Test Witness', role: 'WITNESS' },
      });
      mockPrismaService.verification.findMany.mockResolvedValue([
        { role: 'WITNESS', status: 'APPROVED' },
      ]);

      const result = await service.verify(
        'term-1',
        { status: 'APPROVED' },
        mockWitness,
      );

      expect(result.role).toBe(VerificationRole.WITNESS);
    });

    it('should update term to VALID when both verifications are APPROVED', async () => {
      mockTermsService.findById.mockResolvedValue(mockTerm);
      mockPrismaService.verification.findUnique.mockResolvedValue(null);
      mockPrismaService.verification.create.mockResolvedValue({
        id: 'new-verification',
        role: VerificationRole.WITNESS,
        status: 'APPROVED',
        verifier: { id: 'witness-id', name: 'Test Witness', role: 'WITNESS' },
      });
      mockPrismaService.verification.findMany.mockResolvedValue([
        { role: 'SUPERVISOR', status: 'APPROVED' },
        { role: 'WITNESS', status: 'APPROVED' },
      ]);

      await service.verify('term-1', { status: 'APPROVED' }, mockWitness);

      expect(mockTermsService.updateStatusToValid).toHaveBeenCalledWith(
        'term-1',
        'witness-id',
      );
    });

    it('should update term to REJECTED when one verification is REJECTED', async () => {
      mockTermsService.findById.mockResolvedValue(mockTerm);
      mockPrismaService.verification.findUnique.mockResolvedValue(null);
      mockPrismaService.verification.create.mockResolvedValue({
        id: 'new-verification',
        role: VerificationRole.SUPERVISOR,
        status: 'REJECTED',
        verifier: { id: 'supervisor-id', name: 'Test Supervisor', role: 'SUPERVISOR' },
      });
      mockPrismaService.verification.findMany.mockResolvedValue([
        { role: 'SUPERVISOR', status: 'REJECTED' },
        { role: 'WITNESS', status: 'APPROVED' },
      ]);

      await service.verify('term-1', { status: 'REJECTED' }, mockSupervisor);

      expect(mockPrismaService.term.update).toHaveBeenCalledWith({
        where: { id: 'term-1' },
        data: { status: TermStatus.REJECTED },
      });
    });
  });

  describe('getTermVerifications', () => {
    it('should return verifications for a term', async () => {
      const mockVerifications = [
        { id: 'v1', role: 'SUPERVISOR', status: 'APPROVED' },
        { id: 'v2', role: 'WITNESS', status: 'APPROVED' },
      ];
      mockPrismaService.verification.findMany.mockResolvedValue(mockVerifications);

      const result = await service.getTermVerifications('term-1');

      expect(result).toEqual(mockVerifications);
      expect(mockPrismaService.verification.findMany).toHaveBeenCalledWith({
        where: { termId: 'term-1' },
        include: {
          verifier: { select: { id: true, name: true, role: true } },
        },
      });
    });
  });

  describe('getPendingVerifications', () => {
    it('should return empty array for non-verifier roles', async () => {
      const result = await service.getPendingVerifications(mockOwner);
      expect(result).toEqual([]);
    });

    it('should return pending terms for SUPERVISOR', async () => {
      const mockPendingTerms = [
        { id: 'term-1', name: 'Pending Term', status: 'SUBMITTED' },
      ];
      mockPrismaService.term = {
        findMany: jest.fn().mockResolvedValue(mockPendingTerms),
      } as any;

      // Re-create service with updated mock
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          VerificationsService,
          { provide: PrismaService, useValue: { ...mockPrismaService, term: { findMany: jest.fn().mockResolvedValue(mockPendingTerms) } } },
          { provide: TermsService, useValue: mockTermsService },
          { provide: AuditService, useValue: mockAuditService },
        ],
      }).compile();

      const testService = module.get<VerificationsService>(VerificationsService);
      const result = await testService.getPendingVerifications(mockSupervisor);

      expect(result).toEqual(mockPendingTerms);
    });
  });
});
