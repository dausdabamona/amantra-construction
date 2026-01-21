import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Delete,
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
import { UsersService } from './users.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('users')
@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Daftar semua pengguna (Admin only)' })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiResponse({ status: 200, description: 'Daftar pengguna' })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('role') role?: UserRole,
  ) {
    return this.usersService.findAll(pagination, { role });
  }

  @Get('supervisors')
  @ApiOperation({ summary: 'Daftar pengawas aktif' })
  @ApiResponse({ status: 200, description: 'Daftar pengawas' })
  async getSupervisors() {
    return this.usersService.getSupervisors();
  }

  @Get('witnesses')
  @ApiOperation({ summary: 'Daftar saksi ahli aktif' })
  @ApiResponse({ status: 200, description: 'Daftar saksi ahli' })
  async getWitnesses() {
    return this.usersService.getWitnesses();
  }

  @Get('contractors')
  @ApiOperation({ summary: 'Daftar kontraktor aktif' })
  @ApiResponse({ status: 200, description: 'Daftar kontraktor' })
  async getContractors() {
    return this.usersService.getContractors();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail pengguna' })
  @ApiResponse({ status: 200, description: 'Detail pengguna' })
  @ApiResponse({ status: 404, description: 'Pengguna tidak ditemukan' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Hapus pengguna (soft delete) - Admin only' })
  @ApiResponse({ status: 200, description: 'Pengguna berhasil dihapus' })
  @ApiResponse({ status: 404, description: 'Pengguna tidak ditemukan' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.usersService.softDelete(id);
    return { message: 'Pengguna berhasil dihapus' };
  }
}
