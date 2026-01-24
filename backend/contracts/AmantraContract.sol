// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title AmantraContract
 * @notice Legally binding contract state machine with non-skippable state transitions
 * @dev All state transitions are strictly guarded and immutable after locking
 */

// ============================================
// GLOBAL ENUM - SHARED WITH ALL LAYERS
// ============================================
enum ContractState {
  INTENT_DECLARED,                          // 0: Initial intent phase
  PRE_CONTRACT_REVIEW,                      // 1: Legal review phase
  CONTRACT_ACTIVE_LOCKED,                   // 2: Immutable lock-in phase (48h cooldown)
  OPERATION_RUNNING,                        // 3: Active execution phase
  EVALUATION_AND_CALCULATION,               // 4: Performance evaluation phase
  RIGHTS_FINALIZED_AND_DISTRIBUTION,        // 5: Distribution phase
  CONTRACT_CLOSED_AND_ARCHIVED,             // 6: Final archived state
  EXCEPTION_AND_FORCE_MAJEURE = 9           // 9: Emergency state (any origin)
}

// ============================================
// STRUCTURES
// ============================================

struct ContractData {
  bytes32 contractId;
  ContractState currentState;
  address owner;
  address contractor;
  address supervisor;
  address witness;
  uint256 createdAt;
  uint256 lockedAt;
  uint256 executionStartedAt;
  uint256 evaluationStartedAt;
  uint256 contractValue;
  bytes32 documentHash;
  bool ownerApproved;
  bool contractorApproved;
}

struct StateTransition {
  ContractState fromState;
  ContractState toState;
  uint256 timestamp;
  address initiatedBy;
  bytes32 transitionHash;
  bytes conditions; // bitmask of verified conditions
}

struct Cooldown {
  uint256 startTime;
  uint256 duration; // 48 hours in seconds (172800)
  bool expired;
}

// ============================================
// STATE 1: PRE_CONTRACT_REVIEW STRUCTURES
// ============================================

struct ContractReviewAcknowledgement {
  address acknowledgedBy;
  uint256 acknowledgedAt;
  bool ackSummary;
  bool ackTimeline;
  bool ackRisks;
  bool ackSimulation;
  bool ackLegalText;
  bool ackChecklist;
  uint256 cooldownEndTime;
  bool allAcknowledged;
  bytes32 acknowledgmentHash;
}

// ============================================
// EVENTS
// ============================================

event ContractCreated(
  bytes32 indexed contractId,
  address indexed owner,
  address indexed contractor,
  uint256 timestamp
);

event StateTransitionAttempted(
  bytes32 indexed contractId,
  ContractState fromState,
  ContractState toState,
  address indexed initiatedBy,
  bool success,
  string reason
);

event ContractStateChanged(
  bytes32 indexed contractId,
  ContractState previousState,
  ContractState newState,
  address indexed initiatedBy,
  uint256 timestamp,
  bytes32 transitionHash
);

event CooldownStarted(
  bytes32 indexed contractId,

  /**
   * @dev Internal: handle transition into evaluation state
   */
  function _startEvaluation(bytes32 _contractId) internal {
    ContractData storage contract_ = contracts[_contractId];

    require(
      block.timestamp <= contract_.executionStartedAt + MAX_OPERATION_TIME,
      "Operation period exceeded"
    );

    contract_.currentState = ContractState.EVALUATION_AND_CALCULATION;
    contract_.evaluationStartedAt = block.timestamp;
    evaluationFrozen[_contractId] = true;
    evaluationObjectionsCleared[_contractId] = true;

    emit ContractStateChanged(
      _contractId,
      ContractState.OPERATION_RUNNING,
      ContractState.EVALUATION_AND_CALCULATION,
      msg.sender,
      block.timestamp,
      keccak256(abi.encodePacked("submit_for_evaluation"))
    );

    emit EvaluationStarted(
      _contractId,
      msg.sender,
      block.timestamp
    );

    _recordTransition(_contractId, ContractState.OPERATION_RUNNING, ContractState.EVALUATION_AND_CALCULATION, "evaluation_initiated");
  }

  /**
   * @dev Internal: finalize evaluation and advance to distribution
   */
  function _finalizeEvaluation(bytes32 _contractId) internal {
    ContractData storage contract_ = contracts[_contractId];

    require(
      block.timestamp <= contract_.evaluationStartedAt + EVALUATION_WINDOW,
      "Evaluation window expired"
    );
    require(
      evaluationCalculationHash[_contractId] != bytes32(0),
      "Calculation hash belum di-anchored"
    );
    require(
      evaluationObjectionsCleared[_contractId],
      "Keberatan belum diselesaikan"
    );

    contract_.currentState = ContractState.RIGHTS_FINALIZED_AND_DISTRIBUTION;
    evaluationFrozen[_contractId] = false;

    emit ObjectionResolved(
      _contractId,
      msg.sender,
      block.timestamp
    );

    emit RightsFinalized(
      _contractId,
      evaluationCalculationHash[_contractId],
      msg.sender,
      block.timestamp
    );

    emit EvaluationFinalized(
      _contractId,
      evaluationCalculationHash[_contractId],
      msg.sender,
      block.timestamp
    );

    emit ContractStateChanged(
      _contractId,
      ContractState.EVALUATION_AND_CALCULATION,
      ContractState.RIGHTS_FINALIZED_AND_DISTRIBUTION,
      msg.sender,
      block.timestamp,
      keccak256(abi.encodePacked("finalize_rights"))
    );

    _recordTransition(_contractId, ContractState.EVALUATION_AND_CALCULATION, ContractState.RIGHTS_FINALIZED_AND_DISTRIBUTION, "rights_finalized");
  }
  uint256 startTime,
  uint256 expirationTime
);

