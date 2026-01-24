import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TermsService } from './terms.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { JwtPayload } from '../common/jwt-payload.interface';
import { TermStatus, PaymentStatus } from '../common/types';

describe('TermsService', () => {
  let service: TermsService;
  let prismaService: PrismaService;
  let auditService: AuditService;

  const mockPrismaService = {
    contract: {
      findUnique: jest.fn(),
    },
    term: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      update: jest.fn(),
    },
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  // Mock users
  const mockOwner: JwtPayload = {
    sub: 'owner-id',
    email: 'owner@test.com',
    role: 'OWNER',
    name: 'Test Owner',
  };

  const mockContractor: JwtPayload = {
    sub: 'contractor-id',
    email: 'contractor@test.com',
    role: 'CONTRACTOR',
    name: 'Test Contractor',
  };

  // Mock data
  const mockContract = {
    id: 'contract-1',
    contractNumber: 'KTR-001',
    totalValue: 1000000,
    project: {
      id: 'project-1',
      name: 'Test Project',
    },
  };

  const mockTerm = {
    id: 'term-1',
    termNumber: 1,
    name: 'Termin 1',
    description: 'First term',
    percentage: 30,
    value: 300000,
    status: TermStatus.DRAFT,
    contractId: 'contract-1',
    payment: {
      id: 'payment-1',
      amount: 300000,
      status: PaymentStatus.PENDING,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TermsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<TermsService>(TermsService);
    prismaService = module.get<PrismaService>(PrismaService);
    auditService = module.get<AuditService>(AuditService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createTermDto = {
      termNumber: 1,
      name: 'Termin 1',
      description: 'First term',
      percentage: 30,
      value: 300000,
    };

    it('should throw ForbiddenException if user is not OWNER', async () => {
      await expect(
        service.create('contract-1', createTermDto, mockContractor),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if contract not found', async () => {
      mockPrismaService.contract.findUnique.mockResolvedValue(null);

      await expect(
        service.create('contract-1', createTermDto, mockOwner),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create term successfully', async () => {
      mockPrismaService.contract.findUnique.mockResolvedValue(mockContract);
      mockPrismaService.term.create.mockResolvedValue(mockTerm);

      const result = await service.create('contract-1', createTermDto, mockOwner);

      expect(result).toEqual(mockTerm);
      expect(mockPrismaService.term.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          termNumber: 1,
          name: 'Termin 1',
          status: TermStatus.DRAFT,
          contractId: 'contract-1',
          payment: {
            create: {
              amount: 300000,
              status: PaymentStatus.PENDING,
            },
          },
        }),
        include: { payment: true },
      });
      expect(mockAuditService.log).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should throw NotFoundException if term not found', async () => {
      mockPrismaService.term.findUnique.mockResolvedValue(null);

      await expect(service.findById('term-1')).rejects.toThrow(NotFoundException);
    });

    it('should return term with all relations', async () => {
      const mockTermWithRelations = {
        ...mockTerm,
        contract: {
          project: {
            owner: { id: 'owner-id', name: 'Owner' },
            contractor: { id: 'contractor-id', name: 'Contractor' },
            supervisor: { id: 'supervisor-id', name: 'Supervisor' },
            witness: { id: 'witness-id', name: 'Witness' },
          },
        },
        progress: [],
        verifications: [],
      };
      mockPrismaService.term.findUnique.mockResolvedValue(mockTermWithRelations);

      const result = await service.findById('term-1');

      expect(result).toEqual(mockTermWithRelations);
      expect(mockPrismaService.term.findUnique).toHaveBeenCalledWith({
        where: { id: 'term-1' },
        include: expect.any(Object),
      });
    });
  });

  describe('findByContract', () => {
    it('should return all terms for a contract', async () => {
      const mockTerms = [mockTerm, { ...mockTerm, id: 'term-2', termNumber: 2 }];
      mockPrismaService.term.findMany.mockResolvedValue(mockTerms);

      const result = await service.findByContract('contract-1');

      expect(result).toEqual(mockTerms);
      expect(mockPrismaService.term.findMany).toHaveBeenCalledWith({
        where: { contractId: 'contract-1' },
        orderBy: { termNumber: 'asc' },
        include: expect.any(Object),
      });
    });
  });

  describe('updateStatusToValid', () => {
    it('should update term status to VALID and payment to READY', async () => {
      const updatedTerm = { ...mockTerm, status: TermStatus.VALID };
      mockPrismaService.term.update.mockResolvedValue(updatedTerm);
      mockPrismaService.payment.update.mockResolvedValue({
        ...mockTerm.payment,
        status: PaymentStatus.READY,
      });

      const result = await service.updateStatusToValid('term-1', 'user-id');

      expect(result.status).toBe(TermStatus.VALID);
      expect(mockPrismaService.term.update).toHaveBeenCalledWith({
        where: { id: 'term-1' },
        data: { status: TermStatus.VALID },
      });
      expect(mockPrismaService.payment.update).toHaveBeenCalledWith({
        where: { termId: 'term-1' },
        data: { status: PaymentStatus.READY },
      });
      expect(mockAuditService.log).toHaveBeenCalled();
    });
  });

  describe('updateStatusToSubmitted', () => {
    it('should update term status to SUBMITTED', async () => {
      const updatedTerm = { ...mockTerm, status: TermStatus.SUBMITTED };
      mockPrismaService.term.update.mockResolvedValue(updatedTerm);

      const result = await service.updateStatusToSubmitted('term-1', 'user-id');

      expect(result.status).toBe(TermStatus.SUBMITTED);
      expect(mockPrismaService.term.update).toHaveBeenCalledWith({
        where: { id: 'term-1' },
        data: { status: TermStatus.SUBMITTED },
      });
      expect(mockAuditService.log).toHaveBeenCalled();
    });
  });
});
