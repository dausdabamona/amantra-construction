import { Injectable, BadRequestException, ForbiddenException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { JwtPayload } from '../common/jwt-payload.interface';

/**
 * Global enum - shared with Smart Contract and Frontend
 */
export enum ContractState {
  INTENT_DECLARED = 0,
  PRE_CONTRACT_REVIEW = 1,
  CONTRACT_ACTIVE_LOCKED = 2,
  OPERATION_RUNNING = 3,
  EVALUATION_AND_CALCULATION = 4,
  RIGHTS_FINALIZED_AND_DISTRIBUTION = 5,
  CONTRACT_CLOSED_AND_ARCHIVED = 6,
  EXCEPTION_AND_FORCE_MAJEURE = 9,
}

/**
 * State transition metadata
 */
interface TransitionMetadata {
  previousState: ContractState;
  newState: ContractState;
  timestamp: Date;
  initiatedBy: string;
  guardConditions: Record<string, boolean>;
  automatic: boolean;
}

/**
 * Acknowledgment record
 */
interface AcknowledgmentRecord {
  userId: string;
  acknowledgedAt: Date;
  ipAddress: string;
  documentHash: string;
}

@Injectable()
export class ContractStateService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  // ============================================
  // STATE QUERIES
  // ============================================

  /**
   * Get current contract state
   */
  async getContractState(contractId: string): Promise<ContractState> {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      select: { status: true },
    });

    if (!contract) {
      throw new BadRequestException('Contract not found');
    }

    return this._stringToState(contract.status);
  }

  /**
   * Get full state data with context
   */
  async getContractStateContext(contractId: string, user: JwtPayload) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        project: {
          include: {
            owner: { select: { id: true, name: true, email: true } },
            contractor: { select: { id: true, name: true, email: true } },
            supervisor: { select: { id: true, name: true, email: true } },
            witness: { select: { id: true, name: true, email: true } },
          },
        },
        terms: true,
      },
    });

    if (!contract) {
      throw new BadRequestException('Contract not found');
    }

    const currentState = this._stringToState(contract.status);
    const stateMetadata = this._getStateMetadata(currentState);

    return {
      contractId,
      currentState: this._stateToString(currentState),
      stateMetadata,
      project: contract.project,
      terms: contract.terms,
      transitions: await this._getTransitionHistory(contractId),
    };
  }

  // ============================================
  // STATE TRANSITIONS (GUARDED)
  // ============================================

  /**
   * Transition: INTENT_DECLARED (0) → PRE_CONTRACT_REVIEW (1)
   * Guard: Both parties signed intent, documents uploaded
   */
  async transitionToReview(contractId: string, user: JwtPayload) {
    const contract = await this._verifyContractAccess(contractId, user);
    
    // Guard: Current state must be INTENT_DECLARED
    const currentState = this._stringToState(contract.status);
    if (currentState !== ContractState.INTENT_DECLARED) {
      throw new BadRequestException(
        `Invalid state transition. Current: ${this._stateToString(currentState)}, Expected: INTENT_DECLARED`
      );
    }

    // Guard: Both parties must have signed
    if (!contract.ownerApproved || !contract.contractorApproved) {
      throw new ForbiddenException('Both owner and contractor must approve intent');
    }

    // Guard: Documents must be uploaded
    const documents = await this.prisma.auditLog.count({
      where: {
        entityId: contractId,
        action: 'DOCUMENT_UPLOADED',
      },
    });
    
    if (documents === 0) {
      throw new BadRequestException('All required documents must be uploaded');
    }

    // Guard: Must be within 7 days of creation
    const createdAt = new Date(contract.createdAt).getTime();
    const now = Date.now();
    if (now - createdAt > 7 * 24 * 60 * 60 * 1000) {
      throw new UnprocessableEntityException('Intent expired (7 days)');
    }

    // Transition
    await this.prisma.contract.update({
      where: { id: contractId },
      data: { status: this._stateToString(ContractState.PRE_CONTRACT_REVIEW) },
    });

    await this._recordTransition(contractId, currentState, ContractState.PRE_CONTRACT_REVIEW, user.sub, {
      bothPartiesSigned: true,
      documentsUploaded: true,
      intentValid: true,
    });

    await this.auditService.log({
      action: 'STATE_TRANSITION',
      entityType: 'Contract',
      entityId: contractId,
      description: `Contract transitioned to PRE_CONTRACT_REVIEW by ${user.email}`,
      userId: user.sub,
    });
  }

  /**
   * Transition: PRE_CONTRACT_REVIEW (1) → CONTRACT_ACTIVE_LOCKED (2)
   * Guard: Legal approval, mutual signature, mutual acknowledgment
   * Critical: Starts 48-hour mandatory cooldown
   */
  async lockContract(contractId: string, user: JwtPayload) {
    const contract = await this._verifyContractAccess(contractId, user);

    const currentState = this._stringToState(contract.status);
    if (currentState !== ContractState.PRE_CONTRACT_REVIEW) {
      throw new BadRequestException(
        `Invalid state transition. Current: ${this._stateToString(currentState)}, Expected: PRE_CONTRACT_REVIEW`
      );
    }

    // Guard: Legal approval must exist
    const legalApproval = await this.prisma.auditLog.findFirst({
      where: {
        entityId: contractId,
        action: 'LEGAL_APPROVAL',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!legalApproval) {
      throw new ForbiddenException('Legal approval required before locking contract');
    }

    // Guard: Both parties must have acknowledged final terms
    const ownerAck = await this._hasAcknowledged(contractId, contract.project.ownerId);
    const contractorAck = await this._hasAcknowledged(contractId, contract.project.contractorId ?? '');

    if (!ownerAck || !contractorAck) {
      throw new ForbiddenException('Both parties must acknowledge final terms');
    }

    // Guard: Mutual approval
    if (!contract.ownerApproved || !contract.contractorApproved) {
      throw new ForbiddenException('Mutual approval required');
    }

    // Transition
    const lockedAt = new Date();
    const cooldownExpiresAt = new Date(lockedAt.getTime() + 48 * 60 * 60 * 1000); // 48 hours

    await this.prisma.contract.update({
      where: { id: contractId },
      data: {
        status: this._stateToString(ContractState.CONTRACT_ACTIVE_LOCKED),
        lockedAt,
        cooldownExpiresAt,
      },
    });

    await this._recordTransition(contractId, currentState, ContractState.CONTRACT_ACTIVE_LOCKED, user.sub, {
      legalApprovalProvided: true,
      mutualApproval: true,
      acknowledgementsProvided: true,
      cooldownStarted: true,
    });

    await this.auditService.log({
      action: 'CONTRACT_LOCKED',
      entityType: 'Contract',
      entityId: contractId,
      description: `Contract locked by ${user.email}. Cooldown expires at ${cooldownExpiresAt.toISOString()}`,
      userId: user.sub,
    });
  }

  /**
   * Transition: CONTRACT_ACTIVE_LOCKED (2) → OPERATION_RUNNING (3)
   * Guard: CRITICAL - Cooldown MUST be expired (48 hours minimum)
   */
  async startExecution(contractId: string, user: JwtPayload) {
    const contract = await this._verifyContractAccess(contractId, user);
    const currentState = this._stringToState(contract.status);

    if (currentState !== ContractState.CONTRACT_ACTIVE_LOCKED) {
      throw new BadRequestException(
        `Invalid state transition. Current: ${this._stateToString(currentState)}, Expected: CONTRACT_ACTIVE_LOCKED`
      );
    }

    // Guard: Cooldown MUST be expired
    if (!contract.cooldownExpiresAt) {
      throw new UnprocessableEntityException('Cooldown timer not initialized');
    }

    const now = new Date();
    if (now < contract.cooldownExpiresAt) {
      const remainingMs = contract.cooldownExpiresAt.getTime() - now.getTime();
      const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));
      throw new ForbiddenException(
        `Cooldown period still active. Expires in ${remainingHours} hours. ` +
        `Cannot execute before ${contract.cooldownExpiresAt.toISOString()}`
      );
    }

    // Transition
    const executionStartedAt = new Date();
    await this.prisma.contract.update({
      where: { id: contractId },
      data: {
        status: this._stateToString(ContractState.OPERATION_RUNNING),
        executionStartedAt,
      },
    });

    await this._recordTransition(contractId, currentState, ContractState.OPERATION_RUNNING, user.sub, {
      cooldownExpired: true,
      executionAuthorized: true,
    });

    await this.auditService.log({
      action: 'EXECUTION_STARTED',
      entityType: 'Contract',
      entityId: contractId,
      description: `Contract execution started by ${user.email}`,
      userId: user.sub,
    });
  }

  /**
   * Transition: OPERATION_RUNNING (3) → EVALUATION_AND_CALCULATION (4)
   * Automatic or manual trigger on completion
   */
  async submitForEvaluation(contractId: string, user: JwtPayload) {
    const contract = await this._verifyContractAccess(contractId, user);
    const currentState = this._stringToState(contract.status);

    if (currentState !== ContractState.OPERATION_RUNNING) {
      throw new BadRequestException(
        `Invalid state transition. Current: ${this._stateToString(currentState)}, Expected: OPERATION_RUNNING`
      );
    }

    // Guard: All milestones must be completed or deadline reached
    const incompleteTerms = await this.prisma.term.count({
      where: {
        contractId,
        status: {
          notIn: ['PAID', 'COMPLETED', 'VERIFIED'],
        },
      },
    });

    if (incompleteTerms > 0) {
      throw new BadRequestException('All milestones must be completed before evaluation');
    }

    const evaluationStartedAt = new Date();
    await this.prisma.contract.update({
      where: { id: contractId },
      data: {
        status: this._stateToString(ContractState.EVALUATION_AND_CALCULATION),
        evaluationStartedAt,
      },
    });

    await this._recordTransition(contractId, currentState, ContractState.EVALUATION_AND_CALCULATION, user.sub, {
      allMilestonesCompleted: true,
      evaluationTriggered: true,
    });

    await this.auditService.log({
      action: 'EVALUATION_INITIATED',
      entityType: 'Contract',
      entityId: contractId,
      description: `Contract submitted for evaluation by ${user.email}`,
      userId: user.sub,
    });
  }

  /**
   * Transition: EVALUATION_AND_CALCULATION (4) → RIGHTS_FINALIZED_AND_DISTRIBUTION (5)
   */
  async finalizeRights(contractId: string, user: JwtPayload) {
    const contract = await this._verifyContractAccess(contractId, user);
    const currentState = this._stringToState(contract.status);

    if (currentState !== ContractState.EVALUATION_AND_CALCULATION) {
      throw new BadRequestException(
        `Invalid state transition. Current: ${this._stateToString(currentState)}, Expected: EVALUATION_AND_CALCULATION`
      );
    }

    // Guard: Evaluation window active (10 days)
    const evaluationWindow = 10 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    if (contract.evaluationStartedAt && now - contract.evaluationStartedAt.getTime() > evaluationWindow) {
      throw new UnprocessableEntityException('Evaluation window expired (10 days)');
    }

    await this.prisma.contract.update({
      where: { id: contractId },
      data: {
        status: this._stateToString(ContractState.RIGHTS_FINALIZED_AND_DISTRIBUTION),
      },
    });

    await this._recordTransition(contractId, currentState, ContractState.RIGHTS_FINALIZED_AND_DISTRIBUTION, user.sub, {
      calculationsCompleted: true,
      rightsFinalized: true,
    });

    await this.auditService.log({
      action: 'RIGHTS_FINALIZED',
      entityType: 'Contract',
      entityId: contractId,
      description: `Rights finalized and distribution prepared by ${user.email}`,
      userId: user.sub,
    });
  }

  /**
   * Transition: RIGHTS_FINALIZED_AND_DISTRIBUTION (5) → CONTRACT_CLOSED_AND_ARCHIVED (6)
   * TERMINAL STATE - No further transitions possible
   * Guard: Distribution must be complete (all transactions confirmed)
   */
  async closeContract(contractId: string, user: JwtPayload) {
    const contract = await this._verifyContractAccess(contractId, user);
    const currentState = this._stringToState(contract.status);

    if (currentState !== ContractState.RIGHTS_FINALIZED_AND_DISTRIBUTION) {
      throw new BadRequestException(
        `Invalid state transition. Current: ${this._stateToString(currentState)}, Expected: RIGHTS_FINALIZED_AND_DISTRIBUTION`
      );
    }

    // Guard: Check distribution completion
    const finalRights = await this.prisma.finalRights.findUnique({ where: { contractId } });
    if (!finalRights) {
      throw new ForbiddenException('Hak final belum disiapkan. Selesaikan distribusi terlebih dahulu.');
    }

    if (finalRights.txStatus !== 'CONFIRMED') {
      throw new ForbiddenException('Distribusi belum sepenuhnya dikonfirmasi. Tunggu konfirmasi semua transfer.');
    }

    // Guard: Check no active objections
    const evaluation = await this.prisma.evaluationRecord.findUnique({ where: { contractId } });
    if (evaluation && ['SUBMITTED', 'UNDER_REVIEW'].includes(evaluation.objectionStatus)) {
      throw new ForbiddenException('Masih ada keberatan yang aktif. Selesaikan sebelum menutup kontrak.');
    }

    const closedAt = new Date();
    await this.prisma.contract.update({
      where: { id: contractId },
      data: {
        status: this._stateToString(ContractState.CONTRACT_CLOSED_AND_ARCHIVED),
        closedAt,
      },
    });

    await this._recordTransition(contractId, currentState, ContractState.CONTRACT_CLOSED_AND_ARCHIVED, user.sub, {
      allDistributionComplete: true,
      contractArchived: true,
      finalRightsFrozen: true,
    });

    await this.auditService.log({
      action: 'CONTRACT_ARCHIVED',
      entityType: 'Contract',
      entityId: contractId,
      description: `Contract archived and closed by ${user.email}`,
      userId: user.sub,
    });
  }

  /**
   * Emergency transition to State 9: EXCEPTION_AND_FORCE_MAJEURE
   * Accessible from any state except 6 (archived)
   */
  async invokeEmergency(contractId: string, reason: string, user: JwtPayload) {
    const contract = await this._verifyContractAccess(contractId, user);
    const currentState = this._stringToState(contract.status);

    // Guard: Cannot invoke emergency on archived contracts
    if (currentState === ContractState.CONTRACT_CLOSED_AND_ARCHIVED) {
      throw new ForbiddenException('Cannot invoke emergency on archived contract');
    }

    await this.prisma.contract.update({
      where: { id: contractId },
      data: {
        status: this._stateToString(ContractState.EXCEPTION_AND_FORCE_MAJEURE),
      },
    });

    await this._recordTransition(contractId, currentState, ContractState.EXCEPTION_AND_FORCE_MAJEURE, user.sub, {
      emergencyTriggered: true,
    });

    await this.auditService.log({
      action: 'EMERGENCY_INVOKED',
      entityType: 'Contract',
      entityId: contractId,
      description: `Emergency invoked by ${user.email}. Reason: ${reason}`,
      userId: user.sub,
    });
  }

  // ============================================
  // ACKNOWLEDGMENTS
  // ============================================

  /**
   * Party acknowledges contract terms
   */
  async acknowledgeTerms(contractId: string, user: JwtPayload, documentHash: string, ipAddress: string) {
    const contract = await this._verifyContractAccess(contractId, user);

    // Record acknowledgment
    await this.prisma.auditLog.create({
      data: {
        action: 'TERMS_ACKNOWLEDGED',
        entityType: 'Contract',
        entityId: contractId,
        description: JSON.stringify({
          message: `${user.email} acknowledged contract terms. Document hash: ${documentHash}`,
          documentHash,
          ipAddress,
          timestamp: new Date().toISOString(),
        }),
        userId: user.sub,
      },
    });

    return {
      acknowledged: true,
      timestamp: new Date(),
      documentHash,
    };
  }

  // ============================================
  // COOLDOWN MANAGEMENT
  // ============================================

  /**
   * Get cooldown status
   */
  async getCooldownStatus(contractId: string): Promise<{
    isActive: boolean;
    expiresAt: Date | null;
    remainingMs: number;
    remainingHours: number;
  }> {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      select: { cooldownExpiresAt: true },
    });

    if (!contract || !contract.cooldownExpiresAt) {
      return {
        isActive: false,
        expiresAt: null,
        remainingMs: 0,
        remainingHours: 0,
      };
    }

    const now = new Date();
    const remainingMs = Math.max(0, contract.cooldownExpiresAt.getTime() - now.getTime());
    const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));
    const isActive = remainingMs > 0;

    return {
      isActive,
      expiresAt: contract.cooldownExpiresAt,
      remainingMs,
      remainingHours,
    };
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  /**
   * Verify contract access
   */
  private async _verifyContractAccess(contractId: string, user: JwtPayload) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        project: {
          select: {
            ownerId: true,
            contractorId: true,
            supervisorId: true,
            witnessId: true,
          },
        },
      },
    });

    if (!contract) {
      throw new BadRequestException('Contract not found');
    }

    const isAuthorized =
      user.sub === contract.project.ownerId ||
      user.sub === contract.project.contractorId ||
      user.sub === contract.project.supervisorId ||
      user.sub === contract.project.witnessId;

    if (!isAuthorized) {
      throw new ForbiddenException('Not authorized to access this contract');
    }

    return contract;
  }

  /**
   * Check if party has acknowledged
   */
  private async _hasAcknowledged(contractId: string, userId: string): Promise<boolean> {
    const ack = await this.prisma.auditLog.findFirst({
      where: {
        entityId: contractId,
        userId,
        action: 'TERMS_ACKNOWLEDGED',
      },
    });

    return !!ack;
  }

  /**
   * Record state transition
   */
  private async _recordTransition(
    contractId: string,
    fromState: ContractState,
    toState: ContractState,
    userId: string,
    guardConditions: Record<string, boolean>,
  ) {
    const transitionHash = this._hashTransition(contractId, fromState, toState);

    await this.prisma.auditLog.create({
      data: {
        action: 'STATE_TRANSITION',
        entityType: 'Contract',
        entityId: contractId,
        description: JSON.stringify({
          message: `State transition: ${this._stateToString(fromState)} → ${this._stateToString(toState)}`,
          transitionHash,
          fromState: this._stateToString(fromState),
          toState: this._stateToString(toState),
          guardConditions,
          timestamp: new Date().toISOString(),
        }),
        userId,
      },
    });
  }

  /**
   * Get transition history
   */
  private async _getTransitionHistory(contractId: string) {
    return this.prisma.auditLog.findMany({
      where: {
        entityId: contractId,
        action: 'STATE_TRANSITION',
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get state metadata
   */
  private _getStateMetadata(state: ContractState) {
    const metadata: Record<ContractState, any> = {
      [ContractState.INTENT_DECLARED]: {
        rights: ['View draft', 'Propose changes'],
        obligations: ['Submit documents', 'Sign intent'],
        deadline: '7 days',
        responsibleParty: 'Both parties',
        waitingFor: 'Other party signature',
      },
      [ContractState.PRE_CONTRACT_REVIEW]: {
        rights: ['Propose amendments', 'Review legal'],
        obligations: ['Legal review', 'Approve terms'],
        deadline: '14 days',
        responsibleParty: 'Legal team',
        waitingFor: 'Legal sign-off',
      },
      [ContractState.CONTRACT_ACTIVE_LOCKED]: {
        rights: ['Read contract (read-only)'],
        obligations: ['Prepare execution'],
        deadline: '48 hours cooldown',
        responsibleParty: 'Contractor',
        waitingFor: 'Cooldown expiration',
        immutable: true,
      },
      [ContractState.OPERATION_RUNNING]: {
        rights: ['Submit reports', 'Request payment'],
        obligations: ['Execute per schedule'],
        deadline: 'Per milestone schedule',
        responsibleParty: 'Contractor',
        waitingFor: 'Milestone completion',
      },
      [ContractState.EVALUATION_AND_CALCULATION]: {
        rights: ['Review calculations'],
        obligations: ['Compute metrics'],
        deadline: '10 days',
        responsibleParty: 'Evaluator',
        waitingFor: 'Verification completion',
      },
      [ContractState.RIGHTS_FINALIZED_AND_DISTRIBUTION]: {
        rights: ['Execute transfers'],
        obligations: ['Complete settlement'],
        deadline: '5 days',
        responsibleParty: 'Treasury',
        waitingFor: 'Transfer confirmation',
      },
      [ContractState.CONTRACT_CLOSED_AND_ARCHIVED]: {
        rights: ['Read-only archive'],
        obligations: [],
        deadline: 'None',
        responsibleParty: 'None',
        waitingFor: 'None',
        terminal: true,
      },
      [ContractState.EXCEPTION_AND_FORCE_MAJEURE]: {
        rights: ['Invoke protocols'],
        obligations: ['Dispute documentation'],
        deadline: '20 days',
        responsibleParty: 'Either party',
        waitingFor: 'Dispute settlement',
      },
    };

    return metadata[state] || {};
  }

  /**
   * Convert state enum to string
   */
  private _stateToString(state: ContractState): string {
    const stateNames: Record<ContractState, string> = {
      [ContractState.INTENT_DECLARED]: 'INTENT_DECLARED',
      [ContractState.PRE_CONTRACT_REVIEW]: 'PRE_CONTRACT_REVIEW',
      [ContractState.CONTRACT_ACTIVE_LOCKED]: 'CONTRACT_ACTIVE_LOCKED',
      [ContractState.OPERATION_RUNNING]: 'OPERATION_RUNNING',
      [ContractState.EVALUATION_AND_CALCULATION]: 'EVALUATION_AND_CALCULATION',
      [ContractState.RIGHTS_FINALIZED_AND_DISTRIBUTION]: 'RIGHTS_FINALIZED_AND_DISTRIBUTION',
      [ContractState.CONTRACT_CLOSED_AND_ARCHIVED]: 'CONTRACT_CLOSED_AND_ARCHIVED',
      [ContractState.EXCEPTION_AND_FORCE_MAJEURE]: 'EXCEPTION_AND_FORCE_MAJEURE',
    };

    return stateNames[state] || 'UNKNOWN';
  }

  /**
   * Convert string to state enum
   */
  private _stringToState(state: string): ContractState {
    const stateMap: Record<string, ContractState> = {
      INTENT_DECLARED: ContractState.INTENT_DECLARED,
      PRE_CONTRACT_REVIEW: ContractState.PRE_CONTRACT_REVIEW,
      CONTRACT_ACTIVE_LOCKED: ContractState.CONTRACT_ACTIVE_LOCKED,
      OPERATION_RUNNING: ContractState.OPERATION_RUNNING,
      EVALUATION_AND_CALCULATION: ContractState.EVALUATION_AND_CALCULATION,
      RIGHTS_FINALIZED_AND_DISTRIBUTION: ContractState.RIGHTS_FINALIZED_AND_DISTRIBUTION,
      CONTRACT_CLOSED_AND_ARCHIVED: ContractState.CONTRACT_CLOSED_AND_ARCHIVED,
      EXCEPTION_AND_FORCE_MAJEURE: ContractState.EXCEPTION_AND_FORCE_MAJEURE,
    };

    return stateMap[state] || ContractState.INTENT_DECLARED;
  }

  /**
   * Hash transition for immutability verification
   */
  private _hashTransition(contractId: string, fromState: ContractState, toState: ContractState): string {
    const data = `${contractId}${fromState}${toState}${Date.now()}`;
    return Buffer.from(data).toString('hex').substring(0, 64);
  }
}
