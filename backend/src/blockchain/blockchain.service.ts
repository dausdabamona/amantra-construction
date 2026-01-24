import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { AMANTRA_LEDGER_ABI } from './amantra-ledger.abi';

export interface BlockchainConfig {
  enabled: boolean;
  rpcUrl: string;
  contractAddress: string;
  privateKey: string;
  chainId: number;
}

export interface TransactionResult {
  success: boolean;
  transactionHash?: string;
  blockNumber?: number;
  error?: string;
}

export interface ContractOnChain {
  documentHash: string;
  totalValue: bigint;
  termCount: bigint;
  registeredAt: bigint;
  registeredBy: string;
  exists: boolean;
}

export interface VerificationOnChain {
  visibleTermId: string;
  termHash: string;
  verifier: string;
  role: string;
  approved: boolean;
  notes: string;
  verifiedAt: bigint;
}

export interface PaymentOnChain {
  amount: bigint;
  transactionRef: string;
  proofHash: string;
  paidAt: bigint;
  confirmedBy: string;
}

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: ethers.JsonRpcProvider | null = null;
  private wallet: ethers.Wallet | null = null;
  private contract: ethers.Contract | null = null;
  private config: BlockchainConfig;

  constructor(private configService: ConfigService) {
    this.config = {
      enabled: this.configService.get('BLOCKCHAIN_ENABLED', 'false') === 'true',
      rpcUrl: this.configService.get('BLOCKCHAIN_RPC_URL', ''),
      contractAddress: this.configService.get('BLOCKCHAIN_CONTRACT_ADDRESS', ''),
      privateKey: this.configService.get('BLOCKCHAIN_PRIVATE_KEY', ''),
      chainId: parseInt(this.configService.get('BLOCKCHAIN_CHAIN_ID', '80002'), 10), // Polygon Amoy testnet
    };
  }

  async onModuleInit() {
    if (!this.config.enabled) {
      this.logger.log('Blockchain integration is DISABLED');
      return;
    }

    if (!this.config.rpcUrl || !this.config.contractAddress || !this.config.privateKey) {
      this.logger.warn('Blockchain configuration incomplete, integration disabled');
      this.config.enabled = false;
      return;
    }

    try {
      this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
      this.wallet = new ethers.Wallet(this.config.privateKey, this.provider);
      this.contract = new ethers.Contract(
        this.config.contractAddress,
        AMANTRA_LEDGER_ABI,
        this.wallet,
      );

      const network = await this.provider.getNetwork();
      const balance = await this.provider.getBalance(this.wallet.address);

      this.logger.log(`Blockchain connected to ${network.name} (Chain ID: ${network.chainId})`);
      this.logger.log(`Wallet address: ${this.wallet.address}`);
      this.logger.log(`Wallet balance: ${ethers.formatEther(balance)} ETH/MATIC`);
      this.logger.log(`Contract address: ${this.config.contractAddress}`);
    } catch (error) {
      this.logger.error(`Failed to initialize blockchain connection: ${error.message}`);
      this.config.enabled = false;
    }
  }

  /**
   * Check if blockchain integration is enabled and ready
   */
  isEnabled(): boolean {
    return this.config.enabled && this.contract !== null;
  }

  /**
   * Generate hash from data string
   */
  generateHash(data: string): string {
    return ethers.keccak256(ethers.toUtf8Bytes(data));
  }

  /**
   * Register contract on blockchain
   */
  async registerContract(
    contractId: string,
    documentData: string,
    totalValue: number,
    termCount: number,
  ): Promise<TransactionResult> {
    if (!this.isEnabled()) {
      this.logger.debug('Blockchain disabled, skipping registerContract');
      return { success: false, error: 'Blockchain not enabled' };
    }

    try {
      const documentHash = this.generateHash(documentData);
      const totalValueWei = ethers.parseUnits(totalValue.toString(), 0); // Store as-is (IDR)

      this.logger.log(`Registering contract ${contractId} on blockchain...`);

      const tx = await this.contract!.registerContract(
        contractId,
        documentHash,
        totalValueWei,
        termCount,
      );

      const receipt = await tx.wait();

      this.logger.log(`Contract registered on blockchain. TX: ${receipt.hash}`);

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      this.logger.error(`Failed to register contract: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Record verification on blockchain
   */
  async recordVerification(
    termId: string,
    termData: string,
    role: string,
    approved: boolean,
    notes: string,
  ): Promise<TransactionResult> {
    if (!this.isEnabled()) {
      this.logger.debug('Blockchain disabled, skipping recordVerification');
      return { success: false, error: 'Blockchain not enabled' };
    }

    try {
      const termHash = this.generateHash(termData);

      this.logger.log(`Recording verification for term ${termId} by ${role}...`);

      const tx = await this.contract!.recordVerification(
        termId,
        termHash,
        role,
        approved,
        notes || '',
      );

      const receipt = await tx.wait();

      this.logger.log(`Verification recorded on blockchain. TX: ${receipt.hash}`);

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      this.logger.error(`Failed to record verification: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Confirm payment on blockchain
   */
  async confirmPayment(
    termId: string,
    amount: number,
    transactionRef: string,
    proofData?: string,
  ): Promise<TransactionResult> {
    if (!this.isEnabled()) {
      this.logger.debug('Blockchain disabled, skipping confirmPayment');
      return { success: false, error: 'Blockchain not enabled' };
    }

    try {
      const proofHash = proofData
        ? this.generateHash(proofData)
        : ethers.ZeroHash;

      this.logger.log(`Confirming payment for term ${termId} on blockchain...`);

      const tx = await this.contract!.confirmPayment(
        termId,
        ethers.parseUnits(amount.toString(), 0), // Store as-is (IDR)
        transactionRef,
        proofHash,
      );

      const receipt = await tx.wait();

      this.logger.log(`Payment confirmed on blockchain. TX: ${receipt.hash}`);

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      this.logger.error(`Failed to confirm payment: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // READ FUNCTIONS
  // ============================================

  /**
   * Get contract from blockchain
   */
  async getContract(contractId: string): Promise<ContractOnChain | null> {
    if (!this.isEnabled()) {
      return null;
    }

    try {
      const result = await this.contract!.getContract(contractId);
      return {
        documentHash: result[0],
        totalValue: result[1],
        termCount: result[2],
        registeredAt: result[3],
        registeredBy: result[4],
        exists: result[5],
      };
    } catch (error) {
      this.logger.error(`Failed to get contract: ${error.message}`);
      return null;
    }
  }

  /**
   * Get verifications from blockchain
   */
  async getVerifications(termId: string): Promise<VerificationOnChain[]> {
    if (!this.isEnabled()) {
      return [];
    }

    try {
      const result = await this.contract!.getVerifications(termId);
      return result.map((v: any) => ({
        visibleTermId: v.visibleTermId,
        termHash: v.termHash,
        verifier: v.verifier,
        role: v.role,
        approved: v.approved,
        notes: v.notes,
        verifiedAt: v.verifiedAt,
      }));
    } catch (error) {
      this.logger.error(`Failed to get verifications: ${error.message}`);
      return [];
    }
  }

  /**
   * Get payment from blockchain
   */
  async getPayment(termId: string): Promise<PaymentOnChain | null> {
    if (!this.isEnabled()) {
      return null;
    }

    try {
      const result = await this.contract!.getPayment(termId);
      if (result[3] === 0n) {
        return null; // No payment recorded
      }
      return {
        amount: result[0],
        transactionRef: result[1],
        proofHash: result[2],
        paidAt: result[3],
        confirmedBy: result[4],
      };
    } catch (error) {
      this.logger.error(`Failed to get payment: ${error.message}`);
      return null;
    }
  }

  /**
   * Verify document hash on blockchain
   */
  async verifyDocumentHash(contractId: string, documentData: string): Promise<boolean> {
    if (!this.isEnabled()) {
      return false;
    }

    try {
      const hash = this.generateHash(documentData);
      return await this.contract!.verifyDocumentHash(contractId, hash);
    } catch (error) {
      this.logger.error(`Failed to verify document hash: ${error.message}`);
      return false;
    }
  }

  /**
   * Get blockchain statistics
   */
  async getStats(): Promise<{
    contractsCount: number;
    verifiedTermsCount: number;
    paidTermsCount: number;
  } | null> {
    if (!this.isEnabled()) {
      return null;
    }

    try {
      const [contractsCount, verifiedTermsCount, paidTermsCount] = await Promise.all([
        this.contract!.getContractsCount(),
        this.contract!.getVerifiedTermsCount(),
        this.contract!.getPaidTermsCount(),
      ]);

      return {
        contractsCount: Number(contractsCount),
        verifiedTermsCount: Number(verifiedTermsCount),
        paidTermsCount: Number(paidTermsCount),
      };
    } catch (error) {
      this.logger.error(`Failed to get stats: ${error.message}`);
      return null;
    }
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(): Promise<string | null> {
    if (!this.isEnabled() || !this.wallet) {
      return null;
    }

    try {
      const balance = await this.provider!.getBalance(this.wallet.address);
      return ethers.formatEther(balance);
    } catch (error) {
      this.logger.error(`Failed to get balance: ${error.message}`);
      return null;
    }
  }
}
