// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AmantraLedger
 * @dev Smart contract untuk mencatat verifikasi dan pembayaran konstruksi di blockchain
 * @notice Contract ini digunakan untuk membuat audit trail yang immutable
 */
contract AmantraLedger {
    // ============================================
    // STRUCTS
    // ============================================

    struct ContractRecord {
        bytes32 documentHash;      // Hash dari dokumen kontrak
        uint256 totalValue;        // Nilai total kontrak (dalam wei/satuan terkecil)
        uint256 termCount;         // Jumlah termin
        uint256 registeredAt;      // Timestamp registrasi
        address registeredBy;      // Alamat yang mendaftarkan
        bool exists;               // Flag untuk cek keberadaan
    }

    struct VerificationRecord {
        string visibleTermId;      // Term ID yang visible (untuk query)
        bytes32 termHash;          // Hash dari data term
        address verifier;          // Alamat verifier
        string role;               // SUPERVISOR atau WITNESS
        bool approved;             // Status approval
        string notes;              // Catatan verifikasi
        uint256 verifiedAt;        // Timestamp verifikasi
    }

    struct PaymentRecord {
        string visibleTermId;      // Term ID yang visible
        uint256 amount;            // Jumlah pembayaran
        string transactionRef;     // Referensi transaksi (dari payment gateway)
        bytes32 proofHash;         // Hash dari bukti pembayaran
        uint256 paidAt;            // Timestamp pembayaran
        address confirmedBy;       // Alamat yang konfirmasi
    }

    // ============================================
    // STATE VARIABLES
    // ============================================

    address public owner;
    address public operator;  // Backend service wallet

    // Mappings
    mapping(string => ContractRecord) public contracts;           // contractId => ContractRecord
    mapping(string => VerificationRecord[]) public verifications; // termId => VerificationRecord[]
    mapping(string => PaymentRecord) public payments;             // termId => PaymentRecord

    // Arrays untuk enumeration
    string[] public contractIds;
    string[] public verifiedTermIds;
    string[] public paidTermIds;

    // ============================================
    // EVENTS
    // ============================================

    event ContractRegistered(
        string indexed contractId,
        bytes32 documentHash,
        uint256 totalValue,
        uint256 termCount,
        uint256 timestamp
    );

    event VerificationRecorded(
        string indexed termId,
        address indexed verifier,
        string role,
        bool approved,
        uint256 timestamp
    );

    event PaymentConfirmed(
        string indexed termId,
        uint256 amount,
        string transactionRef,
        uint256 timestamp
    );

    event OperatorChanged(address indexed oldOperator, address indexed newOperator);

    // ============================================
    // MODIFIERS
    // ============================================

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyOperator() {
        require(msg.sender == operator || msg.sender == owner, "Only operator can call this function");
        _;
    }

    // ============================================
    // CONSTRUCTOR
    // ============================================

    constructor(address _operator) {
        owner = msg.sender;
        operator = _operator;
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    function setOperator(address _newOperator) external onlyOwner {
        require(_newOperator != address(0), "Invalid operator address");
        address oldOperator = operator;
        operator = _newOperator;
        emit OperatorChanged(oldOperator, _newOperator);
    }

    // ============================================
    // MAIN FUNCTIONS
    // ============================================

    /**
     * @dev Register a new contract on-chain
     * @param contractId Unique identifier for the contract
     * @param documentHash Hash of the contract document
     * @param totalValue Total value of the contract
     * @param termCount Number of terms in the contract
     */
    function registerContract(
        string calldata contractId,
        bytes32 documentHash,
        uint256 totalValue,
        uint256 termCount
    ) external onlyOperator {
        require(!contracts[contractId].exists, "Contract already registered");
        require(bytes(contractId).length > 0, "Contract ID cannot be empty");

        contracts[contractId] = ContractRecord({
            documentHash: documentHash,
            totalValue: totalValue,
            termCount: termCount,
            registeredAt: block.timestamp,
            registeredBy: msg.sender,
            exists: true
        });

        contractIds.push(contractId);

        emit ContractRegistered(
            contractId,
            documentHash,
            totalValue,
            termCount,
            block.timestamp
        );
    }

    /**
     * @dev Record a verification on-chain
     * @param termId Unique identifier for the term
     * @param termHash Hash of the term data
     * @param role Role of verifier (SUPERVISOR or WITNESS)
     * @param approved Whether the verification is approved
     * @param notes Verification notes
     */
    function recordVerification(
        string calldata termId,
        bytes32 termHash,
        string calldata role,
        bool approved,
        string calldata notes
    ) external onlyOperator {
        require(bytes(termId).length > 0, "Term ID cannot be empty");

        // Check if this role already verified this term
        VerificationRecord[] storage termVerifications = verifications[termId];
        for (uint i = 0; i < termVerifications.length; i++) {
            require(
                keccak256(bytes(termVerifications[i].role)) != keccak256(bytes(role)),
                "This role already verified this term"
            );
        }

        verifications[termId].push(VerificationRecord({
            visibleTermId: termId,
            termHash: termHash,
            verifier: msg.sender,
            role: role,
            approved: approved,
            notes: notes,
            verifiedAt: block.timestamp
        }));

        // Add to verified terms if first verification
        if (termVerifications.length == 0) {
            verifiedTermIds.push(termId);
        }

        emit VerificationRecorded(
            termId,
            msg.sender,
            role,
            approved,
            block.timestamp
        );
    }

    /**
     * @dev Confirm a payment on-chain
     * @param termId Unique identifier for the term
     * @param amount Payment amount
     * @param transactionRef Reference from payment gateway
     * @param proofHash Hash of payment proof
     */
    function confirmPayment(
        string calldata termId,
        uint256 amount,
        string calldata transactionRef,
        bytes32 proofHash
    ) external onlyOperator {
        require(bytes(termId).length > 0, "Term ID cannot be empty");
        require(payments[termId].paidAt == 0, "Payment already confirmed");
        require(amount > 0, "Amount must be greater than 0");

        payments[termId] = PaymentRecord({
            visibleTermId: termId,
            amount: amount,
            transactionRef: transactionRef,
            proofHash: proofHash,
            paidAt: block.timestamp,
            confirmedBy: msg.sender
        });

        paidTermIds.push(termId);

        emit PaymentConfirmed(
            termId,
            amount,
            transactionRef,
            block.timestamp
        );
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @dev Get contract details
     */
    function getContract(string calldata contractId) external view returns (
        bytes32 documentHash,
        uint256 totalValue,
        uint256 termCount,
        uint256 registeredAt,
        address registeredBy,
        bool exists
    ) {
        ContractRecord storage c = contracts[contractId];
        return (
            c.documentHash,
            c.totalValue,
            c.termCount,
            c.registeredAt,
            c.registeredBy,
            c.exists
        );
    }

    /**
     * @dev Get all verifications for a term
     */
    function getVerifications(string calldata termId) external view returns (VerificationRecord[] memory) {
        return verifications[termId];
    }

    /**
     * @dev Get verification count for a term
     */
    function getVerificationCount(string calldata termId) external view returns (uint256) {
        return verifications[termId].length;
    }

    /**
     * @dev Get payment details for a term
     */
    function getPayment(string calldata termId) external view returns (
        uint256 amount,
        string memory transactionRef,
        bytes32 proofHash,
        uint256 paidAt,
        address confirmedBy
    ) {
        PaymentRecord storage p = payments[termId];
        return (
            p.amount,
            p.transactionRef,
            p.proofHash,
            p.paidAt,
            p.confirmedBy
        );
    }

    /**
     * @dev Check if payment exists for a term
     */
    function isPaymentConfirmed(string calldata termId) external view returns (bool) {
        return payments[termId].paidAt > 0;
    }

    /**
     * @dev Get total registered contracts count
     */
    function getContractsCount() external view returns (uint256) {
        return contractIds.length;
    }

    /**
     * @dev Get total verified terms count
     */
    function getVerifiedTermsCount() external view returns (uint256) {
        return verifiedTermIds.length;
    }

    /**
     * @dev Get total paid terms count
     */
    function getPaidTermsCount() external view returns (uint256) {
        return paidTermIds.length;
    }

    /**
     * @dev Verify document hash matches
     */
    function verifyDocumentHash(string calldata contractId, bytes32 hash) external view returns (bool) {
        return contracts[contractId].documentHash == hash;
    }
}
