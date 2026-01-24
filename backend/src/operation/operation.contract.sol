// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * State 3: OPERATION_RUNNING Smart Contract Functions
 * 
 * Manages contract execution phase with milestone tracking,
 * progress reporting, and verification workflow.
 * 
 * Precondition: Contract must be in CONTRACT_ACTIVE_LOCKED state
 * Entry Condition: startOperation() called
 * Exit Condition: All milestones verified + final report verified
 * Exit Target: EVALUATION_AND_CALCULATION state
 */

// ============================================================================
// EVENTS
// ============================================================================

/// @notice Emitted when operation starts
event OperationStarted(
    bytes32 indexed contractId,
    uint256 scheduledStartTime,
    address indexed startedBy,
    uint256 timestamp
);

/// @notice Emitted when progress report is submitted
event ReportSubmitted(
    bytes32 indexed contractId,
    uint256 indexed milestoneNumber,
    bytes32 reportHash,
    address indexed submittedBy,
    uint256 completionPercentage,
    uint256 timestamp
);

/// @notice Emitted when report is verified
event ReportVerified(
    bytes32 indexed contractId,
    uint256 indexed milestoneNumber,
    uint8 verificationResult, // 0=APPROVED, 1=REJECTED, 2=REVISION_REQUIRED
    address indexed verifiedBy,
    uint256 timestamp
);

/// @notice Emitted when milestone is marked complete
event MilestoneCompleted(
    bytes32 indexed contractId,
    uint256 indexed milestoneNumber,
    uint256 completionDate,
    address indexed completedBy,
    uint256 timestamp
);

/// @notice Emitted when deadline is overdue
event DeadlineOverdue(
    bytes32 indexed contractId,
    uint256 indexed milestoneNumber,
    uint256 daysOverdue,
    uint256 timestamp
);

// ============================================================================
// DATA STRUCTURES
// ============================================================================

/// @notice Waiting states during OPERATION_RUNNING
enum OperationWaitingState {
    WAITING_FOR_REPORT,              // 0
    WAITING_FOR_VERIFICATION,        // 1
    WAITING_FOR_MILESTONE_COMPLETION // 2
}

/// @notice Report verification result types
enum VerificationResult {
    APPROVED,            // 0
    REJECTED,            // 1
    REVISION_REQUIRED    // 2
}

/// @notice Report lifecycle status
enum ReportStatus {
    PENDING,    // 0
    SUBMITTED,  // 1
    VERIFIED,   // 2
    REJECTED    // 3
}

/// @notice Operation milestone structure
struct OperationMilestone {
    uint256 milestoneNumber;
    string description;
    uint256 percentageOfContract;
    uint256 amount;
    uint256 targetCompletionDate;
    uint256 actualCompletionDate;
    address responsibleParty;
    string[] deliverables;
    ReportStatus status;
    bool isOverdue;
}

/// @notice Progress report structure
struct ProgressReport {
    bytes32 reportId;
    uint256 milestoneNumber;
    uint256 submittedDate;
    address submittedBy;
    string progressDescription;
    uint256 completionPercentage;
    ReportStatus status;
    string[] photoUrls;
    string notes;
    bytes32 reportHash;
    string verificationNotes;
    address verifiedBy;
    uint256 verifiedDate;
}

/// @notice Operation state tracking
struct OperationState {
    bool isActive;
    uint256 startTime;
    uint256 lastUpdateTime;
    uint256 activeMilestoneNumber;
    OperationWaitingState waitingState;
    uint256 overallProgress;
    bytes32[] submittedReportIds;
    mapping(bytes32 => ProgressReport) reports;
    mapping(uint256 => OperationMilestone) milestones;
}

// ============================================================================
// STORAGE
// ============================================================================

mapping(bytes32 => OperationState) operationStates;
mapping(bytes32 => uint256) operationStartTimes;
mapping(bytes32 => uint256) milestoneCompletionDates;

// ============================================================================
// MODIFIERS
// ============================================================================

/**
 * @notice Guard: Verify contract is in CONTRACT_ACTIVE_LOCKED state
 * @dev Must be called before any operation state transitions
 */
modifier onlyWhenLocked(bytes32 contractId) {
    // Requires: currentState[contractId] == CONTRACT_ACTIVE_LOCKED
    // This check would be done by accessing contract state storage
    // placeholder: require(getContractState(contractId) == ContractState.CONTRACT_ACTIVE_LOCKED);
    _;
}

