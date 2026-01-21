import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ProgressReportsService } from './progress-reports.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { UserRole, ReportStatus } from '@prisma/client';

@ApiTags('progress-reports')
@Controller('progress-reports')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class ProgressReportsController {
  constructor(private readonly progressReportsService: ProgressReportsService) {}

  @Post()
  @Roles(UserRole.CONTRACTOR)
  @ApiOperation({ summary: 'Buat laporan progres baru' })
  @ApiResponse({ status: 201, description: 'Laporan berhasil dibuat' })
  async create(
    @Body()
    createDto: {
      workPhaseId: string;
      title: string;
      description: string;
      workCompleted: string;
      progressPercentage: number;
      issuesEncountered?: string;
      nextSteps?: string;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.progressReportsService.create(createDto, user);
  }

  @Get('work-phase/:workPhaseId')
  @ApiOperation({ summary: 'Daftar laporan progres untuk termin' })
  @ApiResponse({ status: 200, description: 'Daftar laporan progres' })
  async findByWorkPhase(
    @Param('workPhaseId', ParseUUIDPipe) workPhaseId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.progressReportsService.findByWorkPhase(workPhaseId, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail laporan progres' })
  @ApiResponse({ status: 200, description: 'Detail laporan' })
  @ApiResponse({ status: 404, description: 'Laporan tidak ditemukan' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.progressReportsService.findById(id);
  }

  @Patch(':id/submit')
  @Roles(UserRole.CONTRACTOR)
  @ApiOperation({ summary: 'Submit laporan untuk review' })
  @ApiResponse({ status: 200, description: 'Laporan disubmit' })
  async submit(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.progressReportsService.submit(id, user);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPERVISOR, UserRole.WITNESS, UserRole.ADMIN)
  @ApiOperation({ summary: 'Ubah status laporan' })
  @ApiQuery({ name: 'status', enum: ReportStatus })
  @ApiResponse({ status: 200, description: 'Status laporan berhasil diubah' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('status') status: ReportStatus,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.progressReportsService.updateStatus(id, status, user);
  }

  @Delete(':id')
  @Roles(UserRole.CONTRACTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Hapus laporan progres (soft delete)' })
  @ApiResponse({ status: 200, description: 'Laporan berhasil dihapus' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.progressReportsService.softDelete(id, user);
  }
}
