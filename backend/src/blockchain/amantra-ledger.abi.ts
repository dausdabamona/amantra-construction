// ABI for AmantraLedger Smart Contract
// Generated from AmantraLedger.sol

export const AMANTRA_LEDGER_ABI = [
  // Events
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "contractId", "type": "string" },
      { "indexed": false, "name": "documentHash", "type": "bytes32" },
      { "indexed": false, "name": "totalValue", "type": "uint256" },
      { "indexed": false, "name": "termCount", "type": "uint256" },
      { "indexed": false, "name": "timestamp", "type": "uint256" }
    ],
    "name": "ContractRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "termId", "type": "string" },
      { "indexed": true, "name": "verifier", "type": "address" },
      { "indexed": false, "name": "role", "type": "string" },
      { "indexed": false, "name": "approved", "type": "bool" },
      { "indexed": false, "name": "timestamp", "type": "uint256" }
    ],
    "name": "VerificationRecorded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "termId", "type": "string" },
      { "indexed": false, "name": "amount", "type": "uint256" },
      { "indexed": false, "name": "transactionRef", "type": "string" },
      { "indexed": false, "name": "timestamp", "type": "uint256" }
    ],
    "name": "PaymentConfirmed",
    "type": "event"
  },

  // Write Functions
  {
    "inputs": [
      { "name": "contractId", "type": "string" },
      { "name": "documentHash", "type": "bytes32" },
      { "name": "totalValue", "type": "uint256" },
      { "name": "termCount", "type": "uint256" }
    ],
    "name": "registerContract",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "termId", "type": "string" },
      { "name": "termHash", "type": "bytes32" },
      { "name": "role", "type": "string" },
      { "name": "approved", "type": "bool" },
      { "name": "notes", "type": "string" }
    ],
    "name": "recordVerification",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "termId", "type": "string" },
      { "name": "amount", "type": "uint256" },
      { "name": "transactionRef", "type": "string" },
      { "name": "proofHash", "type": "bytes32" }
    ],
    "name": "confirmPayment",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // Read Functions
  {
    "inputs": [{ "name": "contractId", "type": "string" }],
    "name": "getContract",
    "outputs": [
      { "name": "documentHash", "type": "bytes32" },
      { "name": "totalValue", "type": "uint256" },
      { "name": "termCount", "type": "uint256" },
      { "name": "registeredAt", "type": "uint256" },
      { "name": "registeredBy", "type": "address" },
      { "name": "exists", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "termId", "type": "string" }],
    "name": "getVerifications",
    "outputs": [
      {
        "components": [
          { "name": "visibleTermId", "type": "string" },
          { "name": "termHash", "type": "bytes32" },
          { "name": "verifier", "type": "address" },
          { "name": "role", "type": "string" },
          { "name": "approved", "type": "bool" },
          { "name": "notes", "type": "string" },
          { "name": "verifiedAt", "type": "uint256" }
        ],
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "termId", "type": "string" }],
    "name": "getVerificationCount",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "termId", "type": "string" }],
    "name": "getPayment",
    "outputs": [
      { "name": "amount", "type": "uint256" },
      { "name": "transactionRef", "type": "string" },
      { "name": "proofHash", "type": "bytes32" },
      { "name": "paidAt", "type": "uint256" },
      { "name": "confirmedBy", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "termId", "type": "string" }],
    "name": "isPaymentConfirmed",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "contractId", "type": "string" },
      { "name": "hash", "type": "bytes32" }
    ],
    "name": "verifyDocumentHash",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getContractsCount",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getVerifiedTermsCount",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPaidTermsCount",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
