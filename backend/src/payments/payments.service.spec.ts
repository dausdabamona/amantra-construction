import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { JwtPayload } from '../common/jwt-payload.interface';
import { PaymentStatus, TermStatus } from '../common/types';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prismaService: PrismaService;
  let auditService: AuditService;

  const mockPrismaService = {
    term: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
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

  // Mock term with payment
  const mockTermWithPayment = {
    id: 'term-1',
    name: 'Termin 1',
    status: TermStatus.VALID,
    contract: {
      project: {
        ownerId: 'owner-id',
      },
    },
    payment: {
      id: 'payment-1',
      amount: 1000000,
      status: PaymentStatus.READY,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prismaService = module.get<PrismaService>(PrismaService);
    auditService = module.get<AuditService>(AuditService);

    jest.clearAllMocks();
  });

  describe('confirmPayment', () => {
    it('should throw ForbiddenException if user is not OWNER', async () => {
      await expect(
        service.confirmPayment('term-1', {}, mockContractor),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if term not found', async () => {
      mockPrismaService.term.findUnique.mockResolvedValue(null);

      await expect(
        service.confirmPayment('term-1', {}, mockOwner),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the project owner', async () => {
      const termWithDifferentOwner = {
        ...mockTermWithPayment,
        contract: {
          project: {
            ownerId: 'different-owner-id',
          },
        },
      };
      mockPrismaService.term.findUnique.mockResolvedValue(termWithDifferentOwner);

      await expect(
        service.confirmPayment('term-1', {}, mockOwner),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if term status is not VALID', async () => {
      const termNotValid = {
        ...mockTermWithPayment,
        status: TermStatus.SUBMITTED,
      };
      mockPrismaService.term.findUnique.mockResolvedValue(termNotValid);

      await expect(
        service.confirmPayment('term-1', {}, mockOwner),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if payment status is not READY', async () => {
      const termPaymentNotReady = {
        ...mockTermWithPayment,
        payment: {
          ...mockTermWithPayment.payment,
          status: PaymentStatus.PENDING,
        },
      };
      mockPrismaService.term.findUnique.mockResolvedValue(termPaymentNotReady);

      await expect(
        service.confirmPayment('term-1', {}, mockOwner),
      ).rejects.toThrow(BadRequestException);
    });

    it('should confirm payment successfully', async () => {
      mockPrismaService.term.findUnique.mockResolvedValue(mockTermWithPayment);
      mockPrismaService.payment.update.mockResolvedValue({
        id: 'payment-1',
        amount: 1000000,
        status: PaymentStatus.PAID,
        proofUrl: '/proof.jpg',
        transactionRef: 'TRF-123',
        paidAt: new Date(),
      });
      mockPrismaService.term.update.mockResolvedValue({
        ...mockTermWithPayment,
        status: TermStatus.PAID,
      });

      const result = await service.confirmPayment(
        'term-1',
        { proofUrl: '/proof.jpg', transactionRef: 'TRF-123' },
        mockOwner,
      );

      expect(result.status).toBe(PaymentStatus.PAID);
      expect(mockPrismaService.payment.update).toHaveBeenCalledWith({
        where: { termId: 'term-1' },
        data: expect.objectContaining({
          status: PaymentStatus.PAID,
          proofUrl: '/proof.jpg',
          transactionRef: 'TRF-123',
        }),
      });
      expect(mockPrismaService.term.update).toHaveBeenCalledWith({
        where: { id: 'term-1' },
        data: { status: TermStatus.PAID },
      });
      expect(mockAuditService.log).toHaveBeenCalled();
    });
  });

  describe('getPaymentStatus', () => {
    it('should throw NotFoundException if payment not found', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue(null);

      await expect(service.getPaymentStatus('term-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return payment status with term details', async () => {
      const mockPayment = {
        id: 'payment-1',
        amount: 1000000,
        status: PaymentStatus.READY,
        term: {
          id: 'term-1',
          name: 'Termin 1',
          verifications: [
            { id: 'v1', role: 'SUPERVISOR', status: 'APPROVED' },
          ],
        },
      };
      mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);

      const result = await service.getPaymentStatus('term-1');

      expect(result).toEqual(mockPayment);
      expect(mockPrismaService.payment.findUnique).toHaveBeenCalledWith({
        where: { termId: 'term-1' },
        include: expect.any(Object),
      });
    });
  });

  describe('getReadyPayments', () => {
    it('should return empty array for non-OWNER users', async () => {
      const result = await service.getReadyPayments(mockContractor);
      expect(result).toEqual([]);
    });

    it('should return ready payments for OWNER', async () => {
      const mockReadyPayments = [
        {
          id: 'payment-1',
          amount: 1000000,
          status: PaymentStatus.READY,
          term: {
            name: 'Termin 1',
            contract: {
              project: { id: 'project-1', name: 'Project 1' },
            },
          },
        },
      ];
      mockPrismaService.payment.findMany.mockResolvedValue(mockReadyPayments);

      const result = await service.getReadyPayments(mockOwner);

      expect(result).toEqual(mockReadyPayments);
      expect(mockPrismaService.payment.findMany).toHaveBeenCalledWith({
        where: {
          status: PaymentStatus.READY,
          term: {
            contract: {
              project: {
                ownerId: 'owner-id',
              },
            },
          },
        },
        include: expect.any(Object),
      });
    });
  });
});
