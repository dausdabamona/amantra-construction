import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { VerificationsService } from './verifications.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { UserRole, VerificationType } from '@prisma/client';

@ApiTags('verifications')
@Controller('verifications')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class VerificationsController {
  constructor(private readonly verificationsService: VerificationsService) {}

  @Post()
  @Roles(UserRole.SUPERVISOR, UserRole.WITNESS, UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Buat verifikasi baru' })
  @ApiResponse({ status: 201, description: 'Verifikasi berhasil dibuat' })
  async create(
    @Body()
    createDto: {
      workPhaseId?: string;
      progressReportId?: string;
      type: VerificationType;
      comments?: string;
      findings?: string;
      recommendations?: string;
      checklistItems?: string;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.verificationsService.create(createDto, user);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Daftar verifikasi pending untuk pengguna saat ini' })
  @ApiResponse({ status: 200, description: 'Daftar verifikasi pending' })
  async findPending(@CurrentUser() user: JwtPayload) {
    return this.verificationsService.findPendingForUser(user.sub);
  }

  @Get('work-phase/:workPhaseId')
  @ApiOperation({ summary: 'Daftar verifikasi untuk termin' })
  @ApiResponse({ status: 200, description: 'Daftar verifikasi termin' })
  async findByWorkPhase(@Param('workPhaseId', ParseUUIDPipe) workPhaseId: string) {
    return this.verificationsService.findByWorkPhase(workPhaseId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail verifikasi' })
  @ApiResponse({ status: 200, description: 'Detail verifikasi' })
  @ApiResponse({ status: 404, description: 'Verifikasi tidak ditemukan' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.verificationsService.findById(id);
  }

  @Patch(':id/approve')
  @Roles(UserRole.SUPERVISOR, UserRole.WITNESS, UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Setujui verifikasi' })
  @ApiBody({ schema: { properties: { signatureHash: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Verifikasi disetujui' })
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('signatureHash') signatureHash: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.verificationsService.approve(id, signatureHash, user);
  }

  @Patch(':id/reject')
  @Roles(UserRole.SUPERVISOR, UserRole.WITNESS, UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Tolak verifikasi' })
  @ApiBody({ schema: { properties: { reason: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Verifikasi ditolak' })
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.verificationsService.reject(id, reason, user);
  }

  @Patch(':id/request-revision')
  @Roles(UserRole.SUPERVISOR, UserRole.WITNESS, UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Minta revisi' })
  @ApiBody({ schema: { properties: { feedback: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Permintaan revisi dikirim' })
  async requestRevision(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('feedback') feedback: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.verificationsService.requestRevision(id, feedback, user);
  }
}
