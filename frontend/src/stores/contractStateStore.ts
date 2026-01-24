import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import axios from 'axios';

/**
 * Global enum - shared with Backend and Smart Contract
 */
export enum ContractState {
  INTENT_DECLARED = 0,
  PRE_CONTRACT_REVIEW = 1,
  CONTRACT_ACTIVE_LOCKED = 2,
  OPERATION_RUNNING = 3,
  EVALUATION_AND_CALCULATION = 4,
  RIGHTS_FINALIZED_AND_DISTRIBUTION = 5,
  CONTRACT_CLOSED_AND_ARCHIVED = 6,
  EXCEPTION_AND_FORCE_MAJEURE = 9,
}

export const stateLabels: Record<ContractState, string> = {
  [ContractState.INTENT_DECLARED]: 'Intent Declared',
  [ContractState.PRE_CONTRACT_REVIEW]: 'Legal Review',
  [ContractState.CONTRACT_ACTIVE_LOCKED]: 'Active & Locked',
  [ContractState.OPERATION_RUNNING]: 'Operation Running',
  [ContractState.EVALUATION_AND_CALCULATION]: 'Evaluation',
  [ContractState.RIGHTS_FINALIZED_AND_DISTRIBUTION]: 'Distribution',
  [ContractState.CONTRACT_CLOSED_AND_ARCHIVED]: 'Archived',
  [ContractState.EXCEPTION_AND_FORCE_MAJEURE]: 'Emergency',
};

export const stateColors: Record<ContractState, string> = {
  [ContractState.INTENT_DECLARED]: 'blue',
  [ContractState.PRE_CONTRACT_REVIEW]: 'cyan',
  [ContractState.CONTRACT_ACTIVE_LOCKED]: 'amber',
  [ContractState.OPERATION_RUNNING]: 'green',
  [ContractState.EVALUATION_AND_CALCULATION]: 'purple',
  [ContractState.RIGHTS_FINALIZED_AND_DISTRIBUTION]: 'indigo',
  [ContractState.CONTRACT_CLOSED_AND_ARCHIVED]: 'gray',
  [ContractState.EXCEPTION_AND_FORCE_MAJEURE]: 'red',
};

// ============================================
// TYPES
// ============================================

export interface StateMetadata {
  rights: string[];
  obligations: string[];
  deadline: string;
  responsibleParty: string;
  waitingFor: string;
  immutable?: boolean;
  terminal?: boolean;
  emergency?: boolean;
}

export interface CooldownStatus {
  isActive: boolean;
  expiresAt: Date | null;
  remainingMs: number;
  remainingHours: number;
}

export interface ContractStateContext {
  contractId: string;
  currentState: ContractState;
  stateMetadata: StateMetadata;
  project: any;
  terms: any[];
  transitions: any[];
}

export interface Acknowledgment {
  contractId: string;
  acknowledged: true;
  timestamp: Date;
  documentHash: string;
}

// ============================================
// STORE
// ============================================