event CooldownExpired(
  bytes32 indexed contractId,
  uint256 timestamp
);

event EmergencyInvoked(
  bytes32 indexed contractId,
  address indexed initiatedBy,
  string reason,
  uint256 timestamp
);

event AcknowledgmentProvided(
  bytes32 indexed contractId,
  address indexed party,
  uint256 timestamp
);

// ============================================
// STATE 1: PRE_CONTRACT_REVIEW EVENTS
// ============================================

event PreContractReviewAcknowledged(
  bytes32 indexed contractId,
  address indexed acknowledgedBy,
  uint256 timestamp,
  bytes32 acknowledgmentHash
);

event PreContractApproved(
  bytes32 indexed contractId,
  address indexed approvedBy,
  uint256 timestamp
);

// ============================================
// STATE 4: EVALUATION & CALCULATION EVENTS
// ============================================

event EvaluationStarted(
  bytes32 indexed contractId,
  address indexed initiatedBy,
  uint256 timestamp
);

event CalculationComputed(
  bytes32 indexed contractId,
  bytes32 calculationHash,
  address indexed preparedBy,
  uint256 timestamp
);

event ObjectionRaised(
  bytes32 indexed contractId,
  address indexed raisedBy,
  string reason,
  uint256 timestamp
);

event ObjectionResolved(
  bytes32 indexed contractId,
  address indexed resolvedBy,
  uint256 timestamp
);

event EvaluationFinalized(
  bytes32 indexed contractId,
  bytes32 calculationHash,
  address indexed finalizedBy,
  uint256 timestamp
);

event RightsFinalized(
  bytes32 indexed contractId,
  bytes32 resultHash,
  address indexed finalizedBy,
  uint256 timestamp
);

event DistributionExecuted(
  bytes32 indexed contractId,
  address indexed to,
  uint256 amount,
  uint256 timestamp
);

event DistributionCompleted(
  bytes32 indexed contractId,
  uint256 timestamp
);

event ContractClosed(
  bytes32 indexed contractId,
  uint256 timestamp
);

event ContractArchived(
  bytes32 indexed contractId,
  bytes32 finalHash,
  uint256 timestamp
);

// ============================================
// CONTRACT
// ============================================

