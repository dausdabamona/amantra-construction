import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { 
  ContractSummaryDto, 
  ProcessTimelineDto, 
  RiskItemDto, 
  SimulationScenarioDto,
  LegalTextSectionDto,
  AcknowledgementChecklistDto,
  AcknowledgeContractDto,
  ContractReviewStatusDto,
  ApprovePreContractDto,
  ContractParametersDto
} from './dto/contract-review.dto';
import * as crypto from 'crypto';

interface ContractDraft {
  contractId: string;
  userId: string;
  title: string;
  description: string;
  totalValue: number;
  numberOfTerms: number;
  durationDays: number;
  contractText: string;
  parameters: ContractParametersDto;
  createdAt: Date;
  updatedAt: Date;
}

interface ReviewAcknowledgement {
  id: string;
  contractId: string;
  userId: string;
  ackSummary: boolean;
  ackTimeline: boolean;
  ackRisks: boolean;
  ackSimulation: boolean;
  ackLegalText: boolean;
  ackChecklist: boolean;
  cooldownEndTime: number;
  allAcknowledged: boolean;
  acknowledgedAt: Date;
  createdAt: Date;
}

@Injectable()
export class ContractReviewService {
  // Cooldown period: 48 hours (in milliseconds)
  private readonly COOLDOWN_PERIOD_MS = 48 * 60 * 60 * 1000;

  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  /**
   * Get contract summary - basic contract information
   */
  async getContractSummary(contractId: string, userId: string): Promise<ContractSummaryDto> {
    // Verify user has declared intent (guard from State 0)
    const hasIntent = await this.prisma.auditLog.findFirst({
      where: {
        userId,
        action: 'INTENT_DECLARED',
      },
    });

    if (!hasIntent) {
      throw new ForbiddenException('Intent belum dideklarasikan. Silakan selesaikan State 0 terlebih dahulu.');
    }

    // Fetch contract (would come from database in production)
    const contract = this.getMockContract(contractId, userId);

    return {
      contractId: contract.contractId,
      title: contract.title,
      description: contract.description,
      totalValue: contract.totalValue,
      numberOfTerms: contract.numberOfTerms,
      durationDays: contract.durationDays,
      keyTerms: [
        'Payment on milestone completion',
        'Quality assurance inspection required',
        'Materials supplied by project owner',
        'Insurance requirement: IDR 5 Billion',
      ],
      responsibilities: [
        'Contractor: Provide skilled workforce',
        'Contractor: Ensure quality standards',
        'Project Owner: Provide site access',
        'Project Owner: Approve milestones',
      ],
    };
  }

  /**
   * Get process timeline - step-by-step contract execution flow
   */
  async getProcessTimeline(contractId: string, userId: string): Promise<ProcessTimelineDto[]> {
    // Verify intent
    await this.verifyIntentDeclared(userId);

    return [
      {
        stepId: 'step_1',
        stepName: 'Project Kickoff Meeting',
        description: 'Initial meeting between contractor and project owner to finalize scope and schedule',
        durationDays: 7,
        sequence: 1,
        potentialDelayDays: 5,
        riskLevel: 'LOW',
      },
      {
        stepId: 'step_2',
        stepName: 'Site Preparation',
        description: 'Prepare construction site, setup equipment, and safety measures',
        durationDays: 14,
        sequence: 2,
        potentialDelayDays: 7,
        riskLevel: 'MEDIUM',
      },
      {
        stepId: 'step_3',
        stepName: 'Phase 1 Construction (Term 1)',
        description: 'Execute first construction phase according to contract specifications',
        durationDays: 60,
        sequence: 3,
        potentialDelayDays: 15,
        riskLevel: 'HIGH',
      },
      {
        stepId: 'step_4',
        stepName: 'Phase 1 Inspection & Approval',
        description: 'Supervisor and witness verify work quality and approve for payment',
        durationDays: 5,
        sequence: 4,
        potentialDelayDays: 3,
        riskLevel: 'MEDIUM',
      },
      {
        stepId: 'step_5',
        stepName: 'Phase 2 Construction (Term 2)',
        description: 'Execute second construction phase',
        durationDays: 60,
        sequence: 5,
        potentialDelayDays: 15,
        riskLevel: 'HIGH',
      },
      {
        stepId: 'step_6',
        stepName: 'Final Inspection & Handover',
        description: 'Complete final inspection and project handover to owner',
        durationDays: 7,
        sequence: 6,
        potentialDelayDays: 5,
        riskLevel: 'MEDIUM',
      },
    ];
  }

