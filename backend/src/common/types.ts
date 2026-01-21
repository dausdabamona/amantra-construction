// Manual type definitions to work around Prisma binary issues
// These match the enums defined in prisma/schema.prisma

export enum UserRole {
  OWNER = 'OWNER',
  CONTRACTOR = 'CONTRACTOR',
  SUPERVISOR = 'SUPERVISOR',
  WITNESS = 'WITNESS',
}

export enum TermStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  VERIFIED = 'VERIFIED',
  VALID = 'VALID',
  REJECTED = 'REJECTED',
  PAID = 'PAID',
}

export enum VerificationRole {
  SUPERVISOR = 'SUPERVISOR',
  WITNESS = 'WITNESS',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  READY = 'READY',
  PAID = 'PAID',
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  SUBMIT_PROGRESS = 'SUBMIT_PROGRESS',
  VERIFY_APPROVE = 'VERIFY_APPROVE',
  VERIFY_REJECT = 'VERIFY_REJECT',
  PAYMENT_CONFIRM = 'PAYMENT_CONFIRM',
}
