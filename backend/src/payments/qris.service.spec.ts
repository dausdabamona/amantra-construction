import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { QrisService, QrisPaymentRequest, WebhookPayload } from './qris.service';

// Mock midtrans-client
jest.mock('midtrans-client', () => ({
  CoreApi: jest.fn().mockImplementation(() => ({
    charge: jest.fn(),
    transaction: {
      status: jest.fn(),
      cancel: jest.fn(),
    },
  })),
}));

describe('QrisService', () => {
  let service: QrisService;
  let mockCoreApi: any;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config: Record<string, string> = {
        MIDTRANS_IS_PRODUCTION: 'false',
        MIDTRANS_SERVER_KEY: 'SB-Mid-server-test123',
        MIDTRANS_CLIENT_KEY: 'SB-Mid-client-test123',
      };
      return config[key] || defaultValue;
    }),
  };

  const mockPaymentRequest: QrisPaymentRequest = {
    orderId: 'TERM-123-1234567890',
    amount: 1000000,
    termName: 'Termin 1',
    projectName: 'Test Project',
    customerName: 'Budi Santoso',
    customerEmail: 'budi@test.com',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QrisService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<QrisService>(QrisService);
    // Access the private coreApi for mocking
    mockCoreApi = (service as any).coreApi;

    jest.clearAllMocks();
  });

  describe('createQrisPayment', () => {
    it('should create QRIS payment successfully', async () => {
      const mockResponse = {
        transaction_id: 'txn-123',
        qr_string: '00020101021226670016COM.NOBUBANK.WWW...',
        expiry_time: '2024-01-01 12:00:00',
        actions: [
          { name: 'generate-qr-code', url: 'https://api.midtrans.com/v2/qris/123/qr-code' },
        ],
      };

      mockCoreApi.charge.mockResolvedValue(mockResponse);

      const result = await service.createQrisPayment(mockPaymentRequest);

      expect(result).toEqual({
        orderId: mockPaymentRequest.orderId,
        qrCodeUrl: 'https://api.midtrans.com/v2/qris/123/qr-code',
        qrString: '00020101021226670016COM.NOBUBANK.WWW...',
        transactionId: 'txn-123',
        expiryTime: '2024-01-01 12:00:00',
      });

      expect(mockCoreApi.charge).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_type: 'qris',
          transaction_details: {
            order_id: mockPaymentRequest.orderId,
            gross_amount: mockPaymentRequest.amount,
          },
        }),
      );
    });

    it('should throw error when charge fails', async () => {
      mockCoreApi.charge.mockRejectedValue(new Error('Midtrans API Error'));

      await expect(service.createQrisPayment(mockPaymentRequest)).rejects.toThrow(
        'Midtrans API Error',
      );
    });
  });

  describe('checkPaymentStatus', () => {
    it('should return payment status', async () => {
      const mockStatus = {
        transaction_status: 'settlement',
        order_id: 'TERM-123-1234567890',
        gross_amount: '1000000.00',
      };

      mockCoreApi.transaction.status.mockResolvedValue(mockStatus);

      const result = await service.checkPaymentStatus('TERM-123-1234567890');

      expect(result).toEqual(mockStatus);
      expect(mockCoreApi.transaction.status).toHaveBeenCalledWith('TERM-123-1234567890');
    });

    it('should throw error when status check fails', async () => {
      mockCoreApi.transaction.status.mockRejectedValue(new Error('Not found'));

      await expect(service.checkPaymentStatus('invalid-order')).rejects.toThrow('Not found');
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should return true for valid signature', () => {
      const crypto = require('crypto');
      const serverKey = 'SB-Mid-server-test123';
      const orderId = 'TERM-123-1234567890';
      const statusCode = '200';
      const grossAmount = '1000000.00';

      const signatureInput = orderId + statusCode + grossAmount + serverKey;
      const expectedSignature = crypto.createHash('sha512').update(signatureInput).digest('hex');

      const payload: WebhookPayload = {
        transaction_type: 'on-us',
        transaction_time: '2024-01-01 10:00:00',
        transaction_status: 'settlement',
        transaction_id: 'txn-123',
        status_message: 'Success',
        status_code: statusCode,
        signature_key: expectedSignature,
        payment_type: 'qris',
        order_id: orderId,
        merchant_id: 'M123',
        gross_amount: grossAmount,
        currency: 'IDR',
      };

      const result = service.verifyWebhookSignature(payload);
      expect(result).toBe(true);
    });

    it('should return false for invalid signature', () => {
      const payload: WebhookPayload = {
        transaction_type: 'on-us',
        transaction_time: '2024-01-01 10:00:00',
        transaction_status: 'settlement',
        transaction_id: 'txn-123',
        status_message: 'Success',
        status_code: '200',
        signature_key: 'invalid-signature',
        payment_type: 'qris',
        order_id: 'TERM-123-1234567890',
        merchant_id: 'M123',
        gross_amount: '1000000.00',
        currency: 'IDR',
      };

      const result = service.verifyWebhookSignature(payload);
      expect(result).toBe(false);
    });
  });

  describe('isPaymentSuccess', () => {
    it('should return true for settlement status', () => {
      expect(service.isPaymentSuccess('settlement')).toBe(true);
    });

    it('should return true for capture status', () => {
      expect(service.isPaymentSuccess('capture')).toBe(true);
    });

    it('should return false for pending status', () => {
      expect(service.isPaymentSuccess('pending')).toBe(false);
    });

    it('should return false for deny status', () => {
      expect(service.isPaymentSuccess('deny')).toBe(false);
    });
  });

  describe('isPaymentPending', () => {
    it('should return true for pending status', () => {
      expect(service.isPaymentPending('pending')).toBe(true);
    });

    it('should return true for authorize status', () => {
      expect(service.isPaymentPending('authorize')).toBe(true);
    });

    it('should return false for settlement status', () => {
      expect(service.isPaymentPending('settlement')).toBe(false);
    });
  });

  describe('isPaymentFailed', () => {
    it('should return true for deny status', () => {
      expect(service.isPaymentFailed('deny')).toBe(true);
    });

    it('should return true for cancel status', () => {
      expect(service.isPaymentFailed('cancel')).toBe(true);
    });

    it('should return true for expire status', () => {
      expect(service.isPaymentFailed('expire')).toBe(true);
    });

    it('should return true for failure status', () => {
      expect(service.isPaymentFailed('failure')).toBe(true);
    });

    it('should return false for settlement status', () => {
      expect(service.isPaymentFailed('settlement')).toBe(false);
    });
  });

  describe('cancelTransaction', () => {
    it('should cancel transaction successfully', async () => {
      const mockResponse = { status_code: '200', transaction_status: 'cancel' };
      mockCoreApi.transaction.cancel.mockResolvedValue(mockResponse);

      const result = await service.cancelTransaction('TERM-123-1234567890');

      expect(result).toEqual(mockResponse);
      expect(mockCoreApi.transaction.cancel).toHaveBeenCalledWith('TERM-123-1234567890');
    });

    it('should throw error when cancel fails', async () => {
      mockCoreApi.transaction.cancel.mockRejectedValue(new Error('Cannot cancel'));

      await expect(service.cancelTransaction('TERM-123')).rejects.toThrow('Cannot cancel');
    });
  });
});
