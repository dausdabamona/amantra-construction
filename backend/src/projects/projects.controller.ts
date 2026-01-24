import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateContractDto } from './dto/create-contract.dto';

@ApiTags('projects')
@Controller('projects')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Buat proyek baru (Owner only)' })
  @ApiResponse({
    status: 201,
    description: 'Proyek berhasil dibuat',
  })
  @ApiResponse({
    status: 403,
    description: 'Hanya Owner yang bisa membuat proyek',
  })
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @Request() req: any,
  ) {
    return this.projectsService.create(createProjectDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Dapatkan semua proyek untuk user saat ini' })
  async findAll(@Request() req: any) {
    return this.projectsService.findAll(req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Dapatkan detail proyek' })
  @ApiResponse({
    status: 200,
    description: 'Detail proyek',
  })
  @ApiResponse({
    status: 404,
    description: 'Proyek tidak ditemukan',
  })
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.projectsService.findById(id, req.user);
  }

  @Post(':id/contract')
  @ApiOperation({ summary: 'Buat kontrak untuk proyek (Owner only)' })
  @ApiResponse({
    status: 201,
    description: 'Kontrak berhasil dibuat',
  })
  @ApiResponse({
    status: 403,
    description: 'Hanya Owner proyek yang bisa membuat kontrak',
  })
  async createContract(
    @Param('id') id: string,
    @Body() createContractDto: CreateContractDto,
    @Request() req: any,
  ) {
    return this.projectsService.createContract(id, createContractDto, req.user);
  }
}
