import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsDate, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ContractSummaryDto {
  @ApiProperty({ description: 'Contract ID' })
  @IsString()
  contractId: string;

  @ApiProperty({ description: 'Contract title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Contract description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Total contract value in USD' })
  @IsNumber()
  totalValue: number;

  @ApiProperty({ description: 'Number of terms/phases' })
  @IsNumber()
  numberOfTerms: number;

  @ApiProperty({ description: 'Contract duration in days' })
  @IsNumber()
  durationDays: number;

  @ApiProperty({ description: 'Key terms summary' })
  @IsArray()
  keyTerms: string[];

  @ApiProperty({ description: 'Main responsibilities' })
  @IsArray()
  responsibilities: string[];
}

export class ProcessTimelineDto {
  @ApiProperty({ description: 'Timeline step ID' })
  @IsString()
  stepId: string;

  @ApiProperty({ description: 'Step name' })
  @IsString()
  stepName: string;

  @ApiProperty({ description: 'Step description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Expected duration in days' })
  @IsNumber()
  durationDays: number;

  @ApiProperty({ description: 'Sequence order' })
  @IsNumber()
  sequence: number;

  @ApiProperty({ description: 'Potential delays in days' })
  @IsNumber()
  potentialDelayDays: number;

  @ApiProperty({ description: 'Risk level of this step' })
  @IsString()
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export class RiskItemDto {
  @ApiProperty({ description: 'Risk ID' })
  @IsString()
  riskId: string;

  @ApiProperty({ description: 'Risk description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Severity level' })
  @IsString()
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  @ApiProperty({ description: 'Probability of occurrence (0-100)' })
  @IsNumber()
  probability: number;

  @ApiProperty({ description: 'Financial impact if occurs' })
  @IsNumber()
  financialImpact: number;

  @ApiProperty({ description: 'Mitigation strategy' })
  @IsString()
  mitigation: string;

  @ApiProperty({ description: 'Contingency plan' })
  @IsString()
  contingencyPlan: string;
}

export class SimulationScenarioDto {
  @ApiProperty({ description: 'Scenario ID' })
  @IsString()
  scenarioId: string;

  @ApiProperty({ description: 'Scenario name' })
  @IsString()
  scenarioName: string;

  @ApiProperty({ description: 'Scenario description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Expected outcome' })
  @IsString()
  expectedOutcome: string;

  @ApiProperty({ description: 'Financial outcome simulation' })
  @IsNumber()
  financialOutcome: number;

  @ApiProperty({ description: 'Timeline impact in days' })
  @IsNumber()
  timelineImpactDays: number;

  @ApiProperty({ description: 'Probability of this scenario (0-100)' })
  @IsNumber()
  probability: number;

  @ApiProperty({ description: 'Key assumptions' })
  @IsArray()
  assumptions: string[];
}

export class LegalTextSectionDto {
  @ApiProperty({ description: 'Section number' })
  @IsString()
  sectionNumber: string;

  @ApiProperty({ description: 'Section title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Full section text' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'Key obligations in this section' })
  @IsArray()
  keyObligations: string[];

  @ApiProperty({ description: 'Liability clauses' })
  @IsArray()
  liabilityClauses: string[];

  @ApiProperty({ description: 'Termination conditions if applicable' })
  @IsArray()
  terminationConditions: string[];
}

export class AcknowledgementChecklistDto {
  @ApiProperty({ description: 'Checklist item ID' })
  @IsString()
  itemId: string;

  @ApiProperty({ description: 'Item text' })
  @IsString()
  text: string;

