import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BlockchainService } from './blockchain.service';

@ApiTags('blockchain')
@Controller('blockchain')
export class BlockchainController {
  constructor(private blockchainService: BlockchainService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get blockchain integration status' })
  async getStatus() {
    const enabled = this.blockchainService.isEnabled();
    const balance = await this.blockchainService.getWalletBalance();
    const stats = await this.blockchainService.getStats();

    return {
      enabled,
      balance,
      stats,
    };
  }

  @Get('contract/:contractId')
  @ApiOperation({ summary: 'Get contract from blockchain (public verification)' })
  async getContract(@Param('contractId') contractId: string) {
    const contract = await this.blockchainService.getContract(contractId);

    if (!contract || !contract.exists) {
      return {
        found: false,
        message: 'Contract not found on blockchain',
      };
    }

    return {
      found: true,
      data: {
        documentHash: contract.documentHash,
        totalValue: contract.totalValue.toString(),
        termCount: Number(contract.termCount),
        registeredAt: new Date(Number(contract.registeredAt) * 1000).toISOString(),
        registeredBy: contract.registeredBy,
      },
    };
  }

  @Get('contract/:contractId/verify')
  @ApiOperation({ summary: 'Verify contract document hash' })
  async verifyContract(
    @Param('contractId') contractId: string,
    @Query('documentData') documentData: string,
  ) {
    if (!documentData) {
      return {
        valid: false,
        message: 'Document data is required for verification',
      };
    }

    const isValid = await this.blockchainService.verifyDocumentHash(
      contractId,
      documentData,
    );

    return {
      valid: isValid,
      message: isValid
        ? 'Document hash matches blockchain record'
        : 'Document hash does not match or contract not found',
    };
  }

  @Get('term/:termId/verifications')
  @ApiOperation({ summary: 'Get verifications from blockchain (public verification)' })
  async getVerifications(@Param('termId') termId: string) {
    const verifications = await this.blockchainService.getVerifications(termId);

    if (verifications.length === 0) {
      return {
        found: false,
        message: 'No verifications found on blockchain',
        data: [],
      };
    }

    return {
      found: true,
      count: verifications.length,
      data: verifications.map((v) => ({
        termId: v.visibleTermId,
        termHash: v.termHash,
        verifier: v.verifier,
        role: v.role,
        approved: v.approved,
        notes: v.notes,
        verifiedAt: new Date(Number(v.verifiedAt) * 1000).toISOString(),
      })),
    };
  }

  @Get('term/:termId/payment')
  @ApiOperation({ summary: 'Get payment from blockchain (public verification)' })
  async getPayment(@Param('termId') termId: string) {
    const payment = await this.blockchainService.getPayment(termId);

    if (!payment) {
      return {
        found: false,
        message: 'Payment not found on blockchain',
      };
    }

    return {
      found: true,
      data: {
        amount: payment.amount.toString(),
        transactionRef: payment.transactionRef,
        proofHash: payment.proofHash,
        paidAt: new Date(Number(payment.paidAt) * 1000).toISOString(),
        confirmedBy: payment.confirmedBy,
      },
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get blockchain statistics' })
  async getStats() {
    const stats = await this.blockchainService.getStats();

    if (!stats) {
      return {
        enabled: false,
        message: 'Blockchain integration is not enabled',
      };
    }

    return {
      enabled: true,
      data: stats,
    };
  }
}
