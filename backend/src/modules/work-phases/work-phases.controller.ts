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
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { WorkPhasesService } from './work-phases.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { UserRole } from '@prisma/client';

@ApiTags('work-phases')
@Controller('work-phases')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class WorkPhasesController {
  constructor(private readonly workPhasesService: WorkPhasesService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Buat termin baru' })
  @ApiResponse({ status: 201, description: 'Termin berhasil dibuat' })
  async create(
    @Body()
    createDto: {
      contractId: string;
      phaseNumber: number;
      name: string;
      description?: string;
      deliverables: string;
      acceptanceCriteria?: string;
      phaseValue: number;
      paymentPercentage: number;
      plannedStartDate: string;
      plannedEndDate: string;
      minVerifications?: number;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.workPhasesService.create(createDto, user);
  }

  @Get('contract/:contractId')
  @ApiOperation({ summary: 'Daftar termin untuk kontrak' })
  @ApiResponse({ status: 200, description: 'Daftar termin' })
  async findByContract(@Param('contractId', ParseUUIDPipe) contractId: string) {
    return this.workPhasesService.findByContract(contractId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail termin' })
  @ApiResponse({ status: 200, description: 'Detail termin' })
  @ApiResponse({ status: 404, description: 'Termin tidak ditemukan' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.workPhasesService.findById(id);
  }

  @Patch(':id/start')
  @Roles(UserRole.CONTRACTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Mulai pengerjaan termin' })
  @ApiResponse({ status: 200, description: 'Termin dimulai' })
  async startPhase(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.workPhasesService.startPhase(id, user);
  }

  @Patch(':id/progress')
  @Roles(UserRole.CONTRACTOR, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Update progress termin' })
  @ApiBody({ schema: { properties: { completionPercentage: { type: 'number' } } } })
  @ApiResponse({ status: 200, description: 'Progress diupdate' })
  async updateProgress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('completionPercentage') completionPercentage: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.workPhasesService.updateProgress(id, completionPercentage, user);
  }

  @Patch(':id/submit-verification')
  @Roles(UserRole.CONTRACTOR)
  @ApiOperation({ summary: 'Ajukan termin untuk verifikasi' })
  @ApiResponse({ status: 200, description: 'Termin diajukan untuk verifikasi' })
  async submitForVerification(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.workPhasesService.submitForVerification(id, user);
  }

  @Patch(':id/approve')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Setujui termin yang sudah terverifikasi' })
  @ApiResponse({ status: 200, description: 'Termin disetujui' })
  async approvePhase(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.workPhasesService.approvePhase(id, user);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Hapus termin (soft delete)' })
  @ApiResponse({ status: 200, description: 'Termin berhasil dihapus' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.workPhasesService.softDelete(id, user);
  }
}
