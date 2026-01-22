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
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from './payments.service';
import { QrisService } from './qris.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus, TermStatus } from '../common/types';

@ApiTags('payments')
@Controller('payments')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    private qrisService: QrisService,
    private prisma: PrismaService,
  ) {}

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

  @Post('term/:termId/qris')
  @ApiOperation({ summary: 'Generate QRIS payment QR code for a term (Owner only)' })
  async generateQrisPayment(
    @Param('termId') termId: string,
    @Request() req: any,
  ) {
    const user = req.user;

    // Only OWNER can generate QRIS payment
    if (user.role !== 'OWNER') {
      throw new ForbiddenException('Hanya Owner yang dapat melakukan pembayaran');
    }

    // Get term with payment and project details
    const term = await this.prisma.term.findUnique({
      where: { id: termId },
      include: {
        contract: {
          include: {
            project: {
              include: {
                owner: true,
              },
            },
          },
        },
        payment: true,
      },
    });

    if (!term) {
      throw new BadRequestException('Termin tidak ditemukan');
    }

    // Check if user is the owner of this project
    if (term.contract.project.ownerId !== user.sub) {
      throw new ForbiddenException('Anda bukan owner proyek ini');
    }

    // Check if term is VALID and payment is READY
    if (term.status !== TermStatus.VALID || term.payment?.status !== PaymentStatus.READY) {
      throw new BadRequestException('Termin belum valid untuk dibayar');
    }

    // Generate unique order ID
    const orderId = `TERM-${termId}-${Date.now()}`;

    // Create QRIS payment
    const qrisResponse = await this.qrisService.createQrisPayment({
      orderId,
      amount: term.payment.amount,
      termName: term.name,
      projectName: term.contract.project.name,
      customerName: term.contract.project.owner.name,
      customerEmail: term.contract.project.owner.email,
    });

    return {
      success: true,
      data: {
        orderId: qrisResponse.orderId,
        qrCodeUrl: qrisResponse.qrCodeUrl,
        qrString: qrisResponse.qrString,
        transactionId: qrisResponse.transactionId,
        expiryTime: qrisResponse.expiryTime,
        amount: term.payment.amount,
        termName: term.name,
        projectName: term.contract.project.name,
      },
    };
  }

  @Get('term/:termId/qris/status')
  @ApiOperation({ summary: 'Check QRIS payment status (Owner only)' })
  async checkQrisStatus(
    @Param('termId') termId: string,
    @Request() req: any,
  ) {
    const user = req.user;

    if (user.role !== 'OWNER') {
      throw new ForbiddenException('Hanya Owner yang dapat melihat status pembayaran');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { termId },
      include: {
        term: {
          include: {
            contract: {
              include: {
                project: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new BadRequestException('Payment tidak ditemukan');
    }

    if (payment.term.contract.project.ownerId !== user.sub) {
      throw new ForbiddenException('Anda bukan owner proyek ini');
    }

    // If there's a transaction reference, check status from Midtrans
    if (payment.transactionRef) {
      try {
        const midtransStatus = await this.qrisService.checkPaymentStatus(payment.transactionRef);
        return {
          paymentStatus: payment.status,
          midtransStatus: midtransStatus.transaction_status,
          transactionId: payment.transactionRef,
          paidAt: payment.paidAt,
        };
      } catch (error) {
        // If error checking Midtrans, just return local status
        return {
          paymentStatus: payment.status,
          transactionId: payment.transactionRef,
          paidAt: payment.paidAt,
        };
      }
    }

    return {
      paymentStatus: payment.status,
      paidAt: payment.paidAt,
    };
  }
}