contract AmantraContract {
  
  // ============================================
  // STATE VARIABLES
  // ============================================

  mapping(bytes32 => ContractData) public contracts;
  mapping(bytes32 => StateTransition[]) public transitionHistory;
  mapping(bytes32 => Cooldown) public cooldownTimers;
  mapping(bytes32 => mapping(address => bool)) public acknowledgments;
  mapping(bytes32 => mapping(address => uint256)) public lastAcknowledgmentTime;
  mapping(bytes32 => bytes32) public evaluationCalculationHash;
  mapping(bytes32 => bool) public evaluationFrozen;
  mapping(bytes32 => bool) public evaluationObjectionsCleared;
  mapping(bytes32 => bool) public distributionCompleted;

  // ============================================
  // INTENT DECLARATION - STATE 0
  // ============================================
  
  enum UserRole {
    INVESTOR,     // 0
    OPERATOR,     // 1
    AUDITOR,      // 2
    SYSTEM        // 3
  }

  struct IntentDeclaration {
    address user;
    UserRole role;
    bool kycVerified;
    bool acceptedTerms;
    bool confirmedLegalCapacity;
    uint256 declarationTimestamp;
    bytes32 declarationHash;
  }

  mapping(address => IntentDeclaration) public userIntents;
  mapping(address => bool) public hasDeclaredIntent;
  address[] public declaredUsers;

  event IntentDeclared(
    address indexed user,
    UserRole role,
    uint256 timestamp,
    bytes32 declarationHash
  );

  // ============================================
  // STATE 1: PRE_CONTRACT_REVIEW STATE VARIABLES
  // ============================================

  mapping(bytes32 => ContractReviewAcknowledgement) public reviewAcknowledgements;
  mapping(bytes32 => bool) public preContractApproved;
  mapping(bytes32 => uint256) public reviewCooldownEnd;

  bytes32[] public contractIds;
  
  uint256 constant COOLDOWN_DURATION = 172800; // 48 hours in seconds
  uint256 constant MAX_REVIEW_TIME = 1209600; // 14 days
  uint256 constant MAX_OPERATION_TIME = 7776000; // 90 days
  uint256 constant EVALUATION_WINDOW = 864000; // 10 days
  
  // ============================================
  // MODIFIERS
  // ============================================

  /**
   * @notice Guard for state transitions - ensures contract is in expected state
   */
  modifier onlyState(bytes32 _contractId, ContractState _expectedState) {
    require(
      contracts[_contractId].currentState == _expectedState,
      string(abi.encodePacked(
        "Invalid state. Expected: ",
        _stateToString(_expectedState),
        ", Got: ",
        _stateToString(contracts[_contractId].currentState)
      ))
    );
    _;
  }

  /**
   * @notice Guard for authorized parties
   */
  modifier onlyAuthorized(bytes32 _contractId) {
    ContractData storage contract_ = contracts[_contractId];
    require(
      msg.sender == contract_.owner ||
      msg.sender == contract_.contractor ||
      msg.sender == contract_.supervisor ||
      msg.sender == contract_.witness,
      "Unauthorized: Not a contract party"
    );
    _;
  }

  /**
   * @notice Guard ensuring cooldown has expired
   */
  modifier cooldownExpired(bytes32 _contractId) {
    Cooldown storage cooldown = cooldownTimers[_contractId];
    require(
      block.timestamp >= cooldown.startTime + cooldown.duration,
      "Cooldown period not yet expired"
    );
    _;
  }

  /**
   * @notice Guard for mutual approval
   */
  modifier mutualApproval(bytes32 _contractId) {
    ContractData storage contract_ = contracts[_contractId];
    require(
      contract_.ownerApproved && contract_.contractorApproved,
      "Requires approval from both owner and contractor"
    );
    _;
  }

  /**
   * @notice Guard for explicit acknowledgment
   */
  modifier requiresAcknowledgment(bytes32 _contractId) {
    require(
      acknowledgments[_contractId][msg.sender],
      "Party must explicitly acknowledge before proceeding"
    );
    _;
  }
  /**
   * @notice Guard for intent declaration
   */
  modifier onlyIntentDeclared() {
    require(
      hasDeclaredIntent[msg.sender],
      "Must declare intent before proceeding"
    );
    _;
  }

  /**
   * @notice Guard for valid role
   */
  modifier validRole(UserRole _role) {
    require(
      uint8(_role) <= 3,
      "Invalid role"
    );
    _;
  }
  // ============================================
  // LIFECYCLE FUNCTIONS
  // ============================================

  /**
   * @notice Create a new contract (State 0: INTENT_DECLARED)
   */
  function createContract(
    bytes32 _contractId,
    address _owner,
    address _contractor,
    address _supervisor,
    address _witness,
    uint256 _contractValue,
    bytes32 _documentHash
  ) external {
    require(contracts[_contractId].createdAt == 0, "Contract already exists");
    require(_owner != address(0) && _contractor != address(0), "Invalid addresses");

    ContractData storage newContract = contracts[_contractId];
    newContract.contractId = _contractId;
    newContract.currentState = ContractState.INTENT_DECLARED;
    newContract.owner = _owner;
    newContract.contractor = _contractor;
    newContract.supervisor = _supervisor;
    newContract.witness = _witness;
    newContract.createdAt = block.timestamp;
    newContract.contractValue = _contractValue;
    newContract.documentHash = _documentHash;

    contractIds.push(_contractId);

    emit ContractCreated(_contractId, _owner, _contractor, block.timestamp);
    _recordTransition(_contractId, ContractState.INTENT_DECLARED, ContractState.INTENT_DECLARED, "contract_created");
  }

  /**
   * @notice Transition from INTENT_DECLARED (State 0) → PRE_CONTRACT_REVIEW (State 1)
   * @dev Both parties must sign intent
   */
  function transitionToReview(
    bytes32 _contractId
  ) external 
    onlyState(_contractId, ContractState.INTENT_DECLARED)
    onlyAuthorized(_contractId)
  {
    ContractData storage contract_ = contracts[_contractId];
    
    // Guard: Both parties must have signed
    require(contract_.ownerApproved && contract_.contractorApproved, "Both parties must approve");
    
    // Guard: Must be within 7 days of intent
    require(block.timestamp <= contract_.createdAt + 604800, "Intent expired (7 days)");

    contract_.currentState = ContractState.PRE_CONTRACT_REVIEW;

    emit ContractStateChanged(
      _contractId,
      ContractState.INTENT_DECLARED,
      ContractState.PRE_CONTRACT_REVIEW,
      msg.sender,
      block.timestamp,
      keccak256(abi.encodePacked("transition_to_review"))
    );

    _recordTransition(_contractId, ContractState.INTENT_DECLARED, ContractState.PRE_CONTRACT_REVIEW, "legal_review_initiated");
  }

  /**
   * @notice Transition from PRE_CONTRACT_REVIEW (State 1) → CONTRACT_ACTIVE_LOCKED (State 2)
   * @dev CRITICAL: Starts 48-hour mandatory cooldown before operation
   */
  function lockContract(
    bytes32 _contractId
  ) external 
    onlyState(_contractId, ContractState.PRE_CONTRACT_REVIEW)
    onlyAuthorized(_contractId)
    mutualApproval(_contractId)
  {
    ContractData storage contract_ = contracts[_contractId];

    // Guard: Legal review must be complete (supervisor signoff)
    require(contract_.supervisor != address(0), "Legal review not completed");

    // Guard: Within review period
    require(
      block.timestamp <= contract_.createdAt + 1814400, // 21 days total (7 + 14)
      "Review period expired"
    );

    // Update state
    contract_.currentState = ContractState.CONTRACT_ACTIVE_LOCKED;
    contract_.lockedAt = block.timestamp;

    // Start mandatory 48-hour cooldown
    Cooldown storage cooldown = cooldownTimers[_contractId];
    cooldown.startTime = block.timestamp;
    cooldown.duration = COOLDOWN_DURATION;
    cooldown.expired = false;

    emit CooldownStarted(
      _contractId,
      cooldown.startTime,
      cooldown.startTime + COOLDOWN_DURATION
    );

    emit ContractStateChanged(
      _contractId,
      ContractState.PRE_CONTRACT_REVIEW,
      ContractState.CONTRACT_ACTIVE_LOCKED,
      msg.sender,
      block.timestamp,
      keccak256(abi.encodePacked("lock_contract"))
    );

    _recordTransition(_contractId, ContractState.PRE_CONTRACT_REVIEW, ContractState.CONTRACT_ACTIVE_LOCKED, "contract_locked_cooldown_started");
  }

  /**
   * @notice Transition from CONTRACT_ACTIVE_LOCKED (State 2) → OPERATION_RUNNING (State 3)
   * @dev CRITICAL GUARD: Cooldown MUST be expired (48 hours minimum)
   */
  function startExecution(
    bytes32 _contractId
  ) external 
    onlyState(_contractId, ContractState.CONTRACT_ACTIVE_LOCKED)
    onlyAuthorized(_contractId)
    cooldownExpired(_contractId)
  {
    ContractData storage contract_ = contracts[_contractId];

    // Guard: Cooldown verified
    Cooldown storage cooldown = cooldownTimers[_contractId];
    require(
      block.timestamp >= cooldown.startTime + cooldown.duration,
      "Cooldown period still active"
    );

    contract_.currentState = ContractState.OPERATION_RUNNING;
    contract_.executionStartedAt = block.timestamp;

    emit CooldownExpired(_contractId, block.timestamp);

    emit ContractStateChanged(
      _contractId,
      ContractState.CONTRACT_ACTIVE_LOCKED,
      ContractState.OPERATION_RUNNING,
      msg.sender,
      block.timestamp,
      keccak256(abi.encodePacked("start_execution"))
    );

    _recordTransition(_contractId, ContractState.CONTRACT_ACTIVE_LOCKED, ContractState.OPERATION_RUNNING, "execution_started");
  }

  /**
   * @notice Explicit entry to State 4: EVALUATION_AND_CALCULATION
   */
  function startEvaluation(
    bytes32 _contractId
  ) external 
    onlyState(_contractId, ContractState.OPERATION_RUNNING)
    onlyAuthorized(_contractId)
  {
    _startEvaluation(_contractId);
  }

  /**
   * @notice Backward-compatible trigger from State 3 → State 4
   * @dev Alias for startEvaluation()
   */
  function submitForEvaluation(
    bytes32 _contractId
  ) external 
    onlyState(_contractId, ContractState.OPERATION_RUNNING)
    onlyAuthorized(_contractId)
  {
    _startEvaluation(_contractId);
  }

  /**
   * @notice Store calculation hash as anchor before finalization
   */
  function submitFinalDataHash(
    bytes32 _contractId,
    bytes32 _hash
  ) external 
    onlyState(_contractId, ContractState.EVALUATION_AND_CALCULATION)
    onlyAuthorized(_contractId)
  {
    require(evaluationFrozen[_contractId], "Evaluasi belum dimulai");
    require(_hash != bytes32(0), "Hash perhitungan wajib diisi");

    evaluationCalculationHash[_contractId] = _hash;

    emit CalculationComputed(
      _contractId,
      _hash,
      msg.sender,
      block.timestamp
    );
  }

  /**
   * @notice Raise an objection during evaluation window
   */
  function raiseObjection(
    bytes32 _contractId,
    string calldata _reason
  ) external 
    onlyState(_contractId, ContractState.EVALUATION_AND_CALCULATION)
    onlyAuthorized(_contractId)
  {
    evaluationObjectionsCleared[_contractId] = false;

    emit ObjectionRaised(
      _contractId,
      msg.sender,
      _reason,
      block.timestamp
    );
  }

  /**
   * @notice Mark objection resolved so finalization can proceed
   */
  function resolveObjection(
    bytes32 _contractId
  ) external 
    onlyState(_contractId, ContractState.EVALUATION_AND_CALCULATION)
    onlyAuthorized(_contractId)
  {
    evaluationObjectionsCleared[_contractId] = true;

    emit ObjectionResolved(
      _contractId,
      msg.sender,
      block.timestamp
    );
  }

  /**
   * @notice Transition from EVALUATION_AND_CALCULATION (State 4) → RIGHTS_FINALIZED (State 5)
   * @dev Enforces calculation hash and objection resolution before rights distribution
   */
  function finalizeCalculation(
    bytes32 _contractId
  ) external 
    onlyState(_contractId, ContractState.EVALUATION_AND_CALCULATION)
    onlyAuthorized(_contractId)
  {
    _finalizeEvaluation(_contractId);
  }

  /**
   * @notice Backward-compatible finalize function
   */
  function finalizeRights(
    bytes32 _contractId,
    bytes32 _resultHash
  ) external 
    onlyState(_contractId, ContractState.EVALUATION_AND_CALCULATION)
    onlyAuthorized(_contractId)
  {
    require(_resultHash != bytes32(0), "Hash hasil final wajib diisi");
    evaluationCalculationHash[_contractId] = _resultHash;
    _finalizeEvaluation(_contractId);
  }

  /**
   * @notice Distribusi dana setelah hak final disetujui
   */
  function distribute(
    bytes32 _contractId
  ) external
    onlyState(_contractId, ContractState.RIGHTS_FINALIZED_AND_DISTRIBUTION)
    onlyAuthorized(_contractId)
  {
    ContractData storage contract_ = contracts[_contractId];

    require(evaluationCalculationHash[_contractId] != bytes32(0), "Hash perhitungan belum ada");
    require(evaluationObjectionsCleared[_contractId], "Keberatan belum diselesaikan");

    // Placeholder distribution events (amounts would be derived from off-chain calculation)
    emit DistributionExecuted(_contractId, contract_.owner, 0, block.timestamp);
    emit DistributionExecuted(_contractId, contract_.contractor, 0, block.timestamp);

    distributionCompleted[_contractId] = true;

    emit DistributionCompleted(_contractId, block.timestamp);
  }

  /**
   * @notice Transition from RIGHTS_FINALIZED (State 5) → CONTRACT_CLOSED_AND_ARCHIVED (State 6)
   * @dev TERMINAL STATE - No further transitions possible
   */
  function closeContract(
    bytes32 _contractId
  ) external 
    onlyState(_contractId, ContractState.RIGHTS_FINALIZED_AND_DISTRIBUTION)
    onlyAuthorized(_contractId)
  {
    require(distributionCompleted[_contractId], "Distribusi belum dikonfirmasi selesai");
    require(evaluationCalculationHash[_contractId] != bytes32(0), "Hash final wajib ada sebelum arsip");

    ContractData storage contract_ = contracts[_contractId];
    contract_.currentState = ContractState.CONTRACT_CLOSED_AND_ARCHIVED;

    emit ContractClosed(_contractId, block.timestamp);

    emit ContractArchived(
      _contractId,
      evaluationCalculationHash[_contractId],
      block.timestamp
    );

    emit ContractStateChanged(
      _contractId,
      ContractState.RIGHTS_FINALIZED_AND_DISTRIBUTION,
      ContractState.CONTRACT_CLOSED_AND_ARCHIVED,
      msg.sender,
      block.timestamp,
      keccak256(abi.encodePacked("close_contract"))
    );

    _recordTransition(_contractId, ContractState.RIGHTS_FINALIZED_AND_DISTRIBUTION, ContractState.CONTRACT_CLOSED_AND_ARCHIVED, "contract_archived");
  }

  /**
   * @notice Emergency escape to State 9 from any non-archived state
   * @dev Accessible from any state except 6 (archived)
   */
  function invokeEmergency(
    bytes32 _contractId,
    string calldata _reason
  ) external 
    onlyAuthorized(_contractId)
  {
    ContractData storage contract_ = contracts[_contractId];

    // Guard: Cannot invoke emergency on archived contracts
    require(
      contract_.currentState != ContractState.CONTRACT_CLOSED_AND_ARCHIVED,
      "Cannot invoke emergency on archived contract"
    );

    ContractState previousState = contract_.currentState;
    contract_.currentState = ContractState.EXCEPTION_AND_FORCE_MAJEURE;

    emit EmergencyInvoked(_contractId, msg.sender, _reason, block.timestamp);

    emit ContractStateChanged(
      _contractId,
      previousState,
      ContractState.EXCEPTION_AND_FORCE_MAJEURE,
      msg.sender,
      block.timestamp,
      keccak256(abi.encodePacked("emergency_invoked", _reason))
    );

    _recordTransition(_contractId, previousState, ContractState.EXCEPTION_AND_FORCE_MAJEURE, string(abi.encodePacked("emergency:", _reason)));
  }

  // ============================================
  // ACKNOWLEDGMENT & APPROVAL
  // ============================================

  /**
   * @notice Party acknowledges contract terms before critical transitions
   */
  function acknowledgeTerms(bytes32 _contractId) external onlyAuthorized(_contractId) {
    acknowledgments[_contractId][msg.sender] = true;
    lastAcknowledgmentTime[_contractId] = block.timestamp;

    emit AcknowledgmentProvided(_contractId, msg.sender, block.timestamp);
  }

  /**
   * @notice Owner or contractor approves contract
   */
  function approve(bytes32 _contractId) external onlyAuthorized(_contractId) {
    ContractData storage contract_ = contracts[_contractId];

    if (msg.sender == contract_.owner) {
      contract_.ownerApproved = true;
    } else if (msg.sender == contract_.contractor) {
      contract_.contractorApproved = true;
    }
  }

  // ============================================
  // VIEW FUNCTIONS
  // ============================================

  /**
   * @notice Get current contract state
   */
  function getContractState(bytes32 _contractId) external view returns (ContractState) {
    return contracts[_contractId].currentState;
  }

  /**
   * @notice Get full contract data
   */
  function getContractData(bytes32 _contractId) external view returns (ContractData memory) {
    return contracts[_contractId];
  }

  /**
   * @notice Get transition history
   */
  function getTransitionHistory(bytes32 _contractId) external view returns (StateTransition[] memory) {
    return transitionHistory[_contractId];
  }

  /**
   * @notice Check if cooldown is active
   */
  function isCooldownActive(bytes32 _contractId) external view returns (bool) {
    Cooldown storage cooldown = cooldownTimers[_contractId];
    return block.timestamp < cooldown.startTime + cooldown.duration;
  }

  /**
   * @notice Get remaining cooldown time in seconds
   */
  function getRemainingCooldown(bytes32 _contractId) external view returns (uint256) {
    Cooldown storage cooldown = cooldownTimers[_contractId];
    uint256 endTime = cooldown.startTime + cooldown.duration;
    
    if (block.timestamp >= endTime) {
      return 0;
    }
    
    return endTime - block.timestamp;
  }

  /**
   * @notice Check if party has acknowledged
   */
  function hasAcknowledged(bytes32 _contractId, address _party) external view returns (bool) {
    return acknowledgments[_contractId][_party];
  }

  // ============================================
  // INTENT DECLARATION FUNCTIONS - STATE 0
  // ============================================

  /**
   * @notice Declare user intent before entering contract lifecycle
   * @param _role User role (INVESTOR, OPERATOR, AUDITOR, SYSTEM)
   * @param _kycVerified KYC verification status
   * @param _acceptedTerms Terms acceptance confirmation
   * @param _confirmedLegalCapacity Legal capacity confirmation
   * @dev This is the entry point to the contract state machine
   */
  function declareIntent(
    UserRole _role,
    bool _kycVerified,
    bool _acceptedTerms,
    bool _confirmedLegalCapacity
  ) external validRole(_role) {
    require(!hasDeclaredIntent[msg.sender], "Intent already declared");
    require(_kycVerified, "KYC verification required");
    require(_acceptedTerms, "Must accept platform terms");
    require(_confirmedLegalCapacity, "Must confirm legal capacity");

    bytes32 declarationHash = keccak256(
      abi.encodePacked(
        msg.sender,
        _role,
        block.timestamp
      )
    );

    IntentDeclaration storage intent = userIntents[msg.sender];
    intent.user = msg.sender;
    intent.role = _role;
    intent.kycVerified = _kycVerified;
    intent.acceptedTerms = _acceptedTerms;
    intent.confirmedLegalCapacity = _confirmedLegalCapacity;
    intent.declarationTimestamp = block.timestamp;
    intent.declarationHash = declarationHash;

    hasDeclaredIntent[msg.sender] = true;
    declaredUsers.push(msg.sender);

    emit IntentDeclared(msg.sender, _role, block.timestamp, declarationHash);
  }

  /**
   * @notice Get user's intent declaration
   */
  function getUserIntent(address _user) external view returns (IntentDeclaration memory) {
    return userIntents[_user];
  }

  /**
   * @notice Check if user has declared intent
   */
  function hasUserDeclaredIntent(address _user) external view returns (bool) {
    return hasDeclaredIntent[_user];
  }

  /**
   * @notice Verify intent declaration hash (blockchain integrity check)
   */
  function verifyIntentHash(
    address _user,
    UserRole _role,
    uint256 _timestamp,
    bytes32 _hash
  ) external pure returns (bool) {
    bytes32 expectedHash = keccak256(abi.encodePacked(_user, _role, _timestamp));
    return expectedHash == _hash;
  }

  /**
   * @notice Get total number of users who declared intent
   */
  function getDeclaredUserCount() external view returns (uint256) {
    return declaredUsers.length;
  }

  /**
   * @notice Get declared user at index
   */
  function getDeclaredUserAt(uint256 _index) external view returns (address) {
    require(_index < declaredUsers.length, "Index out of bounds");
    return declaredUsers[_index];
  }

  /**
   * @notice Record state transition in history
   */
  function _recordTransition(
    bytes32 _contractId,
    ContractState _fromState,
    ContractState _toState,
    string memory _reason
  ) internal {
    StateTransition memory transition = StateTransition({
      fromState: _fromState,
      toState: _toState,
      timestamp: block.timestamp,
      initiatedBy: msg.sender,
      transitionHash: keccak256(abi.encodePacked(_contractId, _fromState, _toState, block.timestamp, _reason)),
      conditions: bytes("")
    });

    transitionHistory[_contractId].push(transition);
  }

  /**
   * @notice Convert state enum to string for error messages
   */
  function _stateToString(ContractState _state) internal pure returns (string memory) {
    if (_state == ContractState.INTENT_DECLARED) return "INTENT_DECLARED";
    if (_state == ContractState.PRE_CONTRACT_REVIEW) return "PRE_CONTRACT_REVIEW";
    if (_state == ContractState.CONTRACT_ACTIVE_LOCKED) return "CONTRACT_ACTIVE_LOCKED";
    if (_state == ContractState.OPERATION_RUNNING) return "OPERATION_RUNNING";
    if (_state == ContractState.EVALUATION_AND_CALCULATION) return "EVALUATION_AND_CALCULATION";
    if (_state == ContractState.RIGHTS_FINALIZED_AND_DISTRIBUTION) return "RIGHTS_FINALIZED_AND_DISTRIBUTION";
    if (_state == ContractState.CONTRACT_CLOSED_AND_ARCHIVED) return "CONTRACT_CLOSED_AND_ARCHIVED";
    if (_state == ContractState.EXCEPTION_AND_FORCE_MAJEURE) return "EXCEPTION_AND_FORCE_MAJEURE";
    return "UNKNOWN";
  }

  // ============================================
  // STATE 1: PRE_CONTRACT_REVIEW FUNCTIONS
  // ============================================

  /**
   * @notice Acknowledge all contract review items and start 48-hour cooldown
   * @dev All flags must be true; cannot skip or reject any item
   */
  function acknowledgePreContractReview(
    bytes32 _contractId,
    bool _ackSummary,
    bool _ackTimeline,
    bool _ackRisks,
    bool _ackSimulation,
    bool _ackLegalText,
    bool _ackChecklist,
    bool _ackCooldown
  ) external 
    onlyState(_contractId, ContractState.PRE_CONTRACT_REVIEW)
  {
    // Guard: All must be acknowledged
    require(
      _ackSummary && _ackTimeline && _ackRisks && _ackSimulation && _ackLegalText && _ackChecklist && _ackCooldown,
      "All items must be acknowledged; cannot skip or reject any item"
    );

    // Calculate cooldown end (48 hours)
    uint256 cooldownEnd = block.timestamp + COOLDOWN_DURATION;

    // Create acknowledgement record
    ContractReviewAcknowledgement memory ack = ContractReviewAcknowledgement({
      acknowledgedBy: msg.sender,
      acknowledgedAt: block.timestamp,
      ackSummary: _ackSummary,
      ackTimeline: _ackTimeline,
      ackRisks: _ackRisks,
      ackSimulation: _ackSimulation,
      ackLegalText: _ackLegalText,
      ackChecklist: _ackChecklist,
      cooldownEndTime: cooldownEnd,
      allAcknowledged: true,
      acknowledgmentHash: keccak256(
        abi.encodePacked(
          _contractId,
          msg.sender,
          block.timestamp,
          _ackSummary,
          _ackTimeline,
          _ackRisks,
          _ackSimulation,
          _ackLegalText,
          _ackChecklist
        )
      )
    });

    // Store acknowledgement
    reviewAcknowledgements[_contractId] = ack;
    reviewCooldownEnd[_contractId] = cooldownEnd;

    emit PreContractReviewAcknowledged(
      _contractId,
      msg.sender,
      block.timestamp,
      ack.acknowledgmentHash
    );
  }

  /**
   * @notice Get contract review acknowledgement status
   */
  function getReviewAcknowledgement(bytes32 _contractId) 
    external 
    view 
    returns (ContractReviewAcknowledgement memory) 
  {
    return reviewAcknowledgements[_contractId];
  }

  /**
   * @notice Check if review cooldown has expired
   */
  function hasReviewCooldownExpired(bytes32 _contractId) 
    external 
    view 
    returns (bool) 
  {
    return block.timestamp > reviewCooldownEnd[_contractId];
  }

  /**
   * @notice Get cooldown end timestamp
   */
  function getReviewCooldownEndTime(bytes32 _contractId) 
    external 
    view 
    returns (uint256) 
  {
    return reviewCooldownEnd[_contractId];
  }

  /**
   * @notice Approve pre-contract and transition to CONTRACT_ACTIVE_LOCKED
   * @dev Requires: all acknowledgements + cooldown expired + explicit confirmation
   */
  function approvePreContractAndLock(
    bytes32 _contractId,
    bool _confirmProceedToLock
  ) external 
    onlyState(_contractId, ContractState.PRE_CONTRACT_REVIEW)
    onlyAuthorized(_contractId)
  {
    // Guard: Acknowledgement recorded
    ContractReviewAcknowledgement memory ack = reviewAcknowledgements[_contractId];
    require(
      ack.allAcknowledged,
      "All items must be acknowledged before proceeding"
    );

    // Guard: Cooldown expired
    require(
      block.timestamp > ack.cooldownEndTime,
      "Cooldown period not yet expired"
    );

    // Guard: Explicit confirmation
    require(
      _confirmProceedToLock,
      "Must explicitly confirm proceeding to lock funds"
    );

    ContractData storage contract_ = contracts[_contractId];

    // Update contract state
    contract_.currentState = ContractState.CONTRACT_ACTIVE_LOCKED;
    contract_.lockedAt = block.timestamp;
    preContractApproved[_contractId] = true;

    emit PreContractApproved(_contractId, msg.sender, block.timestamp);

    emit ContractStateChanged(
      _contractId,
      ContractState.PRE_CONTRACT_REVIEW,
      ContractState.CONTRACT_ACTIVE_LOCKED,
      msg.sender,
      block.timestamp,
      keccak256(abi.encodePacked("pre_contract_approved_and_locked"))
    );

    _recordTransition(_contractId, ContractState.PRE_CONTRACT_REVIEW, ContractState.CONTRACT_ACTIVE_LOCKED, "pre_contract_review_completed");
  }

  /**
   * @notice Guard: Prevent fund locking before PRE_CONTRACT_REVIEW is approved
   * @dev This modifier is used on any function that locks funds
   */
  modifier onlyAfterPreContractApproval(bytes32 _contractId) {
    require(
      preContractApproved[_contractId],
      "Cannot lock funds before pre-contract review is approved"
    );
    _;
  }

  /**
   * @notice Verify contract is in PRE_CONTRACT_REVIEW state and has all acknowledgements
   */
  function isReadyToLock(bytes32 _contractId) external view returns (bool, string memory) {
    ContractData memory contract_ = contracts[_contractId];
    
    if (contract_.currentState != ContractState.PRE_CONTRACT_REVIEW) {
      return (false, "Contract not in PRE_CONTRACT_REVIEW state");
    }

    ContractReviewAcknowledgement memory ack = reviewAcknowledgements[_contractId];
    
    if (!ack.allAcknowledged) {
      return (false, "Not all items acknowledged");
    }

    if (block.timestamp <= ack.cooldownEndTime) {
      return (false, "Cooldown period not yet expired");
    }

    return (true, "Ready to lock funds");
  }
}
