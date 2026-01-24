import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsBoolean } from 'class-validator';

export enum UserRole {
  INVESTOR = 'INVESTOR',
  OPERATOR = 'OPERATOR',
  AUDITOR = 'AUDITOR',
  SYSTEM = 'SYSTEM',
}

export class DeclareIntentDto {
  @ApiProperty({
    enum: UserRole,
    description: 'User role - must be one of INVESTOR, OPERATOR, AUDITOR, or SYSTEM',
    example: 'INVESTOR',
  })
  @IsEnum(UserRole, {
    message: 'Role harus salah satu dari: INVESTOR, OPERATOR, AUDITOR, atau SYSTEM',
  })
  role: UserRole;

  @ApiProperty({
    type: Boolean,
    description: 'User confirms they have been KYC verified',
    example: true,
  })
  @IsBoolean({ message: 'KYC verification status harus boolean' })
  @IsNotEmpty({ message: 'KYC verification status tidak boleh kosong' })
  kycVerified: boolean;

  @ApiProperty({
    type: Boolean,
    description: 'User accepts platform jurisdiction and rules',
    example: true,
  })
  @IsBoolean({ message: 'Acceptance of terms harus boolean' })
  @IsNotEmpty({ message: 'Acceptance of terms tidak boleh kosong' })
  acceptTerms: boolean;

  @ApiProperty({
    type: Boolean,
    description: 'User confirms legal capacity to enter contracts',
    example: true,
  })
  @IsBoolean({ message: 'Legal capacity confirmation harus boolean' })
  @IsNotEmpty({ message: 'Legal capacity confirmation tidak boleh kosong' })
  confirmsLegalCapacity: boolean;
}

export class DeclareIntentResponseDto {
  @ApiProperty({
    description: 'Whether intent declaration was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Current verification status',
    example: 'INTENT_DECLARED',
  })
  verificationStatus: string;

  @ApiProperty({
    description: 'User role confirmed',
    example: 'INVESTOR',
  })
  role: UserRole;

  @ApiProperty({
    description: 'Timestamp of intent declaration',
    example: '2025-01-24T10:30:00Z',
  })
  declarationTimestamp: Date;

  @ApiProperty({
    description: 'Message describing the result',
    example: 'Intent berhasil dideklarasikan. Anda dapat melanjutkan ke tahap review.',
  })
  message: string;
}

export class GetIntentStatusDto {
  @ApiProperty({
    description: 'User ID',
    example: 'user_123',
  })
  userId: string;

  @ApiProperty({
    description: 'Current intent status',
    example: 'INTENT_DECLARED',
  })
  status: string;

  @ApiProperty({
    description: 'User role',
    example: 'INVESTOR',
  })
  role: UserRole;

  @ApiProperty({
    description: 'Whether KYC is verified',
    example: true,
  })
  kycVerified: boolean;

  @ApiProperty({
    description: 'Whether terms are accepted',
    example: true,
  })
  acceptedTerms: boolean;

  @ApiProperty({
    description: 'Whether legal capacity confirmed',
    example: true,
  })
  confirmedLegalCapacity: boolean;

  @ApiProperty({
    description: 'Declaration timestamp',
    example: '2025-01-24T10:30:00Z',
  })
  declarationTimestamp: Date;

  @ApiProperty({
    description: 'Can proceed to next state',
    example: true,
  })
  canProceedToReview: boolean;
}
