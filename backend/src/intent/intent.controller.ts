import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IntentService } from './intent.service';
import { DeclareIntentDto, DeclareIntentResponseDto, GetIntentStatusDto } from './dto/declare-intent.dto';

@ApiTags('Intent Declaration - State 0')
@Controller('intent')
export class IntentController {
  constructor(private readonly intentService: IntentService) {}

  /**
   * Declare user intent and legal capacity
   * This is the first step in the contract lifecycle (State 0: INTENT_DECLARED)
   */
  @Post('declare')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Declare Intent',
    description: 'User declares their intent, role, and confirms legal capacity before entering contract review',
  })
  @ApiResponse({
    status: 200,
    description: 'Intent declaration successful',
    type: DeclareIntentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Missing required confirmations or invalid role',
  })
  @ApiResponse({
    status: 403,
    description: 'KYC not verified or terms not accepted',
  })
  async declareIntent(
    @Request() req: any,
    @Body() dto: DeclareIntentDto,
  ): Promise<DeclareIntentResponseDto> {
    const userId = req.user.id;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    try {
      const result = await this.intentService.declareIntent(
        userId,
        dto,
        ipAddress,
        userAgent,
      );

      return {
        success: result.success,
        verificationStatus: result.verificationStatus,
        role: result.role,
        declarationTimestamp: result.declarationTimestamp,
        message: result.message,
      };
    } catch (error: any) {
      throw new BadRequestException(
        error.message || 'Gagal mendeklarasikan intent',
      );
    }
  }

  /**
   * Get current intent status for user
   */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get Intent Status',
    description: 'Retrieve current intent declaration status and verification details',
  })
  @ApiResponse({
    status: 200,
    description: 'Intent status retrieved successfully',
    type: GetIntentStatusDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User has not declared intent yet',
  })
  async getIntentStatus(@Request() req: any): Promise<any> {
    const userId = req.user.id;

    const status = await this.intentService.getIntentStatus(userId);

    if (!status) {
      return {
        status: 'NOT_DECLARED',
        message: 'Anda belum mendeklarasikan intent. Silakan lakukan sekarang untuk melanjutkan.',
        userId,
      };
    }

    return {
      ...status,
      message: 'Intent Anda telah dideklarasikan dan tersimpan dalam sistem.',
    };
  }

  /**
   * Check if user can proceed to contract review
   * This is a guard check for state transitions
   */
  @Get('can-proceed-to-review')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Check Review Eligibility',
    description: 'Check if user has met all requirements to proceed from INTENT_DECLARED to PRE_CONTRACT_REVIEW state',
  })
  @ApiResponse({
    status: 200,
    description: 'Eligibility check result',
    schema: {
      properties: {
        canProceed: { type: 'boolean' },
        reason: { type: 'string' },
        missingRequirements: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async canProceedToReview(@Request() req: any): Promise<any> {
    const userId = req.user.id;

    const status = await this.intentService.getIntentStatus(userId);

    if (!status) {
      return {
        canProceed: false,
        reason: 'Intent belum dideklarasikan',
        missingRequirements: ['Deklarasi intent diperlukan'],
      };
    }

    const missingRequirements = [];

    if (!status.kycVerified) {
      missingRequirements.push('KYC verification belum lengkap');
    }

    if (!status.acceptedTerms) {
      missingRequirements.push('Syarat dan ketentuan belum diterima');
    }

    if (!status.confirmedLegalCapacity) {
      missingRequirements.push('Kapasitas hukum belum dikonfirmasi');
    }

    return {
      canProceed: missingRequirements.length === 0,
      reason: missingRequirements.length === 0 
        ? 'Semua persyaratan terpenuhi. Anda dapat melanjutkan ke tahap review.'
        : 'Beberapa persyaratan belum terpenuhi.',
      missingRequirements,
      status: status.status,
      role: status.role,
    };
  }

  /**
   * Get user's intent declaration history
   */
  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get Declaration History',
    description: 'Retrieve all intent declarations made by the user (audit trail)',
  })
  @ApiResponse({
    status: 200,
    description: 'Declaration history retrieved',
    schema: {
      properties: {
        declarations: {
          type: 'array',
          items: {
            properties: {
              declarationTimestamp: { type: 'string', format: 'date-time' },
              role: { type: 'string' },
              hash: { type: 'string', description: 'SHA256 declaration hash' },
            },
          },
        },
      },
    },
  })
  async getUserHistory(@Request() req: any): Promise<any> {
    const userId = req.user.id;

    const history = await this.intentService.getUserIntentHistory(userId);

    return {
      userId,
      totalDeclarations: history.length,
      declarations: history,
      message: 'Riwayat deklarasi intent ditampilkan di atas.',
    };
  }
}