export interface ContractStateStore {
  // State
  contractId: string | null;
  currentState: ContractState | null;
  stateContext: ContractStateContext | null;
  cooldownStatus: CooldownStatus | null;
  acknowledgments: Record<string, boolean>;
  transitions: any[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setContractId: (contractId: string) => void;
  fetchContractState: (contractId: string) => Promise<void>;
  fetchStateContext: (contractId: string) => Promise<void>;
  fetchCooldownStatus: (contractId: string) => Promise<void>;

  // Transitions with UI confirmations
  transitionToReview: (contractId: string) => Promise<void>;
  lockContract: (contractId: string, acknowledgments: string[]) => Promise<void>;
  startExecution: (contractId: string) => Promise<void>;
  submitForEvaluation: (contractId: string) => Promise<void>;
  finalizeRights: (contractId: string) => Promise<void>;
  closeContract: (contractId: string) => Promise<void>;
  invokeEmergency: (contractId: string, reason: string) => Promise<void>;

  // Acknowledgments
  acknowledgeTerms: (contractId: string, documentHash: string, ipAddress: string) => Promise<void>;

  // Utilities
  getStateLabel: (state: ContractState) => string;
  getStateColor: (state: ContractState) => string;
  getStateMetadata: (state: ContractState) => StateMetadata;
  canTransitionTo: (nextState: ContractState) => boolean;
  clearError: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const useContractStateStore = create<ContractStateStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    contractId: null,
    currentState: null,
    stateContext: null,
    cooldownStatus: null,
    acknowledgments: {},
    transitions: [],
    isLoading: false,
    error: null,

    // ============================================
    // ACTIONS - QUERIES
    // ============================================

    setContractId: (contractId: string) => set({ contractId }),

    fetchContractState: async (contractId: string) => {
      set({ isLoading: true, error: null });
      try {
        const response = await axios.get(`${API_URL}/contract-state/${contractId}/state`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });

        const stateValue = Object.values(ContractState).includes(response.data.state)
          ? response.data.state
          : ContractState.INTENT_DECLARED;

        set({ currentState: stateValue as ContractState, isLoading: false });
      } catch (error: any) {
        set({ error: error.message || 'Failed to fetch contract state', isLoading: false });
      }
    },

