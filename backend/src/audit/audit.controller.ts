import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  findAll(@Query('limit') limit?: string) {
    return this.auditService.findAll(limit ? parseInt(limit, 10) : 50);
  }

  @Get('entity/:entityType/:entityId')
  findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.auditService.findByEntity(entityType, entityId);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string, @Query('limit') limit?: string) {
    return this.auditService.findByUser(userId, limit ? parseInt(limit, 10) : 50);
  }
}
