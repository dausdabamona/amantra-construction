export interface ArchivePhaseTimestamps {
  intentDeclaredAt?: string | null;
  lockedAt?: string | null;
  operationStartedAt?: string | null;
  evaluationStartedAt?: string | null;
  rightsFinalizedAt?: string | null;
  distributionPreparedAt?: string | null;
  distributionExecutedAt?: string | null;
  distributionCompletedAt?: string | null;
  archivedAt?: string | null;
}

export interface ArchiveAuditTrailItem {
  action: string;
  message: string;
  actorId?: string;
  txHash?: string;
  timestamp: string;
}

export interface ArchiveFinalRightsSnapshot {
  finalRights?: any;
  instructions?: any[];
  logs?: any[];
}

export interface ArchiveFinalReport {
  title: string;
  summary?: string;
  totalFunds?: number;
  totalResult?: string;
  durationDays?: number;
  documentUrl?: string;
  createdAt: string;
}

export interface ArchiveSnapshot {
  contractId: string;
  finalState: string;
  finalHash?: string;
  finalRightsSnapshot: ArchiveFinalRightsSnapshot;
  transactionHashes: string[];
  transitionLog: any[];
  phaseTimestamps: ArchivePhaseTimestamps;
  distributionCompleted: boolean;
  closedBy?: string;
  archivedAt: string;
  notes?: string;
  finalReport?: ArchiveFinalReport;
  auditTrail: ArchiveAuditTrailItem[];
}

export interface ArchiveApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error: string | null;
  timestamp: string | Date;
}