  @ApiProperty({ description: 'Description for clarity' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Is this item critical (must acknowledge)' })
  @IsBoolean()
  isCritical: boolean;

  @ApiProperty({ description: 'Reference to contract section' })
  @IsString()
  referenceSectionId: string;
}

export class AcknowledgeContractDto {
  @ApiProperty({ description: 'Contract ID' })
  @IsString()
  @IsNotEmpty({ message: 'Contract ID adalah wajib' })
  contractId: string;

  @ApiProperty({ description: 'Acknowledge contract summary' })
  @IsBoolean()
  @IsNotEmpty()
  ackSummary: boolean;

  @ApiProperty({ description: 'Acknowledge process timeline' })
  @IsBoolean()
  @IsNotEmpty()
  ackTimeline: boolean;

  @ApiProperty({ description: 'Acknowledge risks and consequences' })
  @IsBoolean()
  @IsNotEmpty()
  ackRisks: boolean;

  @ApiProperty({ description: 'Acknowledge simulation scenarios' })
  @IsBoolean()
  @IsNotEmpty()
  ackSimulation: boolean;

  @ApiProperty({ description: 'Acknowledge legal contract text' })
  @IsBoolean()
  @IsNotEmpty()
  ackLegalText: boolean;

  @ApiProperty({ description: 'Acknowledge checklist items' })
  @IsBoolean()
  @IsNotEmpty()
  ackChecklist: boolean;

  @ApiProperty({ description: 'Understand cooling off period' })
  @IsBoolean()
  @IsNotEmpty()
  ackCooldown: boolean;
}

export class ContractReviewStatusDto {
  @ApiProperty({ description: 'Contract ID' })
  contractId: string;

  @ApiProperty({ description: 'Current state' })
  state: string;

  @ApiProperty({ description: 'Summary acknowledged' })
  ackSummary: boolean;

  @ApiProperty({ description: 'Timeline acknowledged' })
  ackTimeline: boolean;

  @ApiProperty({ description: 'Risks acknowledged' })
  ackRisks: boolean;

  @ApiProperty({ description: 'Simulation acknowledged' })
  ackSimulation: boolean;

  @ApiProperty({ description: 'Legal text acknowledged' })
  ackLegalText: boolean;

  @ApiProperty({ description: 'Checklist acknowledged' })
  ackChecklist: boolean;

  @ApiProperty({ description: 'All required items acknowledged' })
  allAcknowledged: boolean;

  @ApiProperty({ description: 'Cooldown expiry timestamp (unix)' })
  cooldownEndTime: number;

  @ApiProperty({ description: 'Cooldown completed' })
  cooldownCompleted: boolean;

  @ApiProperty({ description: 'Can proceed to lock funds' })
  canProceedToLock: boolean;

  @ApiProperty({ description: 'Reason if cannot proceed' })
  reason: string;

  @ApiProperty({ description: 'Timestamp of acknowledgement' })
  acknowledgedAt: Date;

  @ApiProperty({ description: 'List of all acknowledgements' })
  @IsArray()
  acknowledgementHistory: Array<{
    timestamp: Date;
    flag: string;
    status: boolean;
  }>;
}

export class ContractParametersDto {
  @ApiProperty({ description: 'Contractor name' })
  contractor: string;

  @ApiProperty({ description: 'Project owner name' })
  projectOwner: string;

  @ApiProperty({ description: 'Contract value' })
  contractValue: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Start date' })
  startDate: string;

  @ApiProperty({ description: 'Expected completion date' })
  completionDate: string;

  @ApiProperty({ description: 'Number of payment terms' })
  numberOfTerms: number;

  @ApiProperty({ description: 'Jurisdiction' })
  jurisdiction: string;

  @ApiProperty({ description: 'Governing law' })
  governingLaw: string;
}

export class ApprovePreContractDto {
  @ApiProperty({ description: 'Contract ID' })
  @IsString()
  @IsNotEmpty({ message: 'Contract ID wajib diperlukan' })
  contractId: string;

  @ApiProperty({ description: 'All acknowledgements must be complete' })
  @IsBoolean()
  @IsNotEmpty()
  allAcknowledged: boolean;

  @ApiProperty({ description: 'Cooldown period must be completed' })
  @IsBoolean()
  @IsNotEmpty()
  cooldownCompleted: boolean;

  @ApiProperty({ description: 'Explicit confirmation to lock funds' })
  @IsBoolean()
  @IsNotEmpty()
  confirmProceedToLock: boolean;
}

export class ContractReviewResponseDto {
  @ApiProperty({ description: 'Success flag' })
  success: boolean;

  @ApiProperty({ description: 'Message' })
  message: string;

  @ApiProperty({ description: 'Contract review status' })
  status?: ContractReviewStatusDto;

  @ApiProperty({ description: 'Data payload' })
  data?: any;

  @ApiProperty({ description: 'Error details if failed' })
  error?: string;

  @ApiProperty({ description: 'Timestamp' })
  timestamp?: Date;
}
