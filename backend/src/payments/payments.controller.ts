import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('term/:termId/confirm')
  @ApiOperation({ summary: 'Confirm payment for a term (Owner only)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('proof'))
  async confirmPayment(
    @Param('termId') termId: string,
    @Body() body: { transactionRef?: string },
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    return this.paymentsService.confirmPayment(
      termId,
      {
        proofUrl: file ? `/uploads/payments/${file.filename}` : undefined,
        transactionRef: body.transactionRef,
      },
      req.user,
    );
  }

  @Get('term/:termId')
  @ApiOperation({ summary: 'Get payment status for a term' })
  async getPaymentStatus(@Param('termId') termId: string) {
    return this.paymentsService.getPaymentStatus(termId);
  }

  @Get('ready')
  @ApiOperation({ summary: 'Get all payments ready to be paid (Owner only)' })
  async getReadyPayments(@Request() req: any) {
    return this.paymentsService.getReadyPayments(req.user);
  }
}
