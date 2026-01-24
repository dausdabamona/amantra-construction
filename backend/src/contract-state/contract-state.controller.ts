import { Controller, Get, Post, Body, Param, UseGuards, Request, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ContractStateService, ContractState } from './contract-state.service';

@ApiTags('contract-state')
@Controller('contract-state')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ContractStateController {
  constructor(private contractStateService: ContractStateService) {}

  // ============================================
  // STATE QUERIES
  // ============================================

  @Get(':contractId/state')
  @ApiOperation({ summary: 'Get current contract state' })
  @ApiResponse({ status: 200, description: 'Current contract state' })
  async getContractState(@Param('contractId') contractId: string) {
    return {
      state: await this.contractStateService.getContractState(contractId),
      timestamp: new Date(),
    };
  }

  @Get(':contractId/context')
  @ApiOperation({ summary: 'Get contract state with full context' })
  @ApiResponse({ status: 200, description: 'Contract state with metadata, rights, obligations' })
  async getContractStateContext(
    @Param('contractId') contractId: string,
    @Request() req: any,
  ) {
    return this.contractStateService.getContractStateContext(contractId, req.user);
  }

  @Get(':contractId/cooldown')
  @ApiOperation({ summary: 'Get cooldown status for locked contract' })
  @ApiResponse({ status: 200, description: 'Cooldown timer details' })
  async getCooldownStatus(@Param('contractId') contractId: string) {
    return this.contractStateService.getCooldownStatus(contractId);
  }

  // ============================================
  // STATE TRANSITIONS
  // ============================================

  @Post(':contractId/transition/to-review')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Transition from INTENT_DECLARED to PRE_CONTRACT_REVIEW',
    description: 'Guards: Both parties signed, documents uploaded, within 7 days',
  })
  @ApiResponse({ status: 200, description: 'Transition successful' })
  @ApiResponse({ status: 400, description: 'Guard condition failed' })
  async transitionToReview(
    @Param('contractId') contractId: string,
    @Request() req: any,
  ) {
    await this.contractStateService.transitionToReview(contractId, req.user);
    return {
      success: true,
      newState: 'PRE_CONTRACT_REVIEW',
      message: 'Contract moved to legal review phase',
      timestamp: new Date(),
    };
  }

  @Post(':contractId/transition/lock')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Transition from PRE_CONTRACT_REVIEW to CONTRACT_ACTIVE_LOCKED',
    description: 'CRITICAL: Starts 48-hour mandatory cooldown. No modifications allowed after this. This action is IRREVERSIBLE after cooldown expires.',
  })
  @ApiResponse({ status: 200, description: 'Contract locked, cooldown started' })
  @ApiResponse({ status: 400, description: 'Guard condition failed' })
  async lockContract(
    @Param('contractId') contractId: string,
    @Request() req: any,
  ) {
    await this.contractStateService.lockContract(contractId, req.user);
    
    const cooldownStatus = await this.contractStateService.getCooldownStatus(contractId);
    
    return {
      success: true,
      newState: 'CONTRACT_ACTIVE_LOCKED',
      message: 'Contract locked. 48-hour mandatory cooldown started.',
      warning: 'NO MODIFICATIONS POSSIBLE - Contract is now immutable',
      cooldown: cooldownStatus,
      timestamp: new Date(),
    };
  }

  @Post(':contractId/transition/start-execution')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Transition from CONTRACT_ACTIVE_LOCKED to OPERATION_RUNNING',
    description: 'CRITICAL GUARD: Cooldown MUST have expired (48 hours minimum)',
  })
  @ApiResponse({ status: 200, description: 'Execution started' })
  @ApiResponse({ status: 403, description: 'Cooldown still active' })
  async startExecution(
    @Param('contractId') contractId: string,
    @Request() req: any,
  ) {
    await this.contractStateService.startExecution(contractId, req.user);
    
    return {
      success: true,
      newState: 'OPERATION_RUNNING',
      message: 'Contract execution started. Operations and milestones now active.',
      timestamp: new Date(),
    };
  }

  @Post(':contractId/transition/submit-for-evaluation')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Transition from OPERATION_RUNNING to EVALUATION_AND_CALCULATION',
    description: 'Guard: All milestones completed',
  })
  @ApiResponse({ status: 200, description: 'Evaluation phase started' })
  async submitForEvaluation(
    @Param('contractId') contractId: string,
    @Request() req: any,
  ) {
    await this.contractStateService.submitForEvaluation(contractId, req.user);
    
    return {
      success: true,
      newState: 'EVALUATION_AND_CALCULATION',
      message: 'Contract submitted for performance evaluation. 10-day window active.',
      evaluationWindow: '10 days',
      timestamp: new Date(),
    };
  }

  @Post(':contractId/transition/finalize-rights')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Transition from EVALUATION_AND_CALCULATION to RIGHTS_FINALIZED_AND_DISTRIBUTION',
    description: 'Finalizes rights, prepares on-chain settlement',
  })
  @ApiResponse({ status: 200, description: 'Rights finalized' })
  async finalizeRights(
    @Param('contractId') contractId: string,
    @Request() req: any,
  ) {
    await this.contractStateService.finalizeRights(contractId, req.user);
    
    return {
      success: true,
      newState: 'RIGHTS_FINALIZED_AND_DISTRIBUTION',
      message: 'Rights finalized. On-chain settlement prepared.',
      timestamp: new Date(),
    };
  }

  @Post(':contractId/transition/close')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Transition from RIGHTS_FINALIZED to CONTRACT_CLOSED_AND_ARCHIVED',
    description: 'TERMINAL STATE - No further transitions possible. Contract is archived.',
  })
  @ApiResponse({ status: 200, description: 'Contract archived' })
  async closeContract(
    @Param('contractId') contractId: string,
    @Request() req: any,
  ) {
    await this.contractStateService.closeContract(contractId, req.user);
    
    return {
      success: true,
      newState: 'CONTRACT_CLOSED_AND_ARCHIVED',
      message: 'Contract archived and closed permanently. Read-only access only.',
      timestamp: new Date(),
    };
  }

  @Post(':contractId/transition/emergency')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Emergency transition to EXCEPTION_AND_FORCE_MAJEURE',
    description: 'Can be triggered from any state except archived. Invokes dispute resolution protocols.',
  })
  @ApiResponse({ status: 200, description: 'Emergency invoked' })
  async invokeEmergency(
    @Param('contractId') contractId: string,
    @Body() body: { reason: string },
    @Request() req: any,
  ) {
    await this.contractStateService.invokeEmergency(contractId, body.reason, req.user);
    
    return {
      success: true,
      newState: 'EXCEPTION_AND_FORCE_MAJEURE',
      message: 'Emergency protocol activated. All operations frozen. Dispute resolution initiated.',
      reason: body.reason,
      disputeWindow: '20 days',
      timestamp: new Date(),
    };
  }

  // ============================================
  // ACKNOWLEDGMENTS
  // ============================================

  @Post(':contractId/acknowledge')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Party acknowledges contract terms',
    description: 'Required before critical transitions like locking contract',
  })
  @ApiResponse({ status: 200, description: 'Acknowledgment recorded' })
  async acknowledgeTerms(
    @Param('contractId') contractId: string,
    @Body() body: { documentHash: string; ipAddress: string },
    @Request() req: any,
  ) {
    const result = await this.contractStateService.acknowledgeTerms(
      contractId,
      req.user,
      body.documentHash,
      body.ipAddress,
    );

    return {
      success: true,
      message: 'Terms acknowledged and recorded immutably',
      ...result,
    };
  }

  // ============================================
  // STATE MACHINE DIAGRAM
  // ============================================

  @Get('/diagram/full')
  @ApiOperation({ summary: 'Get full state machine diagram with all transitions' })
  getStateMachineDiagram() {
    return {
      diagram: `
        0: INTENT_DECLARED
           ↓ [Both sign + docs]
        1: PRE_CONTRACT_REVIEW
           ↓ [Legal approval]
        2: CONTRACT_ACTIVE_LOCKED (48h cooldown mandatory)
           ↓ [Cooldown expired]
        3: OPERATION_RUNNING
           ↓ [All milestones done]
        4: EVALUATION_AND_CALCULATION
           ↓ [Calculations complete]
        5: RIGHTS_FINALIZED_AND_DISTRIBUTION
           ↓ [Distributions complete]
        6: CONTRACT_CLOSED_AND_ARCHIVED (TERMINAL)

        9: EXCEPTION_AND_FORCE_MAJEURE (from any state except 6)
           ↓ [Dispute resolution]
           → 6: CONTRACT_CLOSED_AND_ARCHIVED
      `,
      states: [
        {
          id: 0,
          name: 'INTENT_DECLARED',
          rights: ['View draft', 'Propose changes'],
          obligations: ['Submit docs', 'Sign intent'],
          deadline: '7 days',
        },
        {
          id: 1,
          name: 'PRE_CONTRACT_REVIEW',
          rights: ['Propose amendments'],
          obligations: ['Legal review'],
          deadline: '14 days',
        },
        {
          id: 2,
          name: 'CONTRACT_ACTIVE_LOCKED',
          rights: ['Read contract (read-only)'],
          obligations: ['Prepare execution'],
          deadline: '48h cooldown (mandatory)',
          immutable: true,
        },
        {
          id: 3,
          name: 'OPERATION_RUNNING',
          rights: ['Submit reports'],
          obligations: ['Execute per schedule'],
          deadline: 'Per milestones',
        },
        {
          id: 4,
          name: 'EVALUATION_AND_CALCULATION',
          rights: ['Review calculations'],
          obligations: ['Compute metrics'],
          deadline: '10 days',
        },
        {
          id: 5,
          name: 'RIGHTS_FINALIZED_AND_DISTRIBUTION',
          rights: ['Execute transfers'],
          obligations: ['Complete settlement'],
          deadline: '5 days',
        },
        {
          id: 6,
          name: 'CONTRACT_CLOSED_AND_ARCHIVED',
          rights: ['Read-only archive'],
          obligations: [],
          terminal: true,
        },
        {
          id: 9,
          name: 'EXCEPTION_AND_FORCE_MAJEURE',
          rights: ['Invoke protocols'],
          obligations: ['Dispute documentation'],
          deadline: '20 days',
          emergency: true,
        },
      ],
    };
  }
}
