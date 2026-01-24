/**
 * Frontend Types for Operation State (State 3)
 * Type definitions for operation management, milestone tracking, and progress reporting
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum OperationState {
  PRE_CONTRACT_REVIEW = 'PRE_CONTRACT_REVIEW',
  CONTRACT_ACTIVE_LOCKED = 'CONTRACT_ACTIVE_LOCKED',
  OPERATION_RUNNING = 'OPERATION_RUNNING',
  EVALUATION_AND_CALCULATION = 'EVALUATION_AND_CALCULATION',
  PAYMENT_RELEASE = 'PAYMENT_RELEASE',
  VERIFICATION = 'VERIFICATION',
  CONTRACT_COMPLETED = 'CONTRACT_COMPLETED',
}

export enum OperationWaitingState {
  WAITING_FOR_REPORT = 'WAITING_FOR_REPORT',
  WAITING_FOR_VERIFICATION = 'WAITING_FOR_VERIFICATION',
  WAITING_FOR_MILESTONE_COMPLETION = 'WAITING_FOR_MILESTONE_COMPLETION',
}

export enum ReportStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum VerificationResultType {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REVISION_REQUIRED = 'REVISION_REQUIRED',
  PENDING = 'PENDING',
}

// ============================================================================
// MILESTONE TYPES
// ============================================================================

export interface MilestoneDeliverable {
  id: string;
  description: string;
  completed: boolean;
  completedDate?: Date;
  verificationNotes?: string;
}

export interface MilestoneData {
  milestoneNumber: number;
  description: string;
  percentageOfContract: number;
  amount: number;
  targetCompletionDate: Date;
  actualCompletionDate?: Date;
  responsibleParty: string;
  deliverables: MilestoneDeliverable[];
  status: ReportStatus;
  reportCount: number;
  currentProgress: number; // 0-100
  isOverdue: boolean;
  daysOverdue?: number;
}

export interface MilestoneSummary {
  total: number;
  completed: number;
  pending: number;
  inReview: number;
  overallProgress: number; // 0-100
}

// ============================================================================
// REPORT TYPES
// ============================================================================

export interface ProgressReportPhoto {
  id: string;
  url: string;
  uploadedDate: Date;
  description?: string;
}

export interface ReportFoundIssue {
  id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  requiredAction: string;
  targetResolutionDate?: Date;
}

export interface ProgressReport {
  reportId: string;
  milestoneNumber: number;
  submittedDate: Date;
  submittedBy: string;
  progressDescription: string;
  completionPercentage: number;
  status: ReportStatus;
  photos: ProgressReportPhoto[];
  notes?: string;
  reportHash: string;
  verificationNotes?: string;
  verifiedBy?: string;
  verifiedDate?: Date;
  foundIssues?: ReportFoundIssue[];
}

export interface ProgressReportInput {
  milestoneNumber: number;
  progressDescription: string;
  completionPercentage: number;
  photoUrls: string[];
  notes?: string;
}

// ============================================================================
// OPERATION STATE TYPES
// ============================================================================

export interface OperationStateData {
  state: OperationState;
  waitingState: OperationWaitingState;
  activeMilestoneNumber: number;
  daysSinceStart: number;
  daysUntilDeadline: number;
  milestones: MilestoneData[];
  currentResponsibleParty: string;
  waitingFor: string;
  currentDeadline: Date;
  isOverdue: boolean;
  daysOverdue: number;
  overallProgress: number;
}

export interface OperationProgress {
  operationState: OperationStateData;
  submittedReports: ProgressReport[];
  activityTimeline: ActivityTimelineItem[];
  milestoneSummary: MilestoneSummary;
}

// ============================================================================
// ACTIVITY TIMELINE TYPES
// ============================================================================

export enum ActivityType {
  OPERATION_STARTED = 'OPERATION_STARTED',
  REPORT_SUBMITTED = 'REPORT_SUBMITTED',
  REPORT_VERIFIED = 'REPORT_VERIFIED',
  REPORT_REJECTED = 'REPORT_REJECTED',
  REPORT_REVISION_REQUESTED = 'REPORT_REVISION_REQUESTED',
  MILESTONE_COMPLETED = 'MILESTONE_COMPLETED',
  DEADLINE_APPROACHING = 'DEADLINE_APPROACHING',
  DEADLINE_PASSED = 'DEADLINE_PASSED',
  VERIFICATION_REQUIRED = 'VERIFICATION_REQUIRED',
  STATE_ADVANCED = 'STATE_ADVANCED',
}

export interface ActivityTimelineItem {
  id: string;
  activityType: ActivityType;
  description: string;
  timestamp: Date;
  actor: string;
  reference?: string;
  status: 'success' | 'warning' | 'error' | 'info';
  details?: Record<string, any>;
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface StartOperationRequest {
  confirmOperationStart: boolean;
  scheduledStartTime: Date;
}

export interface SubmitReportRequest {
  milestoneNumber: number;
  progressDescription: string;
  completionPercentage: number;
  photoUrls: string[];
  notes?: string;
}

export interface VerifyReportRequest {
  milestoneNumber: number;
  result: VerificationResultType;
  verificationNotes?: string;
  foundIssues?: ReportFoundIssue[];
}

export interface OperationApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error: string | null;
  timestamp: Date;
}

// ============================================================================
// OPERATION CONTEXT TYPES (For UI Display)
// ============================================================================

export interface OperationContext {
  currentState: OperationState;
  isFundsLocked: boolean;
  isOperationRunning: boolean;
  activeMilestone: MilestoneData | null;
  daysSinceStart: number;
  daysUntilDeadline: number;
  isOverdue: boolean;
  overallProgress: number;
  waitingFor: string;
  responsibleParty: string;
  currentDeadline: Date;
  nextCondition: string;
}

export interface ContractRightsContext {
  rightsOnHold: string[];
  whyOnHold: string;
  whenWillBeReleased: string;
  conditions: string[];
  blockedActions: string[];
  allowedActions: string[];
}

export interface ContractObligationsContext {
  currentObligation: string;
  obligationDescription: string;
  responsible: string;
  deadline: Date;
  progressPercentage: number;
  consequence: string;
  consequenceTrigger: string;
}

// ============================================================================
// STATE CALCULATION TYPES
// ============================================================================

export interface WaitingStateAnalysis {
  currentWaitingState: OperationWaitingState;
  explanation: string;
  whoWaits: string;
  forWhat: string;
  deadline?: Date;
  estimatedWaitTime?: number; // in days
}

export interface DeadlineStatus {
  isDeadlineApproaching: boolean;
  daysUntilDeadline: number;
  isOverdue: boolean;
  daysOverdue: number;
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// ============================================================================
// OPERATION LIFECYCLE
// ============================================================================

export interface OperationLifecycleEvent {
  eventId: string;
  eventType: 'STATE_TRANSITION' | 'MILESTONE_COMPLETED' | 'REPORT_VERIFIED' | 'DEADLINE_PASSED';
  from: OperationState | OperationWaitingState;
  to: OperationState | OperationWaitingState;
  timestamp: Date;
  triggeredBy: string;
  triggerDescription: string;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface OperationUIState {
  loading: boolean;
  error: string | null;
  operationData: OperationProgress | null;
  selectedMilestoneNumber: number | null;
  showReportForm: boolean;
  showVerificationPanel: boolean;
  isSubmittingReport: boolean;
  isVerifyingReport: boolean;
  lastUpdateTime: Date | null;
}

export interface OperationStore extends OperationUIState {
  // Actions
  setOperationData: (data: OperationProgress) => void;
  selectMilestone: (milestoneNumber: number) => void;
  toggleReportForm: () => void;
  toggleVerificationPanel: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addReport: (report: ProgressReport) => void;
  updateMilestoneStatus: (
    milestoneNumber: number,
    status: ReportStatus,
  ) => void;
  addTimelineItem: (item: ActivityTimelineItem) => void;
  reset: () => void;
}
