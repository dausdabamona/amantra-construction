// State 1: PRE_CONTRACT_REVIEW Types

export interface ContractSummary {
  contractId: string;
  title: string;
  description: string;
  totalValue: number;
  numberOfTerms: number;
  durationDays: number;
  keyTerms: string[];
  responsibilities: string[];
}

export interface ProcessTimelineStep {
  stepId: string;
  stepName: string;
  description: string;
  durationDays: number;
  sequence: number;
  potentialDelayDays: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface RiskItem {
  riskId: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  probability: number; // 0-100
  financialImpact: number;
  mitigation: string;
  contingencyPlan: string;
}

export interface SimulationScenario {
  scenarioId: string;
  scenarioName: string;
  description: string;
  expectedOutcome: string;
  financialOutcome: number;
  timelineImpactDays: number;
  probability: number; // 0-100
  assumptions: string[];
}

export interface LegalTextSection {
  sectionNumber: string;
  title: string;
  content: string;
  keyObligations: string[];
  liabilityClauses: string[];
  terminationConditions: string[];
}

export interface AcknowledgementChecklistItem {
  itemId: string;
  text: string;
  description: string;
  isCritical: boolean;
  referenceSectionId: string;
}

export interface ContractReviewStatus {
  contractId: string;
  state: string;
  ackSummary: boolean;
  ackTimeline: boolean;
  ackRisks: boolean;
  ackSimulation: boolean;
  ackLegalText: boolean;
  ackChecklist: boolean;
  allAcknowledged: boolean;
  cooldownEndTime: number; // unix timestamp
  cooldownCompleted: boolean;
  canProceedToLock: boolean;
  reason: string;
  acknowledgedAt: Date | null;
  acknowledgementHistory: Array<{
    timestamp: Date;
    flag: string;
    status: boolean;
  }>;
}

export interface ContractParameters {
  contractor: string;
  projectOwner: string;
  contractValue: number;
  currency: string;
  startDate: string;
  completionDate: string;
  numberOfTerms: number;
  jurisdiction: string;
  governingLaw: string;
}

export interface AcknowledgeContractRequest {
  contractId: string;
  ackSummary: boolean;
  ackTimeline: boolean;
  ackRisks: boolean;
  ackSimulation: boolean;
  ackLegalText: boolean;
  ackChecklist: boolean;
  ackCooldown: boolean;
}

export interface ApprovePreContractRequest {
  contractId: string;
  allAcknowledged: boolean;
  cooldownCompleted: boolean;
  confirmProceedToLock: boolean;
}

export interface ContractReviewResponse {
  success: boolean;
  message: string;
  data?: ContractReviewStatus | ContractSummary | ProcessTimelineStep[] | RiskItem[] | SimulationScenario[] | LegalTextSection[] | AcknowledgementChecklistItem[];
  error?: string;
  timestamp: Date;
}

// UI State Management
export interface ContractReviewUIState {
  contractId: string;
  currentStep: number; // 1-7
  steps: ReviewStep[];
  acknowledgements: {
    ackSummary: boolean;
    ackTimeline: boolean;
    ackRisks: boolean;
    ackSimulation: boolean;
    ackLegalText: boolean;
    ackChecklist: boolean;
    ackCooldown: boolean;
  };
  cooldownEndTime: number | null;
  cooldownRemaining: number; // in seconds
  canProceed: boolean;
  isSubmitting: boolean;
  error: string | null;
}

export interface ReviewStep {
  id: number;
  name: string;
  title: string;
  description: string;
  component: string;
  acknowledgementFlag: keyof ContractReviewUIState['acknowledgements'] | null;
  isCompleted: boolean;
  isLocked: boolean; // Cannot skip
}

// Mock contract for demo
export interface MockContract {
  contractId: string;
  userId: string;
  title: string;
  description: string;
  totalValue: number;
  numberOfTerms: number;
  durationDays: number;
  parameters: ContractParameters;
  createdAt: Date;
  updatedAt: Date;
}
