/**
 * Types for State 4: EVALUATION_AND_CALCULATION
 */

export enum EvaluationWaitingState {
  WAITING_FOR_AUDIT = 'WAITING_FOR_AUDIT',
  WAITING_FOR_CORRECTION = 'WAITING_FOR_CORRECTION',
  WAITING_FOR_FINAL_APPROVAL = 'WAITING_FOR_FINAL_APPROVAL',
}

export enum CalculationLineType {
  BASE_VALUE = 'BASE_VALUE',
  DEDUCTION = 'DEDUCTION',
  BONUS = 'BONUS',
  PENALTY = 'PENALTY',
}

export enum ObjectionStatusType {
  NONE = 'NONE',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
  EXPIRED = 'EXPIRED',
}

export interface ManualAdjustment {
  label: string;
  amount: number;
  type: CalculationLineType;
  description?: string;
}

export interface VerifiedPerformanceItem {
  milestoneNumber: number;
  plannedValue: number;
  actualValue: number;
  deviation: number;
  unit: string;
  evidenceLinks: string[];
  verifiedBy: string;
  verifiedAt: string;
}

export interface ClauseReferenceItem {
  clauseId: string;
  title: string;
  description: string;
  appliedReason: string;
  impact: string;
}

export interface CalculationLineItem {
  label: string;
  amount: number;
  type: CalculationLineType;
  description: string;
  impactOnPayment: string;
}

export interface ProvisionalResult {
  grossPayable: number;
  totalDeductions: number;
  totalBonuses: number;
  netPayable: number;
  currency: string;
  isFinal: boolean;
}

export interface ObjectionStatus {
  status: ObjectionStatusType;
  submittedBy?: string;
  submittedAt?: string;
  resolutionNotes?: string;
  resolutionDeadline?: string;
}

export interface AuditLogItem {
  action: string;
  description: string;
  timestamp: string;
  actor: string;
}

export interface EvaluationData {
  state: string;
  waitingState: EvaluationWaitingState;
  isDataFrozen: boolean;
  verifiedPerformanceData: VerifiedPerformanceItem[];
  appliedContractClauses: ClauseReferenceItem[];
  calculationBreakdown: CalculationLineItem[];
  provisionalResults: ProvisionalResult;
  objectionStatus: ObjectionStatus;
  correctionRounds: number;
  objectionDeadline: string;
  correctionDeadline: string;
  waitingFor: string;
  calculationHash?: string;
  auditTrail: AuditLogItem[];
}

export interface EvaluationApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error: string | null;
  timestamp: string | Date;
}

export interface StartEvaluationRequest {
  confirmStart: boolean;
  evaluationNotes?: string;
}

export interface CalculationRequest {
  contractId?: string;
  applyRiskAdjustments?: boolean;
  manualAdjustments?: ManualAdjustment[];
}

export interface ObjectionRequest {
  contractId?: string;
  reason: string;
  requestedChanges: string;
  evidenceUrls?: string[];
}
