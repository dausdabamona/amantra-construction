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
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { UserRole, ContractStatus } from '@prisma/client';

@ApiTags('contracts')
@Controller('contracts')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Buat kontrak baru' })
  @ApiResponse({ status: 201, description: 'Kontrak berhasil dibuat' })
  async create(
    @Body() createContractDto: CreateContractDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contractsService.create(createContractDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Daftar kontrak' })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiResponse({ status: 200, description: 'Daftar kontrak' })
  async findAll(
    @Query() pagination: PaginationDto,
    @CurrentUser() user: JwtPayload,
    @Query('projectId') projectId?: string,
  ) {
    return this.contractsService.findAll(pagination, user, projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail kontrak' })
  @ApiResponse({ status: 200, description: 'Detail kontrak' })
  @ApiResponse({ status: 404, description: 'Kontrak tidak ditemukan' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.contractsService.findById(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Ubah status kontrak' })
  @ApiQuery({ name: 'status', enum: ContractStatus })
  @ApiResponse({ status: 200, description: 'Status kontrak berhasil diubah' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('status') status: ContractStatus,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contractsService.updateStatus(id, status, user);
  }

  @Post(':id/sign')
  @Roles(UserRole.OWNER, UserRole.CONTRACTOR)
  @ApiOperation({ summary: 'Tandatangani kontrak' })
  @ApiQuery({
    name: 'type',
    enum: ['owner', 'contractor'],
    description: 'Tipe tanda tangan',
  })
  @ApiResponse({ status: 200, description: 'Kontrak berhasil ditandatangani' })
  async signContract(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('type') signatureType: 'owner' | 'contractor',
    @Body('signatureHash') signatureHash: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contractsService.signContract(id, signatureHash, signatureType, user);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Hapus kontrak (soft delete)' })
  @ApiResponse({ status: 200, description: 'Kontrak berhasil dihapus' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contractsService.softDelete(id, user);
  }
}