  /**
   * Get risk and consequence analysis
   */
  async getRisksAndConsequences(contractId: string, userId: string): Promise<RiskItemDto[]> {
    await this.verifyIntentDeclared(userId);

    return [
      {
        riskId: 'risk_1',
        description: 'Weather delays - Heavy rain during monsoon season',
        severity: 'HIGH',
        probability: 60,
        financialImpact: 500000000, // IDR 500 Million
        mitigation: 'Utilize weather-proof equipment and schedule non-critical work during dry season',
        contingencyPlan: 'Extend schedule by 15 days with additional resource allocation',
      },
      {
        riskId: 'risk_2',
        description: 'Labor shortage - Key skilled workers unavailable',
        severity: 'MEDIUM',
        probability: 30,
        financialImpact: 300000000, // IDR 300 Million
        mitigation: 'Establish relationships with multiple labor suppliers; maintain backup workforce',
        contingencyPlan: 'Hire premium labor or reduce scope temporarily',
      },
      {
        riskId: 'risk_3',
        description: 'Material price fluctuation - Steel and cement prices increase',
        severity: 'MEDIUM',
        probability: 70,
        financialImpact: 400000000, // IDR 400 Million
        mitigation: 'Lock in material prices 60 days in advance; bulk purchase when possible',
        contingencyPlan: 'Request contract price adjustment or quality reduction approval',
      },
      {
        riskId: 'risk_4',
        description: 'Quality issues - Inspection rejection requiring rework',
        severity: 'HIGH',
        probability: 25,
        financialImpact: 200000000, // IDR 200 Million
        mitigation: 'Implement rigorous QA checks; hire certified inspectors; documentation',
        contingencyPlan: 'Immediate rework implementation with extended timeline',
      },
      {
        riskId: 'risk_5',
        description: 'Regulatory changes - New environmental or safety standards',
        severity: 'CRITICAL',
        probability: 15,
        financialImpact: 1000000000, // IDR 1 Billion
        mitigation: 'Monitor regulatory environment; engage legal counsel proactively',
        contingencyPlan: 'Negotiate contract modification or termination provisions',
      },
    ];
  }

  /**
   * Get simulation scenarios - "what if" analysis
   */
  async getSimulationScenarios(contractId: string, userId: string): Promise<SimulationScenarioDto[]> {
    await this.verifyIntentDeclared(userId);

    return [
      {
        scenarioId: 'scenario_best',
        scenarioName: 'Best Case - On-time & On-budget',
        description: 'Project completes exactly as planned with no delays or cost overruns',
        expectedOutcome: 'Contractor receives 100% payment; Project owner completes on schedule',
        financialOutcome: 0, // No variance
        timelineImpactDays: 0,
        probability: 20,
        assumptions: ['Weather is favorable', 'Labor availability constant', 'No regulatory changes'],
      },
      {
        scenarioId: 'scenario_realistic',
        scenarioName: 'Realistic Case - Slight Delays',
        description: 'Project experiences minor delays and minor cost increases (typical scenario)',
        expectedOutcome: 'Project completes 10-15 days late with 5-10% cost overrun',
        financialOutcome: 500000000, // IDR 500M overrun
        timelineImpactDays: 12,
        probability: 55,
        assumptions: ['1-2 minor risks materialize', 'Effective mitigation strategies applied'],
      },
      {
        scenarioId: 'scenario_worst',
        scenarioName: 'Worst Case - Multiple Risks Materialize',
        description: 'Multiple major risks occur simultaneously causing significant delays and costs',
        expectedOutcome: 'Project delayed 30+ days with 20% cost overrun',
        financialOutcome: 2000000000, // IDR 2B overrun
        timelineImpactDays: 35,
        probability: 15,
        assumptions: ['3+ major risks occur', 'Mitigation strategies partially effective', 'Quality rework needed'],
      },
      {
        scenarioId: 'scenario_crisis',
        scenarioName: 'Crisis Case - Contract Abandonment',
        description: 'Critical issue causes contractor to abandon project or massive rework needed',
        expectedOutcome: 'Contract termination or complete project restart',
        financialOutcome: -10000000000, // IDR -10B loss
        timelineImpactDays: 180,
        probability: 5,
        assumptions: ['Major structural failure discovered', 'Regulatory prohibition', 'Safety incident'],
      },
    ];
  }

