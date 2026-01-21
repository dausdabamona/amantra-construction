import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TermsService } from './terms.service';

@ApiTags('terms')
@Controller('terms')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class TermsController {
  constructor(private termsService: TermsService) {}

  @Post('contract/:contractId')
  @ApiOperation({ summary: 'Create a new term for contract (Owner only)' })
  async create(
    @Param('contractId') contractId: string,
    @Body()
    body: {
      termNumber: number;
      name: string;
      description?: string;
      percentage: number;
      value: number;
    },
    @Request() req: any,
  ) {
    return this.termsService.create(contractId, body, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get term detail with progress and verifications' })
  async findOne(@Param('id') id: string) {
    return this.termsService.findById(id);
  }

  @Get('contract/:contractId')
  @ApiOperation({ summary: 'Get all terms for a contract' })
  async findByContract(@Param('contractId') contractId: string) {
    return this.termsService.findByContract(contractId);
  }
}
