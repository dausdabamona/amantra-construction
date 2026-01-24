/**
 * Types for State 5: RIGHTS_FINALIZED_AND_DISTRIBUTION
 */

export enum DistributionWaitingState {
  WAITING_FOR_ESCROW_RELEASE = 'WAITING_FOR_ESCROW_RELEASE',
  WAITING_FOR_TRANSFER_CONFIRMATION = 'WAITING_FOR_TRANSFER_CONFIRMATION',
}

export enum TxStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
}

export interface FinalRights {
  calculationHash: string;
  finalShareInvestor: number;
  finalShareOperator: number;
  fees: number;
  penalties: number;
  currency: string;
  txStatus: TxStatus;
}

export interface DistributionInstruction {
  beneficiary: string;
  role: string;
  amount: number;
  status: string;
  txHash?: string;
}

export interface TransferLogItem {
  action: string;
  status: string;
  message: string;
  txHash?: string;
  timestamp: string;
}

export interface DistributionStatus {
  waitingState: DistributionWaitingState;
  finalRights: FinalRights;
  instructions: DistributionInstruction[];
  logs: TransferLogItem[];
}

export interface DistributionApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error: string | null;
  timestamp: string | Date;
}