  /**
   * Get legal contract text sections
   */
  async getLegalContractText(contractId: string, userId: string): Promise<LegalTextSectionDto[]> {
    await this.verifyIntentDeclared(userId);

    return [
      {
        sectionNumber: '1',
        title: 'Definitions and Interpretations',
        content: `In this Contract, unless the context otherwise requires:
        "Contractor" means the party executing the construction work.
        "Project Owner" means the party engaging the Contractor.
        "Work" means all work described in the Schedule of Work.
        "Contract Price" means the agreed total price including all taxes and levies.
        "Completion Date" means the date specified in the Schedule or as extended by Variation Orders.`,
        keyObligations: [
          'Define all terms clearly and consistently',
          'Provide interpretation guidelines',
          'Reference all appendices and schedules',
        ],
        liabilityClauses: [],
        terminationConditions: [],
      },
      {
        sectionNumber: '2',
        title: 'Scope of Work and Contract Price',
        content: `The Contractor shall execute all Work as described in the attached Schedule of Work for the Contract Price of IDR 10,000,000,000 (Ten Billion Rupiah). Payment shall be made in three (3) equal installments upon:
        - Term 1: Completion of 30% of Work (IDR 3.33B)
        - Term 2: Completion of 70% of Work (IDR 3.33B)
        - Final: 100% completion with Final Inspection approval (IDR 3.34B)`,
        keyObligations: [
          'Complete all work per specifications',
          'Maintain quality standards throughout',
          'Submit progress reports monthly',
          'Comply with all applicable laws',
        ],
        liabilityClauses: [
          'Contractor liable for defects for 12 months post-completion',
          'Contractor bears risk of loss until Final Inspection',
        ],
        terminationConditions: [],
      },
      {
        sectionNumber: '3',
        title: 'Contractor Obligations and Safety',
        content: `The Contractor shall:
        a) Provide qualified and experienced workforce
        b) Maintain comprehensive insurance coverage (minimum IDR 5 Billion)
        c) Implement strict safety protocols and daily safety briefings
        d) Keep construction site organized and clean
        e) Protect neighboring properties from damage
        f) Provide emergency contact available 24/7`,
        keyObligations: [
          'Safety compliance is non-negotiable',
          'Weekly safety audits required',
          'Incident reporting within 24 hours',
          'Insurance coverage proof before work start',
        ],
        liabilityClauses: [
          'Contractor liable for all workplace injuries',
          'Contractor liable for third-party property damage',
        ],
        terminationConditions: [
          'Immediate termination if safety violation causes injury',
        ],
      },
      {
        sectionNumber: '4',
        title: 'Quality Control and Inspection',
        content: `The Project Owner shall appoint a Supervisor and Witness to inspect work at completion of each Term. Approval requires:
        - Supervisor verification of quality standards
        - Witness confirmation of specification compliance
        - No defects requiring remediation
        Upon approval, Contractor receives payment within 7 days.`,
        keyObligations: [
          'Supervisor conducts weekly site inspections',
          'Witness performs technical verification',
          'Results documented in Inspection Reports',
        ],
        liabilityClauses: [
          'Contractor must fix rejected work at no additional cost',
          'Delays in approval do not extend completion date',
        ],
        terminationConditions: [
          'Termination if work fails inspection 2 consecutive times',
        ],
      },
      {
        sectionNumber: '5',
        title: 'Payment Terms and Conditions',
        content: `Payment shall be made within 7 days of Supervisor and Witness approval. Bank details and payment instructions shall be provided by Contractor 30 days before first payment due date. Contractor acknowledges this is a binding financial commitment with no refund provisions.`,
        keyObligations: [
          'Provide valid tax identification',
          'Submit invoices with supporting documentation',
          'Comply with all tax obligations',
        ],
        liabilityClauses: [
          'No interest on late payments beyond contractual terms',
          'Contractor cannot claim additional funds post-completion',
        ],
        terminationConditions: [
          'Contractor can terminate if payment delayed >30 days',
        ],
      },
      {
        sectionNumber: '6',
        title: 'Termination and Dispute Resolution',
        content: `This Contract may be terminated by mutual written agreement. In case of dispute, both parties agree to arbitration in Jakarta per Indonesian Arbitration Rules. Termination triggers final accounting of all expenses and liabilities. Any unresolved disputes shall be escalated to court jurisdiction in Central Jakarta District Court.`,
        keyObligations: [
          'Notice of termination: 14 days written notice',
          'Final accounting due within 30 days',
          'Return all Project Owner property',
        ],
        liabilityClauses: [
          'Contractor not liable for delays beyond reasonable control',
          'Project Owner not liable if regulatory change makes work impossible',
        ],
        terminationConditions: [
          'Either party can terminate for material breach with 30-day cure period',
          'Immediate termination for safety violations or fraudulent activity',
        ],
      },
    ];
  }