    fetchStateContext: async (contractId: string) => {
      set({ isLoading: true, error: null });
      try {
        const response = await axios.get(`${API_URL}/contract-state/${contractId}/context`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });

        set({
          stateContext: response.data,
          currentState: response.data.currentState,
          transitions: response.data.transitions,
          isLoading: false,
        });
      } catch (error: any) {
        set({ error: error.message || 'Failed to fetch state context', isLoading: false });
      }
    },

    fetchCooldownStatus: async (contractId: string) => {
      try {
        const response = await axios.get(`${API_URL}/contract-state/${contractId}/cooldown`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });

        set({
          cooldownStatus: {
            ...response.data,
            expiresAt: response.data.expiresAt ? new Date(response.data.expiresAt) : null,
          },
        });
      } catch (error: any) {
        console.error('Failed to fetch cooldown status:', error);
      }
    },

    // ============================================
    // ACTIONS - TRANSITIONS
    // ============================================

    transitionToReview: async (contractId: string) => {
      set({ isLoading: true, error: null });
      try {
        const response = await axios.post(
          `${API_URL}/contract-state/${contractId}/transition/to-review`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
          }
        );

        set({
          currentState: ContractState.PRE_CONTRACT_REVIEW,
          isLoading: false,
        });

        // Refetch context
        await get().fetchStateContext(contractId);
      } catch (error: any) {
        set({ error: error.message || 'Failed to transition', isLoading: false });
        throw error;
      }
    },

    lockContract: async (contractId: string, acknowledgments: string[]) => {
      set({ isLoading: true, error: null });
      try {
        // Ensure all parties have acknowledged
        for (const ack of acknowledgments) {
          if (!get().acknowledgments[ack]) {
            throw new Error('All parties must acknowledge before locking');
          }
        }

        const response = await axios.post(
          `${API_URL}/contract-state/${contractId}/transition/lock`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
          }
        );

        set({
          currentState: ContractState.CONTRACT_ACTIVE_LOCKED,
          cooldownStatus: response.data.cooldown,
          isLoading: false,
        });

        // Start cooldown polling
        const pollInterval = setInterval(async () => {
          try {
            await get().fetchCooldownStatus(contractId);
            const cooldown = get().cooldownStatus;
            if (cooldown && !cooldown.isActive) {
              clearInterval(pollInterval);
            }
          } catch (error) {
            clearInterval(pollInterval);
          }
        }, 5000); // Poll every 5 seconds

        // Auto-refetch context
        await get().fetchStateContext(contractId);
      } catch (error: any) {
        set({ error: error.message || 'Failed to lock contract', isLoading: false });
        throw error;
      }
    },

    startExecution: async (contractId: string) => {
      set({ isLoading: true, error: null });
      try {
        const response = await axios.post(
          `${API_URL}/contract-state/${contractId}/transition/start-execution`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
          }
        );

        set({
          currentState: ContractState.OPERATION_RUNNING,
          isLoading: false,
        });

        await get().fetchStateContext(contractId);
      } catch (error: any) {
        set({ error: error.message || 'Failed to start execution', isLoading: false });
        throw error;
      }
    },

    submitForEvaluation: async (contractId: string) => {
      set({ isLoading: true, error: null });
      try {
        await axios.post(
          `${API_URL}/contract-state/${contractId}/transition/submit-for-evaluation`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
          }
        );

        set({
          currentState: ContractState.EVALUATION_AND_CALCULATION,
          isLoading: false,
        });

        await get().fetchStateContext(contractId);
      } catch (error: any) {
        set({ error: error.message || 'Failed to submit for evaluation', isLoading: false });
        throw error;
      }
    },

    finalizeRights: async (contractId: string) => {
      set({ isLoading: true, error: null });
      try {
        await axios.post(
          `${API_URL}/contract-state/${contractId}/transition/finalize-rights`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
          }
        );

        set({
          currentState: ContractState.RIGHTS_FINALIZED_AND_DISTRIBUTION,
          isLoading: false,
        });

        await get().fetchStateContext(contractId);
      } catch (error: any) {
        set({ error: error.message || 'Failed to finalize rights', isLoading: false });
        throw error;
      }
    },

    closeContract: async (contractId: string) => {
      set({ isLoading: true, error: null });
      try {
        await axios.post(
          `${API_URL}/contract-state/${contractId}/transition/close`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
          }
        );

        set({
          currentState: ContractState.CONTRACT_CLOSED_AND_ARCHIVED,
          isLoading: false,
        });

        // Refetch context with new archived state
        await get().fetchStateContext(contractId);
      } catch (error: any) {
        set({ error: error.message || 'Failed to close contract', isLoading: false });
        throw error;
      }
    },

    invokeEmergency: async (contractId: string, reason: string) => {
      set({ isLoading: true, error: null });
      try {
        await axios.post(
          `${API_URL}/contract-state/${contractId}/transition/emergency`,
          { reason },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
          }
        );

        set({
          currentState: ContractState.EXCEPTION_AND_FORCE_MAJEURE,
          isLoading: false,
        });

        await get().fetchStateContext(contractId);
      } catch (error: any) {
        set({ error: error.message || 'Failed to invoke emergency', isLoading: false });
        throw error;
      }
    },

    // ============================================
    // ACTIONS - ACKNOWLEDGMENTS
    // ============================================

    acknowledgeTerms: async (contractId: string, documentHash: string, ipAddress: string) => {
      try {
        await axios.post(
          `${API_URL}/contract-state/${contractId}/acknowledge`,
          { documentHash, ipAddress },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
          }
        );

        set((state) => ({
          acknowledgments: {
            ...state.acknowledgments,
            [contractId]: true,
          },
        }));
      } catch (error: any) {
        set({ error: error.message || 'Failed to acknowledge terms' });
        throw error;
      }
    },

    // ============================================
    // UTILITIES
    // ============================================

    getStateLabel: (state: ContractState) => stateLabels[state] || 'Unknown',

    getStateColor: (state: ContractState) => stateColors[state] || 'gray',

    getStateMetadata: (state: ContractState): StateMetadata => {
      const metadata: Record<ContractState, StateMetadata> = {
        [ContractState.INTENT_DECLARED]: {
          rights: ['View draft', 'Propose changes'],
          obligations: ['Submit documents', 'Sign intent'],
          deadline: '7 days',
          responsibleParty: 'Both parties',
          waitingFor: 'Other party signature',
        },
        [ContractState.PRE_CONTRACT_REVIEW]: {
          rights: ['Propose amendments', 'Review legal'],
          obligations: ['Legal review', 'Approve terms'],
          deadline: '14 days',
          responsibleParty: 'Legal team',
          waitingFor: 'Legal sign-off',
        },
        [ContractState.CONTRACT_ACTIVE_LOCKED]: {
          rights: ['Read contract (immutable)'],
          obligations: ['Prepare execution'],
          deadline: '48 hours cooldown',
          responsibleParty: 'Contractor',
          waitingFor: 'Cooldown expiration',
          immutable: true,
        },
        [ContractState.OPERATION_RUNNING]: {
          rights: ['Submit reports', 'Request payment'],
          obligations: ['Execute per schedule'],
          deadline: 'Per milestone schedule',
          responsibleParty: 'Contractor',
          waitingFor: 'Milestone completion',
        },
        [ContractState.EVALUATION_AND_CALCULATION]: {
          rights: ['Review calculations', 'Contest results'],
          obligations: ['Compute metrics', 'Verify'],
          deadline: '10 days',
          responsibleParty: 'Evaluator',
          waitingFor: 'Verification completion',
        },
        [ContractState.RIGHTS_FINALIZED_AND_DISTRIBUTION]: {
          rights: ['Execute transfers'],
          obligations: ['Complete settlement'],
          deadline: '5 days',
          responsibleParty: 'Treasury',
          waitingFor: 'Transfer confirmation',
        },
        [ContractState.CONTRACT_CLOSED_AND_ARCHIVED]: {
          rights: ['Read-only archive'],
          obligations: [],
          deadline: 'None',
          responsibleParty: 'None',
          waitingFor: 'None',
          terminal: true,
        },
        [ContractState.EXCEPTION_AND_FORCE_MAJEURE]: {
          rights: ['Invoke protocols', 'Propose resolution'],
          obligations: ['Dispute documentation'],
          deadline: '20 days',
          responsibleParty: 'Either party',
          waitingFor: 'Dispute settlement',
          emergency: true,
        },
      };

      return metadata[state] || {
        rights: [],
        obligations: [],
        deadline: 'Unknown',
        responsibleParty: 'Unknown',
        waitingFor: 'Unknown',
      };
    },

    canTransitionTo: (nextState: ContractState): boolean => {
      const current = get().currentState;
      if (current === null) return false;

      // Define allowed transitions
      const allowedTransitions: Record<ContractState, ContractState[]> = {
        [ContractState.INTENT_DECLARED]: [ContractState.PRE_CONTRACT_REVIEW],
        [ContractState.PRE_CONTRACT_REVIEW]: [ContractState.CONTRACT_ACTIVE_LOCKED],
        [ContractState.CONTRACT_ACTIVE_LOCKED]: [ContractState.OPERATION_RUNNING],
        [ContractState.OPERATION_RUNNING]: [ContractState.EVALUATION_AND_CALCULATION],
        [ContractState.EVALUATION_AND_CALCULATION]: [ContractState.RIGHTS_FINALIZED_AND_DISTRIBUTION],
        [ContractState.RIGHTS_FINALIZED_AND_DISTRIBUTION]: [ContractState.CONTRACT_CLOSED_AND_ARCHIVED],
        [ContractState.CONTRACT_CLOSED_AND_ARCHIVED]: [],
        [ContractState.EXCEPTION_AND_FORCE_MAJEURE]: [ContractState.CONTRACT_CLOSED_AND_ARCHIVED],
      };

      // Can always transition to emergency from non-archived states
      if (nextState === ContractState.EXCEPTION_AND_FORCE_MAJEURE && current !== ContractState.CONTRACT_CLOSED_AND_ARCHIVED) {
        return true;
      }

      return allowedTransitions[current]?.includes(nextState) || false;
    },

    clearError: () => set({ error: null }),
  }))
);