/**
 * @notice Guard: Verify funds are locked in escrow
 * @dev Must be called for state entry verification
 */
modifier fundsLocked(bytes32 contractId) {
    // Requires: funds transferred to escrow == contract total amount
    // placeholder: require(getFundsLockedAmount(contractId) == getContractAmount(contractId));
    _;
}

/**
 * @notice Guard: Verify operation is currently running
 * @dev Called by report and verification functions
 */
modifier operationRunning(bytes32 contractId) {
    require(operationStates[contractId].isActive, "Operation not running");
    _;
}

/**
 * @notice Guard: Verify milestone exists and is valid
 * @dev Called by report submission and verification
 */
modifier milestoneExists(bytes32 contractId, uint256 milestoneNumber) {
    require(milestoneNumber > 0 && milestoneNumber <= 3, "Invalid milestone");
    _;
}

/**
 * @notice Guard: Verify no overdue unresolved issues
 * @dev Called before state advancement
 */
modifier noUnresolvedIssues(bytes32 contractId) {
    // Requires: all overdue milestones have been addressed or deadline extended
    // This would check deadline status and last update time
    _;
}

// ============================================================================
// STATE 3: OPERATION_RUNNING FUNCTIONS
// ============================================================================

/**
 * @notice Start operation - transition from CONTRACT_ACTIVE_LOCKED to OPERATION_RUNNING
 * @param contractId The contract ID
 * @param scheduledStartTime When operations should begin
 * 
 * Guards:
 * 1. Contract must be in CONTRACT_ACTIVE_LOCKED state
 * 2. Funds must be locked in escrow
 * 3. Caller must be contract owner
 * 4. Scheduled start time must be in the future
 * 5. Must explicitly confirm operation start
 * 
 * Actions:
 * 1. Initialize milestones with 3 standard phases
 * 2. Set operation as active with start time
 * 3. Initialize waiting state as WAITING_FOR_REPORT
 * 4. Emit OperationStarted event
 * 5. Store to blockchain for audit trail
 */
function startOperation(
    bytes32 contractId,
    uint256 scheduledStartTime
)
    external
    onlyWhenLocked(contractId)
    fundsLocked(contractId)
    returns (bool)
{
    // Guard: Caller must be contract owner
    // placeholder: require(msg.sender == getContractOwner(contractId), "Not contract owner");

    // Guard: Scheduled start time must be in future
    require(scheduledStartTime > block.timestamp, "Start time must be in future");

    // Guard: Operation not already running
    require(!operationStates[contractId].isActive, "Operation already running");

    // Initialize operation state
    OperationState storage opState = operationStates[contractId];
    opState.isActive = true;
    opState.startTime = scheduledStartTime;
    opState.lastUpdateTime = block.timestamp;
    opState.activeMilestoneNumber = 1;
    opState.waitingState = OperationWaitingState.WAITING_FOR_REPORT;
    opState.overallProgress = 0;

    // Initialize 3 standard milestones
    _initializeMilestones(contractId);

    // Store start time for calculations
    operationStartTimes[contractId] = scheduledStartTime;

    // Emit event
    emit OperationStarted(contractId, scheduledStartTime, msg.sender, block.timestamp);

    return true;
}

/**
 * @notice Submit progress report for milestone
 * @param contractId The contract ID
 * @param milestoneNumber Which milestone (1-3)
 * @param reportHash Keccak256 hash of report for integrity verification
 * @param completionPercentage Progress percentage (0-100)
 * 
 * Guards:
 * 1. Operation must be running
 * 2. Milestone must exist (1-3)
 * 3. Completion percentage must be 0-100
 * 4. Caller must be responsible party or contractor
 * 5. Cannot submit for already-verified milestone
 * 
 * Actions:
 * 1. Create report object with SUBMITTED status
 * 2. Generate unique reportId (keccak256(contractId, milestoneNumber, timestamp))
 * 3. Store reportHash for blockchain proof
 * 4. Store submitter address and timestamp
 * 5. Update milestone status to SUBMITTED
 * 6. Change waiting state to WAITING_FOR_VERIFICATION
 * 7. Emit ReportSubmitted event with hash
 * 8. Store to blockchain audit trail
 */
