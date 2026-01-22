import { Controller, Post, Body, HttpCode, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { QrisService, WebhookPayload } from './qris.service';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PaymentStatus, TermStatus } from '../common/types';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private qrisService: QrisService,
    private paymentsService: PaymentsService,
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  @Post('midtrans')
  @HttpCode(200)
  @ApiOperation({ summary: 'Handle Midtrans payment notification webhook' })
  async handleMidtransWebhook(@Body() payload: WebhookPayload) {
    this.logger.log(`Received Midtrans webhook for order: ${payload.order_id}`);
    this.logger.debug(`Webhook payload: ${JSON.stringify(payload)}`);

    // Verify webhook signature
    if (!this.qrisService.verifyWebhookSignature(payload)) {
      this.logger.error(`Invalid signature for order: ${payload.order_id}`);
      return { status: 'error', message: 'Invalid signature' };
    }

    // Extract termId from order_id (format: TERM-{termId}-{timestamp})
    const orderIdParts = payload.order_id.split('-');
    if (orderIdParts.length < 2 || orderIdParts[0] !== 'TERM') {
      this.logger.error(`Invalid order_id format: ${payload.order_id}`);
      return { status: 'error', message: 'Invalid order_id format' };
    }

    const termId = orderIdParts[1];
    const transactionStatus = payload.transaction_status;

    this.logger.log(`Processing payment for term ${termId} with status: ${transactionStatus}`);

    try {
      // Find the payment record
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
        this.logger.error(`Payment not found for term: ${termId}`);
        return { status: 'error', message: 'Payment not found' };
      }

      // Handle different transaction statuses
      if (this.qrisService.isPaymentSuccess(transactionStatus)) {
        await this.handlePaymentSuccess(payment, payload);
      } else if (this.qrisService.isPaymentPending(transactionStatus)) {
        await this.handlePaymentPending(payment, payload);
      } else if (this.qrisService.isPaymentFailed(transactionStatus)) {
        await this.handlePaymentFailed(payment, payload);
      }

      return { status: 'ok' };
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error.message}`, error.stack);
      return { status: 'error', message: error.message };
    }
  }

  private async handlePaymentSuccess(payment: any, payload: WebhookPayload) {
    this.logger.log(`Payment success for term: ${payment.termId}`);

    // Update payment status
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.PAID,
        transactionRef: payload.transaction_id,
        paidAt: new Date(payload.settlement_time || payload.transaction_time),
      },
    });

    // Update term status to PAID
    await this.prisma.term.update({
      where: { id: payment.termId },
      data: { status: TermStatus.PAID },
    });

    // Log to audit
    await this.auditService.log({
      action: 'PAYMENT_CONFIRM',
      entityType: 'Payment',
      entityId: payment.id,
      description: `Pembayaran termin "${payment.term.name}" berhasil via QRIS. Transaction ID: ${payload.transaction_id}`,
      userId: payment.term.contract.project.ownerId,
    });

    this.logger.log(`Payment confirmed for term ${payment.termId}, transaction: ${payload.transaction_id}`);
  }

  private async handlePaymentPending(payment: any, payload: WebhookPayload) {
    this.logger.log(`Payment pending for term: ${payment.termId}`);

    // Update payment with transaction reference if not set
    if (!payment.transactionRef) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          transactionRef: payload.transaction_id,
        },
      });
    }
  }

  private async handlePaymentFailed(payment: any, payload: WebhookPayload) {
    this.logger.log(`Payment failed/expired for term: ${payment.termId}, status: ${payload.transaction_status}`);

    // Reset payment status back to READY so user can retry
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        transactionRef: null, // Clear the transaction reference
      },
    });

    // Log to audit
    await this.auditService.log({
      action: 'UPDATE',
      entityType: 'Payment',
      entityId: payment.id,
      description: `Pembayaran QRIS gagal/expired: ${payload.transaction_status}`,
      userId: payment.term.contract.project.ownerId,
    });
  }
}
