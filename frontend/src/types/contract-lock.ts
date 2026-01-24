/**
 * Contract Lock - State 2: CONTRACT_ACTIVE_LOCKED
 * Type definitions for frontend
 */

export type ContractState = 
  | 'INTENT_DECLARED' 
  | 'PRE_CONTRACT_REVIEW' 
  | 'CONTRACT_ACTIVE_LOCKED' 
  | 'OPERATION_RUNNING'
  | 'PROGRESS_VERIFICATION'
  | 'PAYMENT_RELEASE'
  | 'CONTRACT_COMPLETED';

export type LockSubstatus = 
  | 'AWAITING_LOCK' 
  | 'AWAITING_OPERATION_START' 
  | 'AWAITING_PROGRESS_REPORT';

export type HoldingStatus = 'ESCROW_HELD' | 'PARTIAL_RELEASED' | 'FULLY_RELEASED';

export type ActionRequiredType = 'CONTRACT_LOCK_REQUIRED' | 'OPERATION_START_CONFIRMATION' | 'PROGRESS_REPORT_REQUIRED';

export type Importance = 'low' | 'medium' | 'high' | 'critical';

export type Party = 'Contractor' | 'ProjectOwner';

/**
 * Current contract state with all details
 */
export interface ContractStateData {
  state: ContractState;
  lockedAmount: number;
  lockTimestamp: Date | null;
  lockingTxHash: string | null;
  currentMilestone: number;
  substatus: LockSubstatus;
  isFundsLocked: boolean;
  operationStartDate: string | null;
  nextResponsibleParty: Party;
  rightsObligations: {
    contractor: string[];
    projectOwner: string[];
  };
}

/**
 * Locked status card information
 */
export interface LockedStatusCardData {
  lockedAmount: number;
  lockTimestamp: Date;
  transactionHash: string;
  explorerLink: string;
  holdingStatus: HoldingStatus;
  percentageHeld: number;
}

/**
 * Single right or obligation item
 */
export interface RightObligationItem {
  itemId: string;
  type: 'right' | 'obligation';
  party: Party;
  description: string;
  details: string;
  importance: Importance;
  contractReference: string;
}

/**
 * Next action/condition required
 */
export interface NextConditionData {
  actionRequired: ActionRequiredType;
  responsibleParty: Party;
  description: string;
  deadline: string;
  daysRemaining: number;
  consequence: string;
  isOverdue: boolean;
  isBlocking: boolean;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error: string | null;
  timestamp: Date;
}

/**
 * Lock page context
 */
export interface LockPageContext {
  contractId: string;
  contractState: ContractStateData;
  lockedStatus: LockedStatusCardData;
  rightsObligations: RightObligationItem[];
  nextCondition: NextConditionData;
  isLoading: boolean;
  error: string | null;
}

/**
 * UI Panel state
 */
export interface LockPanelState {
  activeTab: 'overview' | 'obligations' | 'timeline' | 'details';
  expandedSections: {
    [key: string]: boolean;
  };
  selectedParty: Party | 'all';
  isComparing: boolean;
}

/**
 * Blockchain explorer config
 */
export interface BlockchainExplorer {
  name: string;
  txPrefix: string;
  addressPrefix: string;
  network: 'mainnet' | 'testnet';
}

/**
 * Contract lock event (from smart contract)
 */
export interface ContractLockedEvent {
  contractId: string;
  amount: number;
  timestamp: Date;
  transactionHash: string;
  blockNumber: number;
  from: string;
}

/**
 * Audit log entry for lock action
 */
export interface LockAuditLog {
  timestamp: Date;
  action: string;
  actor: string;
  contractId: string;
  previousState: ContractState;
  newState: ContractState;
  details: {
    lockedAmount?: number;
    transactionHash?: string;
    reason?: string;
  };
}
