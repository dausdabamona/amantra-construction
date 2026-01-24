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
import { OperationService } from './operation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  StartOperationDto,
  SubmitReportDto,
  VerifyReportDto,
  ReportStatus,
  OperationStateResponseDto,
  ProgressResponseDto,
  SubmitReportResponseDto,
  VerifyReportResponseDto,
} from './dto/operation.dto';

@ApiTags('Contract Operation')
@Controller('contract/:id/operation')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class OperationController {
  constructor(private operationService: OperationService) {}

  /**
   * Start contract operation - transition to OPERATION_RUNNING state
   * POST /contract/:id/operation/start
   */
  @Post('start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mulai operasi konstruksi',
    description:
      'Memulai fase operasi konstruksi. Kontrak harus dalam status CONTRACT_ACTIVE_LOCKED. Tindakan ini tidak dapat dibalikkan dan menandakan komitmen untuk melaksanakan pekerjaan sesuai jadwal.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID Kontrak',
    example: 'contract-12345',
  })
  @ApiBody({
    type: StartOperationDto,
    description: 'Data untuk memulai operasi',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Operasi berhasil dimulai',
    type: ProgressResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Operasi ditolak - kontrak tidak dalam status yang tepat',
  })
  async startOperation(
    @Param('id') contractId: string,
    @Body() dto: StartOperationDto,
    @CurrentUser() user: any,
  ): Promise<ProgressResponseDto> {
    dto.contractId = contractId;
    const progress = await this.operationService.startOperation(user.id, dto);

    return {
      success: true,
      message: 'Operasi konstruksi berhasil dimulai. Tim akan mulai bekerja sesuai jadwal.',
      data: progress,
      error: null,
      timestamp: new Date(),
    };
  }

  /**
   * Get current operation state and progress
   * GET /contract/:id/operation
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Dapatkan status operasi saat ini',
    description:
      'Mengambil informasi lengkap tentang status operasi, milestone aktif, laporan yang sudah disubmit, dan timeline aktivitas.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID Kontrak',
    example: 'contract-12345',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status operasi diperoleh',
    type: ProgressResponseDto,
  })
  async getProgress(
    @Param('id') contractId: string,
    @CurrentUser() user: any,
  ): Promise<ProgressResponseDto> {
    const progress = await this.operationService.getProgress(contractId, user.id);

    return {
      success: true,
      message: 'Status operasi diperoleh',
      data: progress,
      error: null,
      timestamp: new Date(),
    };
  }

  /**
   * Submit progress report for a milestone
   * POST /contract/:id/operation/report
   */
  @Post('report')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Kirim laporan kemajuan',
    description:
      'Menyerahkan laporan kemajuan untuk milestone tertentu. Laporan harus disertai dengan bukti foto dan deskripsi detail tentang kemajuan pekerjaan.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID Kontrak',
    example: 'contract-12345',
  })
  @ApiBody({
    type: SubmitReportDto,
    description: 'Data laporan kemajuan',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Laporan berhasil disubmit',
    type: SubmitReportResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Laporan ditolak - operasi tidak sedang berjalan',
  })
  async submitReport(
    @Param('id') contractId: string,
    @Body() dto: SubmitReportDto,
    @CurrentUser() user: any,
  ): Promise<SubmitReportResponseDto> {
    dto.contractId = contractId;
    const report = await this.operationService.submitReport(user.id, dto);

    return {
      success: true,
      message: 'Laporan kemajuan berhasil dikirim dan menunggu verifikasi dari ProjectOwner',
      data: report,
      error: null,
      timestamp: new Date(),
    };
  }

  /**
   * Verify submitted progress report
   * POST /contract/:id/operation/verify
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verifikasi laporan kemajuan',
    description:
      'Memverifikasi laporan kemajuan yang telah disubmit oleh kontraktor. Verifikasi dapat disetujui, ditolak, atau diminta untuk direvisi.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID Kontrak',
    example: 'contract-12345',
  })
  @ApiBody({
    type: VerifyReportDto,
    description: 'Data verifikasi',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verifikasi berhasil diproses',
    type: VerifyReportResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Verifikasi ditolak - operasi tidak sedang berjalan',
  })
  async verifyReport(
    @Param('id') contractId: string,
    @Body() dto: VerifyReportDto,
    @CurrentUser() user: any,
  ): Promise<VerifyReportResponseDto> {
    dto.contractId = contractId;
    const report = await this.operationService.verifyReport(user.id, dto);

    const messageMap: Record<ReportStatus, string> = {
      [ReportStatus.VERIFIED]: 'Laporan disetujui. Milestone dianggap selesai dan pembayaran dapat diproses.',
      [ReportStatus.REJECTED]: 'Laporan ditolak. Kontraktor diminta untuk memperbaiki pekerjaan dan mengajukan ulang.',
      [ReportStatus.SUBMITTED]: 'Laporan telah disubmit dan menunggu verifikasi.',
      [ReportStatus.PENDING]: 'Verifikasi menunggu review lebih lanjut.',
    };

    return {
      success: true,
      message: messageMap[report.status] || 'Verifikasi berhasil diproses',
      data: report,
      error: null,
      timestamp: new Date(),
    };
  }

  /**
   * Get operation state only (lightweight endpoint)
   * GET /contract/:id/operation/state
   */
  @Get('state')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Dapatkan status operasi (ringan)',
    description: 'Endpoint ringan untuk mendapatkan hanya status operasi saat ini tanpa laporan dan timeline.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID Kontrak',
    example: 'contract-12345',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status operasi diperoleh',
    type: OperationStateResponseDto,
  })
  async getOperationState(
    @Param('id') contractId: string,
    @CurrentUser() user: any,
  ): Promise<OperationStateResponseDto> {
    const progress = await this.operationService.getProgress(contractId, user.id);

    return {
      success: true,
      message: 'Status operasi diperoleh',
      data: progress.operationState,
      error: null,
      timestamp: new Date(),
    };
  }
}