  /**
   * Get acknowledgement checklist items
   */
  async getAcknowledgementChecklist(contractId: string, userId: string): Promise<AcknowledgementChecklistDto[]> {
    await this.verifyIntentDeclared(userId);

    return [
      {
        itemId: 'check_1',
        text: 'I have read and understood the complete contract summary',
        description: 'You must review and understand the key terms, contract value, and duration',
        isCritical: true,
        referenceSectionId: '2',
      },
      {
        itemId: 'check_2',
        text: 'I have reviewed the complete project timeline with all phases and potential delays',
        description: 'You must understand all project phases, timelines, and risk of delays',
        isCritical: true,
        referenceSectionId: '1',
      },
      {
        itemId: 'check_3',
        text: 'I understand all identified risks and their potential financial/timeline impact',
        description: 'You must acknowledge the risk analysis and potential consequences',
        isCritical: true,
        referenceSectionId: '3',
      },
      {
        itemId: 'check_4',
        text: 'I have reviewed simulation scenarios including best, realistic, and worst cases',
        description: 'You must understand various outcomes and their probabilities',
        isCritical: true,
        referenceSectionId: '2',
      },
      {
        itemId: 'check_5',
        text: 'I have read all legal contract sections and understand my obligations',
        description: 'You must read and accept all legal terms, liability, and termination conditions',
        isCritical: true,
        referenceSectionId: '4',
      },
      {
        itemId: 'check_6',
        text: 'I understand there is a 48-hour cooling off period before funds are locked',
        description: 'After all acknowledgements, a 48-hour cooling off period applies. You can still cancel during this period.',
        isCritical: true,
        referenceSectionId: '5',
      },
      {
        itemId: 'check_7',
        text: 'I explicitly confirm I am ready to proceed and lock funds',
        description: 'This is a binding commitment. After cooldown expires, funds will be locked and cannot be recovered without legal intervention.',
        isCritical: true,
        referenceSectionId: '6',
      },
    ];
  }

