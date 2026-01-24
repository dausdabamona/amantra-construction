import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ArchiveService } from './archive.service';
import { ArchiveResponseDto, ArchiveSnapshotDto, CloseContractDto } from './dto/archive.dto';

@ApiTags('contract-archive')
@ApiBearerAuth()
@Controller('contract/:id')
@UseGuards(JwtAuthGuard)
export class ArchiveController {
  constructor(private readonly archiveService: ArchiveService) {}

  @Post('close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Menutup kontrak dan mengarsipkan secara permanen' })
  @ApiParam({ name: 'id', description: 'ID kontrak' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Kontrak berhasil diarsipkan' })
  async closeContract(
    @Param('id') contractId: string,
    @Body() body: CloseContractDto,
    @CurrentUser() user: any,
  ): Promise<ArchiveResponseDto<ArchiveSnapshotDto>> {
    return this.archiveService.close(contractId, user.id, body);
  }

  @Get('archive')
  @ApiOperation({ summary: 'Ambil snapshot arsip kontrak (read-only)' })
  @ApiParam({ name: 'id', description: 'ID kontrak' })
  async getArchive(
    @Param('id') contractId: string,
  ): Promise<ArchiveResponseDto<ArchiveSnapshotDto>> {
    return this.archiveService.getArchive(contractId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Ambil riwayat transisi dan jejak audit akhir' })
  @ApiParam({ name: 'id', description: 'ID kontrak' })
  async getHistory(
    @Param('id') contractId: string,
  ): Promise<ArchiveResponseDto<{ transitionLog: any[]; auditTrail: any[] }>> {
    return this.archiveService.getHistory(contractId);
  }
}
