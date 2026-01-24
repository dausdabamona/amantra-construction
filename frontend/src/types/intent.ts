export enum UserRole {
  INVESTOR = 'INVESTOR',
  OPERATOR = 'OPERATOR',
  AUDITOR = 'AUDITOR',
  SYSTEM = 'SYSTEM',
}

export interface IntentDeclaration {
  userId: string;
  role: UserRole;
  kycVerified: boolean;
  acceptedTerms: boolean;
  confirmedLegalCapacity: boolean;
  declarationTimestamp: Date;
  declarationHash: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface IntentStatus {
  userId: string;
  status: string;
  role: UserRole;
  kycVerified: boolean;
  acceptedTerms: boolean;
  confirmedLegalCapacity: boolean;
  declarationTimestamp: Date;
  canProceedToReview: boolean;
}

export interface DeclareIntentRequest {
  role: UserRole;
  kycVerified: boolean;
  acceptTerms: boolean;
  confirmsLegalCapacity: boolean;
}

export interface DeclareIntentResponse {
  success: boolean;
  verificationStatus: string;
  role: UserRole;
  declarationTimestamp: Date;
  message: string;
}

export interface CheckProceedResponse {
  canProceed: boolean;
  reason: string;
  missingRequirements: string[];
  status: string;
  role: UserRole;
}