  /**
   * Record acknowledgements
   */
  async acknowledgeContract(userId: string, dto: AcknowledgeContractDto): Promise<ContractReviewStatusDto> {
    // Verify intent first
    await this.verifyIntentDeclared(userId);

    // Validate all acknowledgements are true
    if (!dto.ackSummary || !dto.ackTimeline || !dto.ackRisks || !dto.ackSimulation || !dto.ackLegalText || !dto.ackChecklist || !dto.ackCooldown) {
      throw new BadRequestException(
        'Semua item harus diakui (tanda tangan) sebelum melanjutkan. Tidak dapat melewatkan atau menolak item apapun.',
      );
    }

    // Calculate cooldown end time (48 hours from now)
    const now = Date.now();
    const cooldownEndTime = now + this.COOLDOWN_PERIOD_MS;

    // Store acknowledgement
    const acknowledgement: ReviewAcknowledgement = {
      id: crypto.randomUUID(),
      contractId: dto.contractId,
      userId,
      ackSummary: dto.ackSummary,
      ackTimeline: dto.ackTimeline,
      ackRisks: dto.ackRisks,
      ackSimulation: dto.ackSimulation,
      ackLegalText: dto.ackLegalText,
      ackChecklist: dto.ackChecklist,
      cooldownEndTime,
      allAcknowledged: true,
      acknowledgedAt: new Date(),
      createdAt: new Date(),
    };

    // Log to audit trail (immutable)
    await this.audit.log({
      action: 'CONTRACT_REVIEW_ACKNOWLEDGED',
      entityType: 'ContractReview',
      entityId: dto.contractId,
      userId,
      description: JSON.stringify({
        allAcknowledged: true,
        cooldownEndTime: new Date(cooldownEndTime),
        ackFlags: {
          ackSummary: dto.ackSummary,
          ackTimeline: dto.ackTimeline,
          ackRisks: dto.ackRisks,
          ackSimulation: dto.ackSimulation,
          ackLegalText: dto.ackLegalText,
          ackChecklist: dto.ackChecklist,
        },
      }),
    });

    return this.getContractReviewStatus(dto.contractId, userId);
  }

