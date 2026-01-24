import { Body, Controller, Get, Param, Post, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EvaluationService } from './evaluation.service';
import {
  CalculationRequestDto,
  EvaluationResponseDto,
  EvaluationDataDto,
  ObjectionDto,
  ObjectionStatusDto,
  StartEvaluationDto,
  CalculationResponseDto,
} from './dto/evaluation.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('contracts-evaluation')
@ApiBearerAuth()
@Controller('contract/:id/evaluation')
@UseGuards(JwtAuthGuard)
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @Post('start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Memulai fase EVALUATION_AND_CALCULATION dan membekukan data' })
  async startEvaluation(
    @Param('id') contractId: string,
    @Body() body: StartEvaluationDto,
    @CurrentUser() user: any,
  ): Promise<EvaluationResponseDto<EvaluationDataDto>> {
    return this.evaluationService.startEvaluation(user.id, { ...body, contractId });
  }

  @Get('data')
  @ApiOperation({ summary: 'Ambil status evaluasi terkini' })
  async getEvaluation(
    @Param('id') contractId: string,
    @CurrentUser() user: any,
  ): Promise<EvaluationResponseDto<EvaluationDataDto>> {
    return this.evaluationService.getEvaluation(contractId, user.id);
  }

  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hitung provisional rights & obligations untuk disetujui' })
  async calculate(
    @Param('id') contractId: string,
    @Body() body: CalculationRequestDto,
    @CurrentUser() user: any,
  ): Promise<CalculationResponseDto> {
    return this.evaluationService.calculate(user.id, { ...body, contractId });
  }

  @Post('objection')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ajukan keberatan terhadap hasil provisional' })
  async objection(
    @Param('id') contractId: string,
    @Body() body: ObjectionDto,
    @CurrentUser() user: any,
  ): Promise<EvaluationResponseDto<ObjectionStatusDto>> {
    return this.evaluationService.submitObjection(user.id, { ...body, contractId });
  }
}