function submitReport(
    bytes32 contractId,
    uint256 milestoneNumber,
    bytes32 reportHash,
    uint256 completionPercentage
)
    external
    operationRunning(contractId)
    milestoneExists(contractId, milestoneNumber)
    returns (bytes32 reportId)
{
    // Guard: Completion percentage valid
    require(completionPercentage <= 100, "Percentage > 100");

    // Guard: Caller is responsible party
    // placeholder: require(msg.sender == getMilestoneResponsibleParty(...));

    // Guard: Milestone not already verified
    OperationState storage opState = operationStates[contractId];
    require(
        opState.milestones[milestoneNumber].status != ReportStatus.VERIFIED,
        "Milestone already verified"
    );

    // Generate report ID
    reportId = keccak256(abi.encodePacked(contractId, milestoneNumber, block.timestamp));

    // Create report
    ProgressReport storage report = opState.reports[reportId];
    report.reportId = reportId;
    report.milestoneNumber = milestoneNumber;
    report.submittedDate = block.timestamp;
    report.submittedBy = msg.sender;
    report.completionPercentage = completionPercentage;
    report.status = ReportStatus.SUBMITTED;
    report.reportHash = reportHash; // Store hash for integrity verification
    report.verifiedDate = 0;
    report.verifiedBy = address(0);

    // Store report ID
    opState.submittedReportIds.push(reportId);

    // Update milestone status
    opState.milestones[milestoneNumber].status = ReportStatus.SUBMITTED;
    opState.lastUpdateTime = block.timestamp;

    // Update waiting state
    opState.waitingState = OperationWaitingState.WAITING_FOR_VERIFICATION;

    // Emit event
    emit ReportSubmitted(
        contractId,
        milestoneNumber,
        reportHash,
        msg.sender,
        completionPercentage,
        block.timestamp
    );

    return reportId;
}

/**
 * @notice Verify submitted report
 * @param contractId The contract ID
 * @param milestoneNumber Which milestone (1-3)
 * @param reportId The report ID
 * @param result Verification result (APPROVED, REJECTED, REVISION_REQUIRED)
 * 
 * Guards:
 * 1. Operation must be running
 * 2. Report must exist and be in SUBMITTED status
 * 3. Caller must be contract owner or witness
 * 4. Result must be valid (APPROVED, REJECTED, or REVISION_REQUIRED)
 * 
 * Actions if APPROVED:
 * 1. Update report status to VERIFIED
 * 2. Update milestone status to VERIFIED
 * 3. Store verification date and verifier address
 * 4. Calculate overall progress (sum of verified milestone percentages)
 * 5. If all milestones verified, change state to allow advancement
 * 6. Emit ReportVerified event
 * 7. If all verified, emit MilestoneCompleted for last one
 * 
 * Actions if REJECTED/REVISION:
 * 1. Update report status to REJECTED/REVISION_REQUIRED
 * 2. Store verification notes
 * 3. Keep milestone in SUBMITTED state for re-submission
 * 4. Update waiting state back to WAITING_FOR_REPORT
 * 5. Emit ReportVerified event with result code
 */
