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
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { UserRole, ProjectStatus } from '@prisma/client';

@ApiTags('projects')
@Controller('projects')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Buat proyek baru' })
  @ApiResponse({ status: 201, description: 'Proyek berhasil dibuat' })
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.create(createProjectDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Daftar proyek' })
  @ApiResponse({ status: 200, description: 'Daftar proyek berdasarkan role pengguna' })
  async findAll(
    @Query() pagination: PaginationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.findAll(pagination, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail proyek' })
  @ApiResponse({ status: 200, description: 'Detail proyek' })
  @ApiResponse({ status: 404, description: 'Proyek tidak ditemukan' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.findById(id, user);
  }

  @Patch(':id/status')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Ubah status proyek' })
  @ApiQuery({ name: 'status', enum: ProjectStatus })
  @ApiResponse({ status: 200, description: 'Status proyek berhasil diubah' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('status') status: ProjectStatus,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.updateStatus(id, status, user);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Hapus proyek (soft delete)' })
  @ApiResponse({ status: 200, description: 'Proyek berhasil dihapus' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.softDelete(id, user);
  }
}
