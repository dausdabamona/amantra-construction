import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BlockchainService } from './blockchain.service';
import { ethers } from 'ethers';

// Mock ethers module
jest.mock('ethers', () => {
  const originalModule = jest.requireActual('ethers');
  return {
    ...originalModule,
    ethers: {
      ...originalModule.ethers,
      JsonRpcProvider: jest.fn(),
      Wallet: jest.fn(),
      Contract: jest.fn(),
      keccak256: jest.fn(() => '0xmockhash123'),
      toUtf8Bytes: jest.fn((str: string) => Buffer.from(str)),
      parseUnits: jest.fn((value: string) => BigInt(value)),
      formatEther: jest.fn(() => '1.5'),
      ZeroHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    },
  };
});

describe('BlockchainService', () => {
  let service: BlockchainService;
  let configService: ConfigService;

  const mockConfigEnabled = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const config: Record<string, string> = {
        BLOCKCHAIN_ENABLED: 'true',
        BLOCKCHAIN_RPC_URL: 'https://rpc-amoy.polygon.technology',
        BLOCKCHAIN_CONTRACT_ADDRESS: '0x1234567890123456789012345678901234567890',
        BLOCKCHAIN_PRIVATE_KEY: 'abc123privatekey',
        BLOCKCHAIN_CHAIN_ID: '80002',
      };
      return config[key] || defaultValue || '';
    }),
  };

  const mockConfigDisabled = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const config: Record<string, string> = {
        BLOCKCHAIN_ENABLED: 'false',
        BLOCKCHAIN_RPC_URL: '',
        BLOCKCHAIN_CONTRACT_ADDRESS: '',
        BLOCKCHAIN_PRIVATE_KEY: '',
        BLOCKCHAIN_CHAIN_ID: '80002',
      };
      return config[key] || defaultValue || '';
    }),
  };

  describe('when blockchain is disabled', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          BlockchainService,
          {
            provide: ConfigService,
            useValue: mockConfigDisabled,
          },
        ],
      }).compile();

      service = module.get<BlockchainService>(BlockchainService);
      configService = module.get<ConfigService>(ConfigService);
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should return false for isEnabled when disabled', async () => {
      await service.onModuleInit();
      expect(service.isEnabled()).toBe(false);
    });

    it('should return error for registerContract when disabled', async () => {
      await service.onModuleInit();
      const result = await service.registerContract('contract-1', 'doc data', 1000000, 3);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Blockchain not enabled');
    });

    it('should return error for recordVerification when disabled', async () => {
      await service.onModuleInit();
      const result = await service.recordVerification('term-1', 'term data', 'SUPERVISOR', true, 'notes');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Blockchain not enabled');
    });

    it('should return error for confirmPayment when disabled', async () => {
      await service.onModuleInit();
      const result = await service.confirmPayment('term-1', 5000000, 'TX123', 'proof data');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Blockchain not enabled');
    });

    it('should return null for getContract when disabled', async () => {
      await service.onModuleInit();
      const result = await service.getContract('contract-1');
      expect(result).toBeNull();
    });

    it('should return empty array for getVerifications when disabled', async () => {
      await service.onModuleInit();
      const result = await service.getVerifications('term-1');
      expect(result).toEqual([]);
    });

    it('should return null for getPayment when disabled', async () => {
      await service.onModuleInit();
      const result = await service.getPayment('term-1');
      expect(result).toBeNull();
    });

    it('should return false for verifyDocumentHash when disabled', async () => {
      await service.onModuleInit();
      const result = await service.verifyDocumentHash('contract-1', 'doc data');
      expect(result).toBe(false);
    });

    it('should return null for getStats when disabled', async () => {
      await service.onModuleInit();
      const result = await service.getStats();
      expect(result).toBeNull();
    });

    it('should return null for getWalletBalance when disabled', async () => {
      await service.onModuleInit();
      const result = await service.getWalletBalance();
      expect(result).toBeNull();
    });
  });

  describe('when blockchain is enabled', () => {
    let mockContract: any;
    let mockProvider: any;
    let mockWallet: any;

    beforeEach(async () => {
      // Reset mocks
      jest.clearAllMocks();

      mockContract = {
        registerContract: jest.fn(),
        recordVerification: jest.fn(),
        confirmPayment: jest.fn(),
        getContract: jest.fn(),
        getVerifications: jest.fn(),
        getPayment: jest.fn(),
        verifyDocumentHash: jest.fn(),
        getContractsCount: jest.fn(),
        getVerifiedTermsCount: jest.fn(),
        getPaidTermsCount: jest.fn(),
      };

      mockProvider = {
        getNetwork: jest.fn().mockResolvedValue({ name: 'amoy', chainId: 80002n }),
        getBalance: jest.fn().mockResolvedValue(1500000000000000000n),
      };

      mockWallet = {
        address: '0xWalletAddress',
      };

      (ethers.JsonRpcProvider as unknown as jest.Mock).mockImplementation(() => mockProvider);
      (ethers.Wallet as unknown as jest.Mock).mockImplementation(() => mockWallet);
      (ethers.Contract as unknown as jest.Mock).mockImplementation(() => mockContract);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          BlockchainService,
          {
            provide: ConfigService,
            useValue: mockConfigEnabled,
          },
        ],
      }).compile();

      service = module.get<BlockchainService>(BlockchainService);
    });

    it('should initialize successfully', async () => {
      await service.onModuleInit();
      expect(service.isEnabled()).toBe(true);
      expect(ethers.JsonRpcProvider).toHaveBeenCalled();
      expect(ethers.Wallet).toHaveBeenCalled();
      expect(ethers.Contract).toHaveBeenCalled();
    });

    it('should generate hash correctly', () => {
      const hash = service.generateHash('test data');
      expect(ethers.keccak256).toHaveBeenCalled();
      expect(hash).toBe('0xmockhash123');
    });

    describe('registerContract', () => {
      it('should register contract successfully', async () => {
        await service.onModuleInit();

        const mockTx = {
          wait: jest.fn().mockResolvedValue({
            hash: '0xtxhash123',
            blockNumber: 12345,
          }),
        };
        mockContract.registerContract.mockResolvedValue(mockTx);

        const result = await service.registerContract('contract-1', 'doc data', 1000000, 3);

        expect(result.success).toBe(true);
        expect(result.transactionHash).toBe('0xtxhash123');
        expect(result.blockNumber).toBe(12345);
        expect(mockContract.registerContract).toHaveBeenCalledWith(
          'contract-1',
          '0xmockhash123',
          expect.anything(),
          3,
        );
      });

      it('should handle errors in registerContract', async () => {
        await service.onModuleInit();

        mockContract.registerContract.mockRejectedValue(new Error('Contract error'));

        const result = await service.registerContract('contract-1', 'doc data', 1000000, 3);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Contract error');
      });
    });

    describe('recordVerification', () => {
      it('should record verification successfully', async () => {
        await service.onModuleInit();

        const mockTx = {
          wait: jest.fn().mockResolvedValue({
            hash: '0xverifyhash',
            blockNumber: 12346,
          }),
        };
        mockContract.recordVerification.mockResolvedValue(mockTx);

        const result = await service.recordVerification(
          'term-1',
          'term data',
          'SUPERVISOR',
          true,
          'Approved',
        );

        expect(result.success).toBe(true);
        expect(result.transactionHash).toBe('0xverifyhash');
        expect(mockContract.recordVerification).toHaveBeenCalledWith(
          'term-1',
          '0xmockhash123',
          'SUPERVISOR',
          true,
          'Approved',
        );
      });

      it('should handle empty notes', async () => {
        await service.onModuleInit();

        const mockTx = {
          wait: jest.fn().mockResolvedValue({
            hash: '0xverifyhash',
            blockNumber: 12346,
          }),
        };
        mockContract.recordVerification.mockResolvedValue(mockTx);

        const result = await service.recordVerification(
          'term-1',
          'term data',
          'WITNESS',
          false,
          '',
        );

        expect(result.success).toBe(true);
        expect(mockContract.recordVerification).toHaveBeenCalledWith(
          'term-1',
          '0xmockhash123',
          'WITNESS',
          false,
          '',
        );
      });

      it('should handle errors in recordVerification', async () => {
        await service.onModuleInit();

        mockContract.recordVerification.mockRejectedValue(new Error('Verification failed'));

        const result = await service.recordVerification(
          'term-1',
          'term data',
          'SUPERVISOR',
          true,
          'notes',
        );

        expect(result.success).toBe(false);
        expect(result.error).toBe('Verification failed');
      });
    });

    describe('confirmPayment', () => {
      it('should confirm payment successfully', async () => {
        await service.onModuleInit();

        const mockTx = {
          wait: jest.fn().mockResolvedValue({
            hash: '0xpaymenthash',
            blockNumber: 12347,
          }),
        };
        mockContract.confirmPayment.mockResolvedValue(mockTx);

        const result = await service.confirmPayment('term-1', 5000000, 'TX123', 'proof data');

        expect(result.success).toBe(true);
        expect(result.transactionHash).toBe('0xpaymenthash');
        expect(mockContract.confirmPayment).toHaveBeenCalled();
      });

      it('should use ZeroHash when no proof data', async () => {
        await service.onModuleInit();

        const mockTx = {
          wait: jest.fn().mockResolvedValue({
            hash: '0xpaymenthash',
            blockNumber: 12347,
          }),
        };
        mockContract.confirmPayment.mockResolvedValue(mockTx);

        const result = await service.confirmPayment('term-1', 5000000, 'TX123');

        expect(result.success).toBe(true);
        expect(mockContract.confirmPayment).toHaveBeenCalledWith(
          'term-1',
          expect.anything(),
          'TX123',
          ethers.ZeroHash,
        );
      });

      it('should handle errors in confirmPayment', async () => {
        await service.onModuleInit();

        mockContract.confirmPayment.mockRejectedValue(new Error('Payment failed'));

        const result = await service.confirmPayment('term-1', 5000000, 'TX123', 'proof');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Payment failed');
      });
    });

    describe('getContract', () => {
      it('should get contract successfully', async () => {
        await service.onModuleInit();

        mockContract.getContract.mockResolvedValue([
          '0xdocumenthash',
          1000000n,
          3n,
          1700000000n,
          '0xregisteredby',
          true,
        ]);

        const result = await service.getContract('contract-1');

        expect(result).toEqual({
          documentHash: '0xdocumenthash',
          totalValue: 1000000n,
          termCount: 3n,
          registeredAt: 1700000000n,
          registeredBy: '0xregisteredby',
          exists: true,
        });
      });

      it('should handle errors in getContract', async () => {
        await service.onModuleInit();

        mockContract.getContract.mockRejectedValue(new Error('Contract not found'));

        const result = await service.getContract('contract-1');

        expect(result).toBeNull();
      });
    });

    describe('getVerifications', () => {
      it('should get verifications successfully', async () => {
        await service.onModuleInit();

        mockContract.getVerifications.mockResolvedValue([
          {
            visibleTermId: 'term-1',
            termHash: '0xtermhash',
            verifier: '0xverifier1',
            role: 'SUPERVISOR',
            approved: true,
            notes: 'Approved',
            verifiedAt: 1700000100n,
          },
          {
            visibleTermId: 'term-1',
            termHash: '0xtermhash',
            verifier: '0xverifier2',
            role: 'WITNESS',
            approved: true,
            notes: 'OK',
            verifiedAt: 1700000200n,
          },
        ]);

        const result = await service.getVerifications('term-1');

        expect(result).toHaveLength(2);
        expect(result[0].role).toBe('SUPERVISOR');
        expect(result[1].role).toBe('WITNESS');
      });

      it('should handle errors in getVerifications', async () => {
        await service.onModuleInit();

        mockContract.getVerifications.mockRejectedValue(new Error('Network error'));

        const result = await service.getVerifications('term-1');

        expect(result).toEqual([]);
      });
    });

    describe('getPayment', () => {
      it('should get payment successfully', async () => {
        await service.onModuleInit();

        mockContract.getPayment.mockResolvedValue([
          5000000n,
          'TX123456',
          '0xproofhash',
          1700000300n,
          '0xconfirmedby',
        ]);

        const result = await service.getPayment('term-1');

        expect(result).toEqual({
          amount: 5000000n,
          transactionRef: 'TX123456',
          proofHash: '0xproofhash',
          paidAt: 1700000300n,
          confirmedBy: '0xconfirmedby',
        });
      });

      it('should return null when no payment recorded', async () => {
        await service.onModuleInit();

        mockContract.getPayment.mockResolvedValue([
          0n,
          '',
          '0x0',
          0n,
          '0x0',
        ]);

        const result = await service.getPayment('term-1');

        expect(result).toBeNull();
      });

      it('should handle errors in getPayment', async () => {
        await service.onModuleInit();

        mockContract.getPayment.mockRejectedValue(new Error('Network error'));

        const result = await service.getPayment('term-1');

        expect(result).toBeNull();
      });
    });

    describe('verifyDocumentHash', () => {
      it('should verify document hash successfully', async () => {
        await service.onModuleInit();

        mockContract.verifyDocumentHash.mockResolvedValue(true);

        const result = await service.verifyDocumentHash('contract-1', 'doc data');

        expect(result).toBe(true);
        expect(mockContract.verifyDocumentHash).toHaveBeenCalledWith('contract-1', '0xmockhash123');
      });

      it('should return false when hash does not match', async () => {
        await service.onModuleInit();

        mockContract.verifyDocumentHash.mockResolvedValue(false);

        const result = await service.verifyDocumentHash('contract-1', 'wrong data');

        expect(result).toBe(false);
      });

      it('should handle errors in verifyDocumentHash', async () => {
        await service.onModuleInit();

        mockContract.verifyDocumentHash.mockRejectedValue(new Error('Network error'));

        const result = await service.verifyDocumentHash('contract-1', 'doc data');

        expect(result).toBe(false);
      });
    });

    describe('getStats', () => {
      it('should get stats successfully', async () => {
        await service.onModuleInit();

        mockContract.getContractsCount.mockResolvedValue(10n);
        mockContract.getVerifiedTermsCount.mockResolvedValue(25n);
        mockContract.getPaidTermsCount.mockResolvedValue(20n);

        const result = await service.getStats();

        expect(result).toEqual({
          contractsCount: 10,
          verifiedTermsCount: 25,
          paidTermsCount: 20,
        });
      });

      it('should handle errors in getStats', async () => {
        await service.onModuleInit();

        mockContract.getContractsCount.mockRejectedValue(new Error('Network error'));

        const result = await service.getStats();

        expect(result).toBeNull();
      });
    });

    describe('getWalletBalance', () => {
      it('should get wallet balance successfully', async () => {
        await service.onModuleInit();

        const result = await service.getWalletBalance();

        expect(result).toBe('1.5');
        expect(ethers.formatEther).toHaveBeenCalled();
      });

      it('should handle errors in getWalletBalance', async () => {
        await service.onModuleInit();

        mockProvider.getBalance.mockRejectedValue(new Error('Network error'));

        const result = await service.getWalletBalance();

        expect(result).toBeNull();
      });
    });

    describe('initialization edge cases', () => {
      it('should disable blockchain when initialization fails', async () => {
        mockProvider.getNetwork.mockRejectedValue(new Error('Connection failed'));

        await service.onModuleInit();

        expect(service.isEnabled()).toBe(false);
      });
    });
  });

  describe('when blockchain config is incomplete', () => {
    beforeEach(async () => {
      const incompleteConfig = {
        get: jest.fn((key: string, defaultValue?: string) => {
          const config: Record<string, string> = {
            BLOCKCHAIN_ENABLED: 'true',
            BLOCKCHAIN_RPC_URL: '', // Missing
            BLOCKCHAIN_CONTRACT_ADDRESS: '', // Missing
            BLOCKCHAIN_PRIVATE_KEY: '', // Missing
            BLOCKCHAIN_CHAIN_ID: '80002',
          };
          return config[key] || defaultValue || '';
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          BlockchainService,
          {
            provide: ConfigService,
            useValue: incompleteConfig,
          },
        ],
      }).compile();

      service = module.get<BlockchainService>(BlockchainService);
    });

    it('should disable blockchain when config is incomplete', async () => {
      await service.onModuleInit();
      expect(service.isEnabled()).toBe(false);
    });
  });
});
