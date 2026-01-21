import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@Controller('projects')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project (Owner only)' })
  async create(
    @Body()
    body: {
      name: string;
      description?: string;
      location?: string;
      contractorId?: string;
      supervisorId?: string;
      witnessId?: string;
    },
    @Request() req: any,
  ) {
    return this.projectsService.create(body, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects for current user' })
  async findAll(@Request() req: any) {
    return this.projectsService.findAll(req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project detail' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.projectsService.findById(id, req.user);
  }

  @Post(':id/contract')
  @ApiOperation({ summary: 'Create contract for project (Owner only)' })
  async createContract(
    @Param('id') id: string,
    @Body() body: { totalValue: number; termCount: number },
    @Request() req: any,
  ) {
    return this.projectsService.createContract(id, body, req.user);
  }
}
