import {
  Controller,
  Get,
  Post,
  Patch,
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
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from './payments.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { UserRole, PaymentStatus, PaymentMethod } from '@prisma/client';

@ApiTags('payments')
@Controller('payments')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Buat pembayaran baru' })
  @ApiResponse({ status: 201, description: 'Pembayaran berhasil dibuat' })
  async create(
    @Body()
    createDto: {
      contractId: string;
      workPhaseId?: string;
      amount: number;
      currency?: string;
      method?: PaymentMethod;
      bankName?: string;
      accountNumber?: string;
      accountName?: string;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.paymentsService.create(createDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Daftar pembayaran' })
  @ApiQuery({ name: 'contractId', required: false })
  @ApiResponse({ status: 200, description: 'Daftar pembayaran' })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('contractId') contractId?: string,
  ) {
    return this.paymentsService.findAll(pagination, contractId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail pembayaran' })
  @ApiResponse({ status: 200, description: 'Detail pembayaran' })
  @ApiResponse({ status: 404, description: 'Pembayaran tidak ditemukan' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.findById(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Ubah status pembayaran' })
  @ApiQuery({ name: 'status', enum: PaymentStatus })
  @ApiResponse({ status: 200, description: 'Status pembayaran berhasil diubah' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('status') status: PaymentStatus,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.paymentsService.updateStatus(id, status, user);
  }

  @Post(':id/process')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Proses pembayaran' })
  @ApiBody({ schema: { properties: { transactionRef: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Pembayaran diproses' })
  async processPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('transactionRef') transactionRef: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.paymentsService.processPayment(id, transactionRef, user);
  }

  @Post(':id/simulate-smart-contract')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Simulasi pembayaran via smart contract' })
  @ApiResponse({ status: 200, description: 'Pembayaran smart contract disimulasikan' })
  async simulateSmartContract(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.paymentsService.simulateSmartContractPayment(id, user);
  }
}