function verifyReport(
    bytes32 contractId,
    uint256 milestoneNumber,
    bytes32 reportId,
    uint8 result // 0=APPROVED, 1=REJECTED, 2=REVISION_REQUIRED
)
    external
    operationRunning(contractId)
    milestoneExists(contractId, milestoneNumber)
    returns (bool)
{
    // Guard: Result is valid
    require(result <= 2, "Invalid verification result");

    // Guard: Caller is contract owner or witness
    // placeholder: require(hasVerificationRole(msg.sender, contractId), "Not authorized");

    OperationState storage opState = operationStates[contractId];
    ProgressReport storage report = opState.reports[reportId];

    // Guard: Report exists and is in SUBMITTED status
    require(report.submittedDate > 0, "Report not found");
    require(report.status == ReportStatus.SUBMITTED, "Report already verified");
    require(report.milestoneNumber == milestoneNumber, "Milestone mismatch");

    // Update verification info
    report.verifiedDate = block.timestamp;
    report.verifiedBy = msg.sender;
    opState.lastUpdateTime = block.timestamp;

    if (result == 0) {
        // APPROVED
        report.status = ReportStatus.VERIFIED;
        opState.milestones[milestoneNumber].status = ReportStatus.VERIFIED;
        opState.milestones[milestoneNumber].actualCompletionDate = block.timestamp;

        // Calculate overall progress
        uint256 completedCount = 0;
        for (uint256 i = 1; i <= 3; i++) {
            if (opState.milestones[i].status == ReportStatus.VERIFIED) {
                completedCount++;
            }
        }
        opState.overallProgress = (completedCount * 100) / 3;

        // Update waiting state
        if (completedCount == 3) {
            opState.waitingState = OperationWaitingState.WAITING_FOR_MILESTONE_COMPLETION;
        } else {
            opState.waitingState = OperationWaitingState.WAITING_FOR_REPORT;
            opState.activeMilestoneNumber = milestoneNumber + 1;
        }

        // Emit milestone completed
        emit MilestoneCompleted(
            contractId,
            milestoneNumber,
            block.timestamp,
            msg.sender,
            block.timestamp
        );
    } else if (result == 1) {
        // REJECTED
        report.status = ReportStatus.REJECTED;
        // Milestone stays SUBMITTED, waiting for new report
        opState.waitingState = OperationWaitingState.WAITING_FOR_REPORT;
    } else {
        // REVISION_REQUIRED (2)
        report.status = ReportStatus.REJECTED; // Store as rejected until resubmitted
        opState.waitingState = OperationWaitingState.WAITING_FOR_REPORT;
    }

    // Emit verification event
    emit ReportVerified(contractId, milestoneNumber, result, msg.sender, block.timestamp);

    return true;
}

/**
 * @notice Get current operation state
 * @param contractId The contract ID
 * @return isActive Whether operation is running
 * @return daysSinceStart Days elapsed since start
 * @return activeMilestoneNumber Current active milestone
 * @return waitingState What we're currently waiting for
 * @return overallProgress Overall completion percentage
 */
function getOperationState(bytes32 contractId)
    external
    view
    returns (
        bool isActive,
        uint256 daysSinceStart,
        uint256 activeMilestoneNumber,
        uint8 waitingState,
        uint256 overallProgress
    )
{
    OperationState storage opState = operationStates[contractId];

    isActive = opState.isActive;
    if (opState.startTime > 0) {
        daysSinceStart = (block.timestamp - opState.startTime) / 1 days;
    }
    activeMilestoneNumber = opState.activeMilestoneNumber;
    waitingState = uint8(opState.waitingState);
    overallProgress = opState.overallProgress;

    return (isActive, daysSinceStart, activeMilestoneNumber, waitingState, overallProgress);
}

/**
 * @notice Check if milestone is overdue
 * @param contractId The contract ID
 * @param milestoneNumber Which milestone (1-3)
 * @return isOverdue Whether milestone is past its deadline
 * @return daysOverdue Number of days past deadline
 */
function checkMilestoneOverdue(bytes32 contractId, uint256 milestoneNumber)
    external
    view
    returns (bool isOverdue, uint256 daysOverdue)
{
    OperationState storage opState = operationStates[contractId];
    OperationMilestone storage milestone = opState.milestones[milestoneNumber];

    if (block.timestamp > milestone.targetCompletionDate) {
        isOverdue = true;
        daysOverdue = (block.timestamp - milestone.targetCompletionDate) / 1 days;

        // Emit event if newly overdue
        if (!milestone.isOverdue) {
            emit DeadlineOverdue(contractId, milestoneNumber, daysOverdue, block.timestamp);
        }
    }

    return (isOverdue, daysOverdue);
}

/**
 * @notice Check if all milestones are verified and ready for state advancement
 * @param contractId The contract ID
 * @return allVerified Whether all 3 milestones are verified
 * @return progressPercentage Final overall progress (should be 100)
 */
