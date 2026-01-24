import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ContractStateData,
  LockedStatusCardData,
  RightObligationItem,
  NextConditionData,
  LockPanelState,
} from '../types/contract-lock';

interface ContractLockStore {
  // Data
  contractId: string | null;
  contractState: ContractStateData | null;
  lockedStatus: LockedStatusCardData | null;
  rightsObligations: RightObligationItem[];
  nextCondition: NextConditionData | null;
  
  // UI State
  panelState: LockPanelState;
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  successMessage: string | null;
  
  // Timing
  cooldownEndTime: number | null;
  cooldownRemaining: number | null;
  operationStartCountdown: number | null;
  
  // Actions
  setContractId: (id: string) => void;
  setContractState: (state: ContractStateData) => void;
  setLockedStatus: (status: LockedStatusCardData) => void;
  setRightsObligations: (items: RightObligationItem[]) => void;
  setNextCondition: (condition: NextConditionData) => void;
  
  setIsLoading: (loading: boolean) => void;
  setIsFetching: (fetching: boolean) => void;
  setError: (error: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
  
  setPanelState: (state: Partial<LockPanelState>) => void;
  setActiveTab: (tab: LockPanelState['activeTab']) => void;
  toggleSection: (sectionId: string) => void;
  setSelectedParty: (party: 'Contractor' | 'ProjectOwner' | 'all') => void;
  setIsComparing: (comparing: boolean) => void;
  
  setCooldownEndTime: (time: number | null) => void;
  setCooldownRemaining: (remaining: number | null) => void;
  updateCooldownRemaining: () => void;
  
  setOperationStartCountdown: (countdown: number | null) => void;
  updateOperationStartCountdown: () => void;
  
  // Computed
  isFundsLocked: () => boolean;
  isOperationStart: () => boolean;
  isReadyForNextState: () => boolean;
  getFilteredObligations: (party?: 'Contractor' | 'ProjectOwner') => RightObligationItem[];
  
  // Reset
  reset: () => void;
}

const initialPanelState: LockPanelState = {
  activeTab: 'overview',
  expandedSections: {},
  selectedParty: 'all',
  isComparing: false,
};

export const useContractLockStore = create<ContractLockStore>()(
  persist(
    (set, get) => ({
      // Initial state
      contractId: null,
      contractState: null,
      lockedStatus: null,
      rightsObligations: [],
      nextCondition: null,
      
      panelState: initialPanelState,
      isLoading: false,
      isFetching: false,
      error: null,
      successMessage: null,
      
      cooldownEndTime: null,
      cooldownRemaining: null,
      operationStartCountdown: null,
      
      // Data setters
      setContractId: (id: string) => set({ contractId: id }),
      
      setContractState: (state: ContractStateData) => {
        set({ contractState: state });
        
        // If operation start date exists, calculate countdown
        if (state.operationStartDate) {
          const startTime = new Date(state.operationStartDate).getTime();
          const countdown = Math.max(0, Math.ceil((startTime - Date.now()) / 1000));
          set({ operationStartCountdown: countdown });
        }
      },
      
      setLockedStatus: (status: LockedStatusCardData) => set({ lockedStatus: status }),
      
      setRightsObligations: (items: RightObligationItem[]) => set({ rightsObligations: items }),
      
      setNextCondition: (condition: NextConditionData) => set({ nextCondition: condition }),
      
      // UI State setters
      setIsLoading: (loading: boolean) => set({ isLoading: loading }),
      
      setIsFetching: (fetching: boolean) => set({ isFetching: fetching }),
      
      setError: (error: string | null) => set({ error }),
      
      setSuccessMessage: (message: string | null) => set({ successMessage: message }),
      
      // Panel state management
      setPanelState: (partial: Partial<LockPanelState>) => {
        set((state) => ({
          panelState: { ...state.panelState, ...partial },
        }));
      },
      
      setActiveTab: (tab: LockPanelState['activeTab']) => {
        set((state) => ({
          panelState: { ...state.panelState, activeTab: tab },
        }));
      },
      
      toggleSection: (sectionId: string) => {
        set((state) => ({
          panelState: {
            ...state.panelState,
            expandedSections: {
              ...state.panelState.expandedSections,
              [sectionId]: !state.panelState.expandedSections[sectionId],
            },
          },
        }));
      },
      
      setSelectedParty: (party: 'Contractor' | 'ProjectOwner' | 'all') => {
        set((state) => ({
          panelState: { ...state.panelState, selectedParty: party },
        }));
      },
      
      setIsComparing: (comparing: boolean) => {
        set((state) => ({
          panelState: { ...state.panelState, isComparing: comparing },
        }));
      },
      
      // Cooldown management
      setCooldownEndTime: (time: number | null) => set({ cooldownEndTime: time }),
      
      setCooldownRemaining: (remaining: number | null) => set({ cooldownRemaining: remaining }),
      
      updateCooldownRemaining: () => {
        const { cooldownEndTime } = get();
        if (!cooldownEndTime) return;
        
        const remaining = Math.max(0, Math.ceil((cooldownEndTime - Date.now()) / 1000));
        set({ cooldownRemaining: remaining });
      },
      
      // Operation start countdown
      setOperationStartCountdown: (countdown: number | null) => set({ operationStartCountdown: countdown }),
      
      updateOperationStartCountdown: () => {
        const { contractState } = get();
        if (!contractState?.operationStartDate) return;
        
        const startTime = new Date(contractState.operationStartDate).getTime();
        const countdown = Math.max(0, Math.ceil((startTime - Date.now()) / 1000));
        set({ operationStartCountdown: countdown });
      },
      
      // Computed properties
      isFundsLocked: () => {
        const { contractState } = get();
        return contractState?.isFundsLocked || false;
      },
      
      isOperationStart: () => {
        const { contractState } = get();
        return contractState?.state === 'CONTRACT_ACTIVE_LOCKED' && contractState?.isFundsLocked;
      },
      
      isReadyForNextState: () => {
        const { contractState, operationStartCountdown } = get();
        return (
          contractState?.state === 'CONTRACT_ACTIVE_LOCKED' &&
          contractState?.isFundsLocked &&
          operationStartCountdown !== null &&
          operationStartCountdown <= 0
        );
      },
      
      getFilteredObligations: (party?: 'Contractor' | 'ProjectOwner') => {
        const { rightsObligations, panelState } = get();
        const filterParty = party || panelState.selectedParty;
        
        if (filterParty === 'all') {
          return rightsObligations;
        }
        
        return rightsObligations.filter((item) => item.party === filterParty);
      },
      
      // Reset
      reset: () => {
        set({
          contractId: null,
          contractState: null,
          lockedStatus: null,
          rightsObligations: [],
          nextCondition: null,
          panelState: initialPanelState,
          isLoading: false,
          isFetching: false,
          error: null,
          successMessage: null,
          cooldownEndTime: null,
          cooldownRemaining: null,
          operationStartCountdown: null,
        });
      },
    }),
    {
      name: 'contract-lock-store',
      partialize: (state) => ({
        contractId: state.contractId,
        contractState: state.contractState,
        lockedStatus: state.lockedStatus,
        rightsObligations: state.rightsObligations,
        nextCondition: state.nextCondition,
        panelState: state.panelState,
        cooldownEndTime: state.cooldownEndTime,
      }),
    },
  ),
);
