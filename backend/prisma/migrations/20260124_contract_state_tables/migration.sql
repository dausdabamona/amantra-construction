-- Create Contract State Tracking Tables
-- For tracking contract lifecycle, cooldowns, acknowledgments, and transitions

-- ContractStateLog: Immutable log of all state transitions
CREATE TABLE IF NOT EXISTS "ContractStateLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "contractId" TEXT NOT NULL,
  "previousState" INTEGER,
  "newState" INTEGER NOT NULL,
  "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "transitionedBy" TEXT NOT NULL,
  "reason" TEXT,
  "guardConditions" TEXT, -- JSON stringified object with guard check results
  "hash" TEXT, -- SHA256 hash of transition for immutability verification
  
  CONSTRAINT "ContractStateLog_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ContractStateLog_transitionedBy_fkey" FOREIGN KEY ("transitionedBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "ContractStateLog_contractId" ON "ContractStateLog"("contractId");
CREATE INDEX "ContractStateLog_newState" ON "ContractStateLog"("newState");
CREATE INDEX "ContractStateLog_timestamp" ON "ContractStateLog"("timestamp");

-- ContractLockTimeout: Tracks mandatory cooldown periods after locking
CREATE TABLE IF NOT EXISTS "ContractLockTimeout" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "contractId" TEXT NOT NULL UNIQUE,
  "lockedAt" DATETIME NOT NULL,
  "cooldownExpiresAt" DATETIME NOT NULL, -- 48 hours after lockedAt
  "cooldownDurationMs" INTEGER NOT NULL DEFAULT 172800000, -- 48 hours in milliseconds
  "hasExpired" BOOLEAN NOT NULL DEFAULT FALSE,
  "expirationVerifiedAt" DATETIME,
  
  CONSTRAINT "ContractLockTimeout_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ContractLockTimeout_cooldownExpiresAt" ON "ContractLockTimeout"("cooldownExpiresAt");
CREATE INDEX "ContractLockTimeout_hasExpired" ON "ContractLockTimeout"("hasExpired");

-- ContractAcknowledgment: Tracks explicit acknowledgment of contract terms
CREATE TABLE IF NOT EXISTS "ContractAcknowledgment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "contractId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "acknowledgedAt" DATETIME NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "documentHash" TEXT, -- SHA256 hash of acknowledged document
  "signature" TEXT, -- Digital signature (for multi-sig scenarios)
  "acknowledgmentType" TEXT NOT NULL, -- 'INITIAL_TERMS', 'MUTUAL_APPROVAL', 'LOCK_CONFIRMATION', 'EXECUTION_READY', etc.
  
  CONSTRAINT "ContractAcknowledgment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ContractAcknowledgment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ContractAcknowledgment_unique_contract_user_type" UNIQUE("contractId", "userId", "acknowledgmentType")
);

CREATE INDEX "ContractAcknowledgment_contractId" ON "ContractAcknowledgment"("contractId");
CREATE INDEX "ContractAcknowledgment_userId" ON "ContractAcknowledgment"("userId");
CREATE INDEX "ContractAcknowledgment_acknowledgedAt" ON "ContractAcknowledgment"("acknowledgedAt");

-- ContractGuardCheck: Stores detailed guard condition results for audit trail
CREATE TABLE IF NOT EXISTS "ContractGuardCheck" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "contractId" TEXT NOT NULL,
  "transitionId" TEXT NOT NULL,
  "guardName" TEXT NOT NULL,
  "passed" BOOLEAN NOT NULL,
  "details" TEXT, -- JSON stringified object with check details
  "checkedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "ContractGuardCheck_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ContractGuardCheck_transitionId_fkey" FOREIGN KEY ("transitionId") REFERENCES "ContractStateLog" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ContractGuardCheck_contractId" ON "ContractGuardCheck"("contractId");
CREATE INDEX "ContractGuardCheck_transitionId" ON "ContractGuardCheck"("transitionId");
CREATE INDEX "ContractGuardCheck_passed" ON "ContractGuardCheck"("passed");

-- ContractRights: Track rights granted at each state (denormalized for quick lookup)
CREATE TABLE IF NOT EXISTS "ContractRights" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "contractId" TEXT NOT NULL,
  "state" INTEGER NOT NULL,
  "role" TEXT NOT NULL, -- 'OWNER', 'CONTRACTOR', 'SUPERVISOR', 'WITNESS'
  "rightName" TEXT NOT NULL,
  "rightDescription" TEXT,
  "grantedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" DATETIME,
  
  CONSTRAINT "ContractRights_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ContractRights_contractId" ON "ContractRights"("contractId");
CREATE INDEX "ContractRights_state" ON "ContractRights"("state");
CREATE INDEX "ContractRights_role" ON "ContractRights"("role");

-- ContractObligation: Track obligations at each state
CREATE TABLE IF NOT EXISTS "ContractObligation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "contractId" TEXT NOT NULL,
  "state" INTEGER NOT NULL,
  "role" TEXT NOT NULL, -- 'OWNER', 'CONTRACTOR', 'SUPERVISOR', 'WITNESS'
  "obligationName" TEXT NOT NULL,
  "obligationDescription" TEXT,
  "obligationDeadline" DATETIME,
  "status" TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'VIOLATED', 'WAIVED'
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" DATETIME,
  
  CONSTRAINT "ContractObligation_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ContractObligation_contractId" ON "ContractObligation"("contractId");
CREATE INDEX "ContractObligation_state" ON "ContractObligation"("state");
CREATE INDEX "ContractObligation_status" ON "ContractObligation"("status");

-- Add currentState column to Project table to track live state
ALTER TABLE "Project" ADD COLUMN "contractState" INTEGER DEFAULT 0;
CREATE INDEX "Project_contractState" ON "Project"("contractState");
