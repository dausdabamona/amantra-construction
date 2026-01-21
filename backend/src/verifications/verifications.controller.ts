import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { VerificationsService } from './verifications.service';

@ApiTags('verifications')
@Controller('verifications')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class VerificationsController {
  constructor(private verificationsService: VerificationsService) {}

  @Post('term/:termId')
  @ApiOperation({ summary: 'Verify a term (Supervisor or Witness only)' })
  async verify(
    @Param('termId') termId: string,
    @Body() body: { status: 'APPROVED' | 'REJECTED'; notes?: string },
    @Request() req: any,
  ) {
    return this.verificationsService.verify(termId, body, req.user);
  }

  @Get('term/:termId')
  @ApiOperation({ summary: 'Get verifications for a term' })
  async getTermVerifications(@Param('termId') termId: string) {
    return this.verificationsService.getTermVerifications(termId);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending verifications for current user' })
  async getPendingVerifications(@Request() req: any) {
    return this.verificationsService.getPendingVerifications(req.user);
  }
}
