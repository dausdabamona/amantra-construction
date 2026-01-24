import { Body, Controller, Get, Param, Post, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DistributionService } from './distribution.service';
import {
  DistributionResponseDto,
  DistributionStatusDto,
  ExecuteDistributionDto,
  PrepareDistributionDto,
} from './dto/distribution.dto';

@ApiTags('contracts-distribution')
@ApiBearerAuth()
@Controller('contract/:id/distribution')
@UseGuards(JwtAuthGuard)
export class DistributionController {
  constructor(private readonly distributionService: DistributionService) {}

  @Post('prepare')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Menyiapkan distribusi akhir dan instruksi transfer' })
  async prepare(
    @Param('id') contractId: string,
    @Body() body: PrepareDistributionDto,
    @CurrentUser() user: any,
  ): Promise<DistributionResponseDto<DistributionStatusDto>> {
    return this.distributionService.prepareDistribution(contractId, user.id, body);
  }

  @Post('execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Menjalankan distribusi dana sesuai instruksi final' })
  async execute(
    @Param('id') contractId: string,
    @Body() body: ExecuteDistributionDto,
    @CurrentUser() user: any,
  ): Promise<DistributionResponseDto<DistributionStatusDto>> {
    return this.distributionService.executeDistribution(contractId, user.id, body);
  }

  @Get('status')
  @ApiOperation({ summary: 'Ambil status distribusi dan progres transfer' })
  async status(
    @Param('id') contractId: string,
  ): Promise<DistributionResponseDto<DistributionStatusDto>> {
    return this.distributionService.getStatus(contractId);
  }
}
