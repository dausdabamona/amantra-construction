declare module 'midtrans-client' {
  interface MidtransConfig {
    isProduction: boolean;
    serverKey: string;
    clientKey: string;
  }

  interface TransactionDetails {
    order_id: string;
    gross_amount: number;
  }

  interface ChargeParameter {
    payment_type: string;
    transaction_details: TransactionDetails;
    qris?: {
      acquirer: string;
    };
    item_details?: Array<{
      id: string;
      price: number;
      quantity: number;
      name: string;
      category?: string;
    }>;
    customer_details?: {
      first_name?: string;
      last_name?: string;
      email?: string;
      phone?: string;
    };
    custom_field1?: string;
    custom_field2?: string;
    custom_field3?: string;
  }

  interface ChargeResponse {
    status_code: string;
    status_message: string;
    transaction_id: string;
    order_id: string;
    gross_amount: string;
    payment_type: string;
    transaction_time: string;
    transaction_status: string;
    fraud_status?: string;
    qr_string?: string;
    expiry_time?: string;
    actions?: Array<{
      name: string;
      method: string;
      url: string;
    }>;
  }

  interface TransactionStatusResponse {
    status_code: string;
    status_message: string;
    transaction_id: string;
    order_id: string;
    gross_amount: string;
    payment_type: string;
    transaction_time: string;
    transaction_status: string;
    fraud_status?: string;
    settlement_time?: string;
  }

  class CoreApi {
    constructor(config: MidtransConfig);
    charge(parameter: ChargeParameter): Promise<ChargeResponse>;
    transaction: {
      status(orderId: string): Promise<TransactionStatusResponse>;
      cancel(orderId: string): Promise<any>;
      refund(orderId: string, parameter?: any): Promise<any>;
    };
  }

  class Snap {
    constructor(config: MidtransConfig);
    createTransaction(parameter: any): Promise<any>;
    createTransactionToken(parameter: any): Promise<string>;
    createTransactionRedirectUrl(parameter: any): Promise<string>;
  }

  export { CoreApi, Snap, MidtransConfig };
}