  /**
   * Get current review status
   */
  async getContractReviewStatus(contractId: string, userId: string): Promise<ContractReviewStatusDto> {
    await this.verifyIntentDeclared(userId);

    // In production, fetch from database
    // For now, check audit log for acknowledgement
    const acknowledgement = await this.prisma.auditLog.findFirst({
      where: {
        userId,
        entityId: contractId,
        action: 'CONTRACT_REVIEW_ACKNOWLEDGED',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!acknowledgement) {
      return {
        contractId,
        state: 'PRE_CONTRACT_REVIEW',
        ackSummary: false,
        ackTimeline: false,
        ackRisks: false,
        ackSimulation: false,
        ackLegalText: false,
        ackChecklist: false,
        allAcknowledged: false,
        cooldownEndTime: 0,
        cooldownCompleted: false,
        canProceedToLock: false,
        reason: 'Silakan akui semua item untuk melanjutkan',
        acknowledgedAt: new Date(0), // Default epoch date instead of null
        acknowledgementHistory: [],
      };
    }

    // Parse acknowledgement description
    let ackData: any = {};
    try {
      ackData = JSON.parse(acknowledgement.description || '{}');
    } catch {
      // Description is not JSON
    }

    const cooldownEndTime = ackData?.cooldownEndTime || Date.now();
    const now = Date.now();
    const cooldownCompleted = now > new Date(cooldownEndTime).getTime();

    return {
      contractId,
      state: 'PRE_CONTRACT_REVIEW',
      ackSummary: ackData?.ackFlags?.ackSummary || false,
      ackTimeline: ackData?.ackFlags?.ackTimeline || false,
      ackRisks: ackData?.ackFlags?.ackRisks || false,
      ackSimulation: ackData?.ackFlags?.ackSimulation || false,
      ackLegalText: ackData?.ackFlags?.ackLegalText || false,
      ackChecklist: ackData?.ackFlags?.ackChecklist || false,
      allAcknowledged: ackData?.allAcknowledged || false,
      cooldownEndTime: new Date(cooldownEndTime).getTime(),
      cooldownCompleted,
      canProceedToLock: cooldownCompleted && ackData?.allAcknowledged,
      reason: cooldownCompleted
        ? 'Siap untuk mengunci dana dan melanjutkan'
        : `Periode pendinginan berakhir dalam ${Math.ceil((new Date(cooldownEndTime).getTime() - now) / 1000 / 60 / 60)} jam`,
      acknowledgedAt: acknowledgement.createdAt,
      acknowledgementHistory: [
        {
          timestamp: acknowledgement.createdAt,
          flag: 'ALL_ACKNOWLEDGED',
          status: ackData?.allAcknowledged || false,
        },
      ],
    };
  }

  /**
   * Approve pre-contract and transition to CONTRACT_ACTIVE_LOCKED
   */
  async approvePreContractAndLock(userId: string, dto: ApprovePreContractDto): Promise<ContractReviewStatusDto> {
    // Verify intent
    await this.verifyIntentDeclared(userId);

    // Verify all requirements met
    const status = await this.getContractReviewStatus(dto.contractId, userId);

    if (!status.allAcknowledged) {
      throw new ForbiddenException('Semua item harus diakui terlebih dahulu');
    }

    if (!status.cooldownCompleted) {
      throw new ForbiddenException(
        `Periode pendinginan masih berlaku. Tunggu hingga ${new Date(status.cooldownEndTime).toISOString()}`,
      );
    }

    if (!dto.confirmProceedToLock) {
      throw new BadRequestException('Anda harus secara eksplisit mengkonfirmasi untuk mengunci dana');
    }

    // Lock funds - record in audit log and prepare for smart contract call
    await this.audit.log({
      action: 'CONTRACT_PRE_APPROVED_LOCK_INITIATED',
      entityType: 'ContractReview',
      entityId: dto.contractId,
      userId,
      description: JSON.stringify({
        allAcknowledged: dto.allAcknowledged,
        cooldownCompleted: dto.cooldownCompleted,
        confirmProceedToLock: dto.confirmProceedToLock,
        lockedAt: new Date(),
        state: 'CONTRACT_ACTIVE_LOCKED',
      }),
    });

    return {
      ...status,
      state: 'CONTRACT_ACTIVE_LOCKED',
      canProceedToLock: false,
      reason: 'Dana telah berhasil dikunci. Kontrak aktif dan akan dilanjutkan ke tahap pembayaran.',
    };
  }

  /**
   * Helper: Verify intent declared
   */
  private async verifyIntentDeclared(userId: string): Promise<void> {
    const hasIntent = await this.prisma.auditLog.findFirst({
      where: {
        userId,
        action: 'INTENT_DECLARED',
      },
    });

    if (!hasIntent) {
      throw new ForbiddenException('Intent belum dideklarasikan. Silakan selesaikan State 0 terlebih dahulu.');
    }
  }

  /**
   * Helper: Get mock contract for demo
   */
  private getMockContract(contractId: string, userId: string): ContractDraft {
    return {
      contractId,
      userId,
      title: 'Konstruksi Gedung Kantor 5 Lantai - Jakarta',
      description: 'Proyek konstruksi gedung kantor modern berlokasi di Sudirman, Jakarta. Mencakup struktur beton bertulang, finishing interior, dan sistem MEP lengkap.',
      totalValue: 10000000000, // IDR 10 Billion
      numberOfTerms: 3,
      durationDays: 180,
      contractText: 'Full legal contract text here...',
      parameters: {
        contractor: 'PT. Bangunan Maju Indonesia',
        projectOwner: 'PT. Gedung Modern Abadi',
        contractValue: 10000000000,
        currency: 'IDR',
        startDate: '2026-02-01',
        completionDate: '2026-08-30',
        numberOfTerms: 3,
        jurisdiction: 'Jakarta',
        governingLaw: 'Indonesian Law',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
