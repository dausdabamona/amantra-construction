import { Controller, Get, Post, Body, Param, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ContractReviewService } from './contract-review.service';
import {
  ContractSummaryDto,
  ProcessTimelineDto,
  RiskItemDto,
  SimulationScenarioDto,
  LegalTextSectionDto,
  AcknowledgementChecklistDto,
  AcknowledgeContractDto,
  ContractReviewStatusDto,
  ApprovePreContractDto,
  ContractReviewResponseDto,
} from './dto/contract-review.dto';

@ApiTags('Contract Review - State 1: PRE_CONTRACT_REVIEW')
@ApiBearerAuth()
@Controller('api/contract-review')
@UseGuards(JwtAuthGuard)
export class ContractReviewController {
  constructor(private readonly contractReviewService: ContractReviewService) {}

  @Get(':id/summary')
  @ApiOperation({
    summary: 'Get contract summary',
    description: 'Retrieve basic contract information including terms, duration, and key responsibilities',
  })
  @ApiResponse({ status: 200, description: 'Contract summary retrieved', type: ContractSummaryDto })
  @ApiResponse({ status: 403, description: 'Intent not declared - must complete State 0 first' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async getContractSummary(
    @Param('id') contractId: string,
    @Req() req: any,
  ): Promise<ContractReviewResponseDto> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestException('User ID tidak ditemukan dalam token');
      }

      const summary = await this.contractReviewService.getContractSummary(contractId, userId);

      return {
        success: true,
        message: 'Ringkasan kontrak berhasil diambil',
        data: summary,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Gagal mengambil ringkasan kontrak',
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  @Get(':id/timeline')
  @ApiOperation({
    summary: 'Get process timeline',
    description: 'Retrieve step-by-step project execution timeline with potential delays and risk levels',
  })
  @ApiResponse({ status: 200, description: 'Timeline retrieved', type: [ProcessTimelineDto] })
  async getProcessTimeline(
    @Param('id') contractId: string,
    @Req() req: any,
  ): Promise<ContractReviewResponseDto> {
    try {
      const userId = req.user?.id;
      const timeline = await this.contractReviewService.getProcessTimeline(contractId, userId);

      return {
        success: true,
        message: 'Garis waktu proyek berhasil diambil',
        data: timeline,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Gagal mengambil garis waktu',
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  @Get(':id/risks')
  @ApiOperation({
    summary: 'Get risk analysis',
    description: 'Retrieve identified risks, their severity, probability, and mitigation strategies',
  })
  @ApiResponse({ status: 200, description: 'Risks retrieved', type: [RiskItemDto] })
  async getRisksAndConsequences(
    @Param('id') contractId: string,
    @Req() req: any,
  ): Promise<ContractReviewResponseDto> {
    try {
      const userId = req.user?.id;
      const risks = await this.contractReviewService.getRisksAndConsequences(contractId, userId);

      return {
        success: true,
        message: 'Analisis risiko berhasil diambil',
        data: risks,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Gagal mengambil analisis risiko',
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  @Get(':id/simulation')
  @ApiOperation({
    summary: 'Get simulation scenarios',
    description: 'Retrieve "what-if" scenarios including best case, realistic case, worst case, and crisis case',
  })
  @ApiResponse({ status: 200, description: 'Scenarios retrieved', type: [SimulationScenarioDto] })
  async getSimulationScenarios(
    @Param('id') contractId: string,
    @Req() req: any,
  ): Promise<ContractReviewResponseDto> {
    try {
      const userId = req.user?.id;
      const scenarios = await this.contractReviewService.getSimulationScenarios(contractId, userId);

      return {
        success: true,
        message: 'Skenario simulasi berhasil diambil',
        data: scenarios,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Gagal mengambil skenario simulasi',
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  @Get(':id/legal-text')
  @ApiOperation({
    summary: 'Get legal contract text',
    description: 'Retrieve full legal contract sections with obligations, liability, and termination conditions',
  })
  @ApiResponse({ status: 200, description: 'Legal text retrieved', type: [LegalTextSectionDto] })
  async getLegalContractText(
    @Param('id') contractId: string,
    @Req() req: any,
  ): Promise<ContractReviewResponseDto> {
    try {
      const userId = req.user?.id;
      const legalText = await this.contractReviewService.getLegalContractText(contractId, userId);

      return {
        success: true,
        message: 'Teks legal kontrak berhasil diambil',
        data: legalText,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Gagal mengambil teks legal',
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  @Get(':id/checklist')
  @ApiOperation({
    summary: 'Get acknowledgement checklist',
    description: 'Retrieve items that must be acknowledged before proceeding',
  })
  @ApiResponse({ status: 200, description: 'Checklist retrieved', type: [AcknowledgementChecklistDto] })
  async getAcknowledgementChecklist(
    @Param('id') contractId: string,
    @Req() req: any,
  ): Promise<ContractReviewResponseDto> {
    try {
      const userId = req.user?.id;
      const checklist = await this.contractReviewService.getAcknowledgementChecklist(contractId, userId);

      return {
        success: true,
        message: 'Daftar pengakuan berhasil diambil',
        data: checklist,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Gagal mengambil daftar pengakuan',
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  @Get(':id/status')
  @ApiOperation({
    summary: 'Get review status',
    description: 'Get current review status with acknowledgement flags and cooldown information',
  })
  @ApiResponse({ status: 200, description: 'Status retrieved', type: ContractReviewStatusDto })
  async getReviewStatus(
    @Param('id') contractId: string,
    @Req() req: any,
  ): Promise<ContractReviewResponseDto> {
    try {
      const userId = req.user?.id;
      const status = await this.contractReviewService.getContractReviewStatus(contractId, userId);

      return {
        success: true,
        message: 'Status review berhasil diambil',
        data: status,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Gagal mengambil status review',
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  @Post(':id/acknowledge')
  @ApiOperation({
    summary: 'Record contract acknowledgements',
    description: 'Record user acknowledgement of all contract review items and start cooldown period',
  })
  @ApiResponse({ status: 200, description: 'Acknowledgements recorded', type: ContractReviewStatusDto })
  @ApiResponse({ status: 400, description: 'Not all required items acknowledged' })
  @ApiResponse({ status: 403, description: 'Intent not declared' })
  async acknowledgeContract(
    @Param('id') contractId: string,
    @Body() dto: AcknowledgeContractDto,
    @Req() req: any,
  ): Promise<ContractReviewResponseDto> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestException('User ID tidak ditemukan dalam token');
      }

      // Ensure contract ID matches
      dto.contractId = contractId;

      const status = await this.contractReviewService.acknowledgeContract(userId, dto);

      return {
        success: true,
        message: 'Semua item pengakuan berhasil disimpan. Periode pendinginan 48 jam telah dimulai.',
        data: status,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Gagal menyimpan pengakuan',
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  @Post(':id/approve-and-lock')
  @ApiOperation({
    summary: 'Approve pre-contract and lock funds',
    description: 'Transition from PRE_CONTRACT_REVIEW to CONTRACT_ACTIVE_LOCKED state. Only allowed if all acknowledgements are recorded and cooldown period has expired.',
  })
  @ApiResponse({ status: 200, description: 'Funds locked successfully', type: ContractReviewStatusDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 403, description: 'Requirements not met' })
  async approvePreContractAndLock(
    @Param('id') contractId: string,
    @Body() dto: ApprovePreContractDto,
    @Req() req: any,
  ): Promise<ContractReviewResponseDto> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestException('User ID tidak ditemukan dalam token');
      }

      // Ensure contract ID matches
      dto.contractId = contractId;

      const status = await this.contractReviewService.approvePreContractAndLock(userId, dto);

      return {
        success: true,
        message: 'Kontrak berhasil disetujui. Dana telah dikunci dan kontrak sekarang aktif.',
        data: status,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Gagal menyetujui dan mengunci kontrak',
        error: error.message,
        timestamp: new Date(),
      };
    }
  }
}