function canAdvanceState(bytes32 contractId)
    external
    view
    returns (bool allVerified, uint256 progressPercentage)
{
    OperationState storage opState = operationStates[contractId];

    bool verified1 = opState.milestones[1].status == ReportStatus.VERIFIED;
    bool verified2 = opState.milestones[2].status == ReportStatus.VERIFIED;
    bool verified3 = opState.milestones[3].status == ReportStatus.VERIFIED;

    allVerified = verified1 && verified2 && verified3;
    progressPercentage = opState.overallProgress;

    return (allVerified, progressPercentage);
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/**
 * @notice Initialize 3 standard milestones for contract
 * @dev Called by startOperation()
 */
function _initializeMilestones(bytes32 contractId) internal {
    OperationState storage opState = operationStates[contractId];

    // Milestone 1: Site Preparation
    opState.milestones[1] = OperationMilestone(
        1,
        "Penyiapan Lokasi & Material",
        33,
        333_000_000_000_000_000_000, // 333 milliards IDR in wei-like units
        block.timestamp + 45 days,
        0,
        tx.origin, // Contractor
        new string[](0),
        ReportStatus.PENDING,
        false
    );

    // Milestone 2: Main Works
    opState.milestones[2] = OperationMilestone(
        2,
        "Pelaksanaan Pekerjaan Utama",
        33,
        333_000_000_000_000_000_000,
        block.timestamp + 135 days,
        0,
        tx.origin,
        new string[](0),
        ReportStatus.PENDING,
        false
    );

    // Milestone 3: Completion & Handover
    opState.milestones[3] = OperationMilestone(
        3,
        "Penyelesaian & Serah Terima",
        34,
        334_000_000_000_000_000_000,
        block.timestamp + 180 days,
        0,
        tx.origin,
        new string[](0),
        ReportStatus.PENDING,
        false
    );
}

/**
 * @notice Get report hash for blockchain verification
 * @param contractId The contract ID
 * @param reportId The report ID
 */
function getReportHash(bytes32 contractId, bytes32 reportId)
    external
    view
    returns (bytes32)
{
    return operationStates[contractId].reports[reportId].reportHash;
}

/**
 * @notice Verify report integrity against stored hash
 * @dev Used to verify report hasn't been tampered with
 */
function verifyReportIntegrity(
    bytes32 contractId,
    bytes32 reportId,
    bytes memory reportData
) external view returns (bool) {
    bytes32 storedHash = operationStates[contractId].reports[reportId].reportHash;
    bytes32 computedHash = keccak256(reportData);
    return storedHash == computedHash;
}

// ============================================================================
// State Transition Guards
// ============================================================================

/**
 * @notice Guard: Prevent state transition unless all conditions met
 * Requirements for OPERATION_RUNNING → EVALUATION_AND_CALCULATION:
 * 1. All 3 milestones must be VERIFIED
 * 2. No rejected reports with unresolved issues
 * 3. No active disputes
 * 4. Minimum operation duration elapsed (if configured)
 */
function validateStateTransition(bytes32 contractId)
    external
    view
    returns (bool canTransition, string memory reason)
{
    OperationState storage opState = operationStates[contractId];

    // Check all milestones verified
    if (opState.milestones[1].status != ReportStatus.VERIFIED) {
        return (false, "Milestone 1 not verified");
    }
    if (opState.milestones[2].status != ReportStatus.VERIFIED) {
        return (false, "Milestone 2 not verified");
    }
    if (opState.milestones[3].status != ReportStatus.VERIFIED) {
        return (false, "Milestone 3 not verified");
    }

    // Check no rejected reports pending
    // (This would iterate through reports checking for REJECTED status)

    return (true, "Ready for state advancement");
}

/**
 * @notice Prevent distribution during operation
 * @dev Guard that prevents any payment/distribution calls during OPERATION_RUNNING
 */
modifier operationNotRunning(bytes32 contractId) {
    require(
        !operationStates[contractId].isActive,
        "Cannot distribute while operation running"
    );
    _;
}

/**
 * @notice Prevent contract unlock during operation
 * @dev Guard that prevents fund unlock or early termination
 */
modifier operationNotInterruptible(bytes32 contractId) {
    require(
        !operationStates[contractId].isActive,
        "Cannot modify locked contract while operation running"
    );
    _;
}

/**
 * @notice Prevent evaluation during operation
 * @dev Guard that prevents state advancement to EVALUATION_AND_CALCULATION
 * until all milestones are verified
 */
modifier operationComplete(bytes32 contractId) {
    OperationState storage opState = operationStates[contractId];
    require(
        opState.milestones[1].status == ReportStatus.VERIFIED &&
        opState.milestones[2].status == ReportStatus.VERIFIED &&
        opState.milestones[3].status == ReportStatus.VERIFIED,
        "Operation not complete - milestones not verified"
    );
    _;
}
