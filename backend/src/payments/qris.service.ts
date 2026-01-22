import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as midtransClient from 'midtrans-client';

export interface QrisPaymentRequest {
  orderId: string;
  amount: number;
  termName: string;
  projectName: string;
  customerName: string;
  customerEmail: string;
}

export interface QrisPaymentResponse {
  orderId: string;
  qrCodeUrl: string;
  qrString: string;
  transactionId: string;
  expiryTime?: string;
}

export interface WebhookPayload {
  transaction_type: string;
  transaction_time: string;
  transaction_status: string;
  transaction_id: string;
  status_message: string;
  status_code: string;
  signature_key: string;
  settlement_time?: string;
  payment_type: string;
  order_id: string;
  merchant_id: string;
  issuer?: string;
  gross_amount: string;
  fraud_status?: string;
  currency: string;
  acquirer?: string;
}

@Injectable()
export class QrisService {
  private readonly logger = new Logger(QrisService.name);
  private coreApi: midtransClient.CoreApi;
  private isProduction: boolean;
  private serverKey: string;

  constructor(private configService: ConfigService) {
    this.isProduction = this.configService.get('MIDTRANS_IS_PRODUCTION', 'false') === 'true';
    this.serverKey = this.configService.get('MIDTRANS_SERVER_KEY', '');

    this.coreApi = new midtransClient.CoreApi({
      isProduction: this.isProduction,
      serverKey: this.serverKey,
      clientKey: this.configService.get('MIDTRANS_CLIENT_KEY', ''),
    });

    this.logger.log(`Midtrans initialized in ${this.isProduction ? 'PRODUCTION' : 'SANDBOX'} mode`);
  }

  /**
   * Generate QRIS payment QR code
   */
  async createQrisPayment(request: QrisPaymentRequest): Promise<QrisPaymentResponse> {
    const parameter = {
      payment_type: 'qris',
      transaction_details: {
        order_id: request.orderId,
        gross_amount: request.amount,
      },
      qris: {
        acquirer: 'gopay', // Default acquirer, bisa juga 'airpay shopee'
      },
      item_details: [
        {
          id: request.orderId,
          price: request.amount,
          quantity: 1,
          name: `Pembayaran ${request.termName}`,
          category: 'Construction Payment',
        },
      ],
      customer_details: {
        first_name: request.customerName,
        email: request.customerEmail,
      },
      custom_field1: request.projectName,
      custom_field2: request.termName,
    };

    try {
      this.logger.log(`Creating QRIS payment for order: ${request.orderId}`);
      const response = await this.coreApi.charge(parameter);

      this.logger.log(`QRIS payment created: ${response.transaction_id}`);

      return {
        orderId: request.orderId,
        qrCodeUrl: response.actions?.find((a: any) => a.name === 'generate-qr-code')?.url || '',
        qrString: response.qr_string || '',
        transactionId: response.transaction_id,
        expiryTime: response.expiry_time,
      };
    } catch (error) {
      this.logger.error(`Failed to create QRIS payment: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(orderId: string): Promise<any> {
    try {
      const response = await this.coreApi.transaction.status(orderId);
      this.logger.log(`Payment status for ${orderId}: ${response.transaction_status}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to check payment status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify webhook signature from Midtrans
   */
  verifyWebhookSignature(payload: WebhookPayload): boolean {
    const crypto = require('crypto');

    const signatureInput =
      payload.order_id +
      payload.status_code +
      payload.gross_amount +
      this.serverKey;

    const expectedSignature = crypto
      .createHash('sha512')
      .update(signatureInput)
      .digest('hex');

    const isValid = payload.signature_key === expectedSignature;

    if (!isValid) {
      this.logger.warn(`Invalid webhook signature for order: ${payload.order_id}`);
    }

    return isValid;
  }

  /**
   * Check if payment is successful based on transaction status
   */
  isPaymentSuccess(status: string): boolean {
    return ['capture', 'settlement'].includes(status);
  }

  /**
   * Check if payment is pending
   */
  isPaymentPending(status: string): boolean {
    return ['pending', 'authorize'].includes(status);
  }

  /**
   * Check if payment failed or cancelled
   */
  isPaymentFailed(status: string): boolean {
    return ['deny', 'cancel', 'expire', 'failure'].includes(status);
  }

  /**
   * Cancel a pending transaction
   */
  async cancelTransaction(orderId: string): Promise<any> {
    try {
      const response = await this.coreApi.transaction.cancel(orderId);
      this.logger.log(`Transaction ${orderId} cancelled`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to cancel transaction: ${error.message}`);
      throw error;
    }
  }
}
