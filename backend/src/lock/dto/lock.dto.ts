import { IsNotEmpty, IsString, IsNumber, IsBoolean, IsUUID, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO: Request to lock contract funds
 */
export class LockFundsDto {
  @ApiProperty({
    example: 'contract-uuid-123',
    description: 'Unique contract identifier',
  })
  @IsNotEmpty({ message: 'Contract ID tidak boleh kosong' })
  @IsString({ message: 'Contract ID harus berupa string' })
  contractId: string;

  @ApiProperty({
    example: true,
    description: 'Explicit confirmation to lock funds',
  })
  @IsNotEmpty({ message: 'Konfirmasi tidak boleh kosong' })
  @IsBoolean({ message: 'Konfirmasi harus berupa boolean' })
  confirmLockFunds: boolean;

  @ApiProperty({
    example: 10000000000,
    description: 'Amount to lock in smallest currency unit (rupiah)',
  })
  @IsNotEmpty({ message: 'Jumlah tidak boleh kosong' })
  @IsNumber({}, { message: 'Jumlah harus berupa angka' })
  amount: number;
}

/**
 * DTO: Get contract state
 */
export class ContractStateDto {
  @ApiProperty({
    example: 'CONTRACT_ACTIVE_LOCKED',
    description: 'Current state of the contract',
  })
  state: 'INTENT_DECLARED' | 'PRE_CONTRACT_REVIEW' | 'CONTRACT_ACTIVE_LOCKED' | 'OPERATION_RUNNING';

  @ApiProperty({
    example: 10000000000,
    description: 'Amount locked in escrow (IDR)',
  })
  lockedAmount: number;

  @ApiProperty({
    example: '2026-01-24T10:30:00Z',
    description: 'ISO timestamp when funds were locked',
  })
  lockTimestamp: Date | null;

  @ApiProperty({
    example: '0x1234567890abcdef',
    description: 'Smart contract transaction hash',
  })
  lockingTxHash: string | null;

  @ApiProperty({
    example: 1,
    description: 'Current milestone/term number',
  })
  currentMilestone: number;

  @ApiProperty({
    example: 'WAITING_FOR_OPERATION_START',
    description: 'Substatus describing next action',
  })
  substatus: string;

  @ApiProperty({
    example: true,
    description: 'Whether funds are currently locked',
  })
  isFundsLocked: boolean;

  @ApiProperty({
    example: '2026-02-01',
    description: 'Expected operation start date (deadline)',
  })
  operationStartDate: string | null;

  @ApiProperty({
    example: 'Contractor',
    description: 'Who is responsible for next action',
  })
  nextResponsibleParty: string | null;

  @ApiProperty({
    description: 'Rights and obligations for each party',
  })
  rightsObligations: {
    contractor: string[];
    projectOwner: string[];
  };
}

/**
 * DTO: Locked status card information
 */
export class LockedStatusCardDto {
  @ApiProperty({
    example: 10000000000,
    description: 'Amount locked (IDR)',
  })
  lockedAmount: number;

  @ApiProperty({
    example: '2026-01-24T10:30:00Z',
    description: 'Lock timestamp',
  })
  lockTimestamp: Date;

  @ApiProperty({
    example: '0x1234567890abcdef',
    description: 'Transaction hash',
  })
  transactionHash: string;

  @ApiProperty({
    example: 'https://etherscan.io/tx/0x...',
    description: 'Link to blockchain explorer',
  })
  explorerLink: string;

  @ApiProperty({
    example: 'ESCROW_HELD',
    description: 'Current holding status',
  })
  holdingStatus: 'ESCROW_HELD' | 'PARTIAL_RELEASED' | 'FULLY_RELEASED';

  @ApiProperty({
    example: 100,
    description: 'Percentage of funds held (0-100)',
  })
  percentageHeld: number;
}

/**
 * DTO: Rights and obligations information
 */
export class RightObligationItemDto {
  @ApiProperty({
    example: 'RI-001',
    description: 'Item reference ID',
  })
  itemId: string;

  @ApiProperty({
    example: 'right',
    description: 'Type: right or obligation',
  })
  type: 'right' | 'obligation';

  @ApiProperty({
    example: 'Contractor',
    description: 'Party this item applies to',
  })
  party: 'Contractor' | 'ProjectOwner';

  @ApiProperty({
    example: 'Access to construction site',
    description: 'Description of right or obligation',
  })
  description: string;

  @ApiProperty({
    example: 'Must be provided throughout contract execution',
    description: 'Details and conditions',
  })
  details: string;

  @ApiProperty({
    example: 'critical',
    description: 'Importance level',
  })
  importance: 'low' | 'medium' | 'high' | 'critical';

  @ApiProperty({
    example: 'Section 3.2',
    description: 'Reference to contract section',
  })
  contractReference: string;
}

/**
 * DTO: Next condition/action information
 */
export class NextConditionDto {
  @ApiProperty({
    example: 'OPERATION_START_REQUIRED',
    description: 'What action is required next',
  })
  actionRequired: string;

  @ApiProperty({
    example: 'Contractor',
    description: 'Who is responsible for this action',
  })
  responsibleParty: string;

  @ApiProperty({
    example: 'Contractor must submit operation start confirmation',
    description: 'Description of action',
  })
  description: string;

  @ApiProperty({
    example: '2026-02-01',
    description: 'Deadline for action (ISO date)',
  })
  deadline: string;

  @ApiProperty({
    example: 5,
    description: 'Days remaining until deadline',
  })
  daysRemaining: number;

  @ApiProperty({
    example: 'If not completed by deadline, contract may be terminated',
    description: 'Consequence of missing deadline',
  })
  consequence: string;

  @ApiProperty({
    example: false,
    description: 'Whether this action is overdue',
  })
  isOverdue: boolean;

  @ApiProperty({
    example: true,
    description: 'Whether this action is blocking state transition',
  })
  isBlocking: boolean;
}

/**
 * DTO: Response from lock funds endpoint
 */
export class LockFundsResponseDto {
  @ApiProperty({
    example: true,
    description: 'Success flag',
  })
  success: boolean;

  @ApiProperty({
    example: 'Dana berhasil dikunci dalam escrow',
    description: 'Status message in Indonesian',
  })
  message: string;

  @ApiProperty({
    description: 'Current contract state after locking',
  })
  data: ContractStateDto;

  @ApiProperty({
    example: null,
    description: 'Error message if any',
  })
  error?: string | null;

  @ApiProperty({
    example: '2026-01-24T10:30:00Z',
    description: 'API response timestamp',
  })
  timestamp: Date;
}

/**
 * DTO: Response from get contract state endpoint
 */
export class ContractStateResponseDto {
  @ApiProperty({
    example: true,
    description: 'Success flag',
  })
  success: boolean;

  @ApiProperty({
    example: 'Status kontrak berhasil diambil',
    description: 'Message',
  })
  message: string;

  @ApiProperty({
    description: 'Contract state information',
  })
  data: ContractStateDto;

  @ApiProperty({
    example: null,
    description: 'Error message',
  })
  error?: string | null;

  @ApiProperty({
    example: '2026-01-24T10:30:00Z',
    description: 'Timestamp',
  })
  timestamp: Date;
}

/**
 * DTO: Get locked status for card display
 */
export class GetLockedStatusDto {
  @ApiProperty({
    example: 'contract-uuid-123',
    description: 'Contract ID',
  })
  @IsNotEmpty({ message: 'Contract ID tidak boleh kosong' })
  @IsString()
  contractId: string;
}

/**
 * DTO: Get rights and obligations
 */
export class GetRightsObligationsDto {
  @ApiProperty({
    example: 'contract-uuid-123',
    description: 'Contract ID',
  })
  @IsNotEmpty()
  @IsString()
  contractId: string;

  @ApiProperty({
    example: 'Contractor',
    description: 'Filter by party (optional)',
  })
  party?: 'Contractor' | 'ProjectOwner';
}

/**
 * DTO: Get next condition
 */
export class GetNextConditionDto {
  @ApiProperty({
    example: 'contract-uuid-123',
    description: 'Contract ID',
  })
  @IsNotEmpty()
  @IsString()
  contractId: string;
}
