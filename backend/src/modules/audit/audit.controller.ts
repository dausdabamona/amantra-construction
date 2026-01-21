import {
  Controller,
  Get,
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
import { AuditService } from './audit.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, AuditAction } from '@prisma/client';

@ApiTags('audit')
@Controller('audit')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Daftar audit log (Admin/Auditor only)' })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'entityId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'contractId', required: false })
  @ApiQuery({ name: 'action', required: false, enum: AuditAction })
  @ApiResponse({ status: 200, description: 'Daftar audit log' })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('userId') userId?: string,
    @Query('projectId') projectId?: string,
    @Query('contractId') contractId?: string,
    @Query('action') action?: AuditAction,
  ) {
    return this.auditService.findAll(pagination, {
      entityType,
      entityId,
      userId,
      projectId,
      contractId,
      action,
    });
  }

  @Get('entity/:entityType/:entityId')
  @Roles(UserRole.ADMIN, UserRole.AUDITOR, UserRole.OWNER)
  @ApiOperation({ summary: 'Audit trail untuk entity tertentu' })
  @ApiResponse({ status: 200, description: 'Audit trail entity' })
  async getEntityAuditTrail(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.auditService.getEntityAuditTrail(entityType, entityId);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Audit trail untuk proyek' })
  @ApiResponse({ status: 200, description: 'Audit trail proyek' })
  async getProjectAuditTrail(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.auditService.getProjectAuditTrail(projectId);
  }

  @Get('contract/:contractId')
  @ApiOperation({ summary: 'Audit trail untuk kontrak' })
  @ApiResponse({ status: 200, description: 'Audit trail kontrak' })
  async getContractAuditTrail(
    @Param('contractId', ParseUUIDPipe) contractId: string,
  ) {
    return this.auditService.getContractAuditTrail(contractId);
  }
}
