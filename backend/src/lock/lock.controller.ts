import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { LockService } from './lock.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  LockFundsDto,
  ContractStateDto,
  LockFundsResponseDto,
  ContractStateResponseDto,
} from './dto/lock.dto';

@ApiTags('Contract Lock')
@Controller('contract/:id/lock')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class LockController {
  constructor(private lockService: LockService) {}

  /**
   * Lock contract funds - transition to CONTRACT_ACTIVE_LOCKED state
   * POST /contract/:id/lock
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Kunci dana kontrak',
    description:
      'Mengunci dana kontrak dalam escrow. Setelah dikunci, dana tidak dapat ditarik kembali sampai kontrak berlanjut ke fase berikutnya. Tindakan ini tidak dapat dibalikkan.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID Kontrak',
    example: 'contract-12345',
  })
  @ApiBody({
    type: LockFundsDto,
    description: 'Data penguncian dana',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dana berhasil dikunci',
    type: LockFundsResponseDto,
    example: {
      success: true,
      message: 'Dana berhasil dikunci dalam escrow. Kontrak sekarang aktif dan binding.',
      data: {
        state: 'CONTRACT_ACTIVE_LOCKED',
        lockedAmount: 10000000000,
        lockTimestamp: '2026-01-25T10:30:00Z',
        lockingTxHash: '0x...',
        isFundsLocked: true,
      },
      error: null,
      timestamp: '2026-01-25T10:30:00Z',
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Penguncian ditolak - kontrak tidak dalam status yang tepat atau kondisi tidak terpenuhi',
    example: {
      success: false,
      message: 'Kontrak harus dalam status PRE_CONTRACT_REVIEW untuk dikunci',
      error: 'ForbiddenException',
      timestamp: '2026-01-25T10:30:00Z',
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Data penguncian tidak valid',
  })
  async lockFunds(
    @Param('id') contractId: string,
    @Body() dto: LockFundsDto,
    @CurrentUser() user: any,
  ): Promise<LockFundsResponseDto> {
    // Inject contract ID from URL
    dto.contractId = contractId;

    return this.lockService.lockFunds(user.id, dto);
  }

  /**
   * Get current contract state - comprehensive state information
   * GET /contract/:id/state
   */
  @Get('state')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Dapatkan status kontrak saat ini',
    description:
      'Mengambil informasi lengkap tentang status kontrak, dana yang dikunci, dan kondisi berikutnya yang diperlukan.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID Kontrak',
    example: 'contract-12345',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status kontrak diperoleh',
    type: ContractStateResponseDto,
    example: {
      success: true,
      message: 'Status kontrak diperoleh',
      data: {
        state: 'CONTRACT_ACTIVE_LOCKED',
        lockedAmount: 10000000000,
        lockTimestamp: '2026-01-25T10:30:00Z',
        lockingTxHash: '0x...',
        currentMilestone: 1,
        substatus: 'AWAITING_OPERATION_START',
        isFundsLocked: true,
        operationStartDate: '2026-02-01',
        nextResponsibleParty: 'Contractor',
        rightsObligations: {
          contractor: [
            'Hak: Akses ke lokasi konstruksi selama masa kontrak',
            'Hak: Memperoleh pembayaran sesuai milestone yang diselesaikan',
            'Hak: Menerima material berkualitas dari pemilik proyek',
            'Kewajiban: Menyediakan pekerja terampil dan berpengalaman',
            'Kewajiban: Mematuhi standar keselamatan kerja',
            'Kewajiban: Menyelesaikan pekerjaan sesuai jadwal dan spesifikasi',
          ],
          projectOwner: [
            'Hak: Memantau kemajuan pekerjaan secara berkala',
            'Hak: Melakukan inspeksi kualitas pekerjaan',
            'Hak: Menolak pekerjaan yang tidak memenuhi standar',
            'Kewajiban: Memberikan akses ke lokasi konstruksi',
            'Kewajiban: Menyediakan material yang dijanjikan',
            'Kewajiban: Melakukan pembayaran tepat waktu sesuai milestone',
          ],
        },
      },
      error: null,
      timestamp: '2026-01-25T10:30:00Z',
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Akses ditolak',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Kontrak tidak ditemukan',
  })
  async getContractState(
    @Param('id') contractId: string,
    @CurrentUser() user: any,
  ): Promise<ContractStateResponseDto> {
    const data = await this.lockService.getContractState(contractId, user.id);

    return {
      success: true,
      message: 'Status kontrak diperoleh',
      data,
      error: null,
      timestamp: new Date(),
    };
  }

  /**
   * Get locked status card (for UI display)
   * GET /contract/:id/locked-status
   */
  @Get('locked-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Dapatkan informasi kartu status penguncian',
    description: 'Mengambil informasi tentang dana yang dikunci, termasuk hash transaksi dan link penjelajah.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID Kontrak',
    example: 'contract-12345',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Informasi status penguncian diperoleh',
  })
  async getLockedStatus(@Param('id') contractId: string, @CurrentUser() user: any) {
    const data = await this.lockService.getLockedStatusCard(contractId, user.id);
    return {
      success: true,
      message: 'Informasi status penguncian diperoleh',
      data,
      error: null,
      timestamp: new Date(),
    };
  }

  /**
   * Get rights and obligations
   * GET /contract/:id/rights-obligations
   */
  @Get('rights-obligations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Dapatkan hak dan kewajiban kontrak',
    description: 'Mengambil daftar lengkap hak dan kewajiban untuk kontraktor dan pemilik proyek.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID Kontrak',
    example: 'contract-12345',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Hak dan kewajiban diperoleh',
  })
  async getRightsObligations(@Param('id') contractId: string, @CurrentUser() user: any) {
    const data = await this.lockService.getRightsObligations(contractId, user.id);
    return {
      success: true,
      message: 'Hak dan kewajiban diperoleh',
      data,
      error: null,
      timestamp: new Date(),
    };
  }

  /**
   * Get next condition/action required
   * GET /contract/:id/next-condition
   */
  @Get('next-condition')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Dapatkan kondisi/aksi berikutnya',
    description:
      'Mengambil informasi tentang aksi berikutnya yang diperlukan, siapa yang bertanggung jawab, dan batas waktu.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID Kontrak',
    example: 'contract-12345',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Kondisi berikutnya diperoleh',
  })
  async getNextCondition(@Param('id') contractId: string, @CurrentUser() user: any) {
    const data = await this.lockService.getNextCondition(contractId, user.id);
    return {
      success: true,
      message: 'Kondisi berikutnya diperoleh',
      data,
      error: null,
      timestamp: new Date(),
    };
  }
}
