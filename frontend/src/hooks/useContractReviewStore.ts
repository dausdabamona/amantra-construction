import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ContractSummary,
  ProcessTimelineStep,
  RiskItem,
  SimulationScenario,
  LegalTextSection,
  AcknowledgementChecklistItem,
  ContractReviewStatus,
} from '@/types/contract-review';
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
});

interface ContractReviewStoreState {
  // Data
  contractId: string | null;
  userId: string | null;
  currentStep: number; // 1-7
  
  // Loaded data
  summary: ContractSummary | null;
  timeline: ProcessTimelineStep[] | null;
  risks: RiskItem[] | null;
  scenarios: SimulationScenario[] | null;
  legalText: LegalTextSection[] | null;
  checklist: AcknowledgementChecklistItem[] | null;
  status: ContractReviewStatus | null;
  
  // Acknowledgement flags
  ackSummary: boolean;
  ackTimeline: boolean;
  ackRisks: boolean;
  ackSimulation: boolean;
  ackLegalText: boolean;
  ackChecklist: boolean;
  ackCooldown: boolean;
  
  // Checklist items acknowledgements
  acknowledgedChecklistItems: Set<string>;
  
  // Timing
  cooldownEndTime: number | null; // Unix timestamp in ms
  cooldownRemaining: number; // In milliseconds
  canProceedToLock: boolean;
  
  // UI State
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  
  // Actions
  initialize: (contractId: string, userId: string) => void;
  loadContractData: (contractId: string) => Promise<void>;
  setCurrentStep: (step: number) => void;
  setAck: (key: 'summary' | 'timeline' | 'risks' | 'simulation' | 'legalText' | 'checklist' | 'cooldown', value: boolean) => void;
  toggleChecklistItem: (itemId: string) => void;
  clearChecklistItems: () => void;
  acknowledgeStep: () => Promise<boolean>;
  approveAndLock: () => Promise<boolean>;
  reset: () => void;
  setError: (error: string | null) => void;
  updateCooldownRemaining: () => void;
}

export const useContractReviewStore = create<ContractReviewStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      contractId: null,
      userId: null,
      currentStep: 1,
      
      summary: null,
      timeline: null,
      risks: null,
      scenarios: null,
      legalText: null,
      checklist: null,
      status: null,
      
      ackSummary: false,
      ackTimeline: false,
      ackRisks: false,
      ackSimulation: false,
      ackLegalText: false,
      ackChecklist: false,
      ackCooldown: false,
      
      acknowledgedChecklistItems: new Set<string>(),
      
      cooldownEndTime: null,
      cooldownRemaining: 0,
      canProceedToLock: false,
      
      isLoading: false,
      isSubmitting: false,
      error: null,
      
      // Actions
      initialize: (contractId: string, userId: string) => {
        set({ contractId, userId });
      },
      
      loadContractData: async (contractId: string) => {
        set({ isLoading: true, error: null });
        try {
          const [summary, timeline, risks, scenarios, legalText, checklist, status] =
            await Promise.all([
              apiClient.get(`/contract-review/${contractId}/summary`),
              apiClient.get(`/contract-review/${contractId}/timeline`),
              apiClient.get(`/contract-review/${contractId}/risks`),
              apiClient.get(`/contract-review/${contractId}/simulation`),
              apiClient.get(`/contract-review/${contractId}/legal-text`),
              apiClient.get(`/contract-review/${contractId}/checklist`),
              apiClient.get(`/contract-review/${contractId}/status`),
            ]);

          set({
            summary: summary.data,
            timeline: timeline.data,
            risks: risks.data,
            scenarios: scenarios.data,
            legalText: legalText.data,
            checklist: checklist.data,
            status: status.data,
            cooldownEndTime: status.data?.cooldownEndTime || null,
          });

          // Restore acknowledgements from status if available
          if (status.data) {
            set({
              ackSummary: status.data.ackSummary || false,
              ackTimeline: status.data.ackTimeline || false,
              ackRisks: status.data.ackRisks || false,
              ackSimulation: status.data.ackSimulation || false,
              ackLegalText: status.data.ackLegalText || false,
              ackChecklist: status.data.ackChecklist || false,
              ackCooldown: status.data.ackCooldown || false,
              canProceedToLock: status.data.canProceedToLock || false,
            });
          }
        } catch (err: any) {
          const errorMessage = err.response?.data?.message || 'Gagal memuat data kontrak';
          set({ error: errorMessage });
        } finally {
          set({ isLoading: false });
        }
      },
      
      setCurrentStep: (step: number) => {
        set({ currentStep: Math.min(Math.max(step, 1), 7) });
      },
      
      setAck: (key, value) => {
        set({ [key]: value });
      },
      
      toggleChecklistItem: (itemId: string) => {
        const { acknowledgedChecklistItems } = get();
        const newItems = new Set(acknowledgedChecklistItems);
        if (newItems.has(itemId)) {
          newItems.delete(itemId);
        } else {
          newItems.add(itemId);
        }
        set({ acknowledgedChecklistItems: newItems });
      },
      
      clearChecklistItems: () => {
        set({ acknowledgedChecklistItems: new Set<string>() });
      },
      
      acknowledgeStep: async () => {
        const { contractId, ackSummary, ackTimeline, ackRisks, ackSimulation, ackLegalText, ackChecklist, ackCooldown } = get();
        
        if (!contractId) {
          set({ error: 'Contract ID tidak tersedia' });
          return false;
        }

        set({ isSubmitting: true, error: null });
        try {
          const response = await apiClient.post(`/contract-review/${contractId}/acknowledge`, {
            ackSummary,
            ackTimeline,
            ackRisks,
            ackSimulation,
            ackLegalText,
            ackChecklist,
            ackCooldown,
          });

          if (response.data) {
            set({
              status: response.data,
              cooldownEndTime: response.data.cooldownEndTime,
              canProceedToLock: response.data.canProceedToLock || false,
            });
            return true;
          }
          return false;
        } catch (err: any) {
          const errorMessage = err.response?.data?.message || 'Gagal menyimpan pengakuan';
          set({ error: errorMessage });
          return false;
        } finally {
          set({ isSubmitting: false });
        }
      },
      
      approveAndLock: async () => {
        const { contractId } = get();
        
        if (!contractId) {
          set({ error: 'Contract ID tidak tersedia' });
          return false;
        }

        set({ isSubmitting: true, error: null });
        try {
          const response = await apiClient.post(`/contract-review/${contractId}/approve-and-lock`, {
            confirmProceedToLock: true,
          });

          if (response.data?.success) {
            set({ 
              status: response.data.data,
              currentStep: 7, // Completed
            });
            return true;
          }
          return false;
        } catch (err: any) {
          const errorMessage = err.response?.data?.message || 'Gagal mengunci dana';
          set({ error: errorMessage });
          return false;
        } finally {
          set({ isSubmitting: false });
        }
      },
      
      reset: () => {
        set({
          contractId: null,
          userId: null,
          currentStep: 1,
          summary: null,
          timeline: null,
          risks: null,
          scenarios: null,
          legalText: null,
          checklist: null,
          status: null,
          ackSummary: false,
          ackTimeline: false,
          ackRisks: false,
          ackSimulation: false,
          ackLegalText: false,
          ackChecklist: false,
          ackCooldown: false,
          acknowledgedChecklistItems: new Set<string>(),
          cooldownEndTime: null,
          cooldownRemaining: 0,
          canProceedToLock: false,
          isLoading: false,
          isSubmitting: false,
          error: null,
        });
      },
      
      setError: (error: string | null) => {
        set({ error });
      },
      
      updateCooldownRemaining: () => {
        const { cooldownEndTime } = get();
        if (cooldownEndTime) {
          const remaining = Math.max(0, cooldownEndTime - Date.now());
          set({ cooldownRemaining: remaining });
          
          // Update canProceedToLock when cooldown expires
          if (remaining <= 0) {
            set({ canProceedToLock: true });
          }
        }
      },
    }),
    {
      name: 'contract-review-store',
      partialize: (state) => ({
        // Persist only essential data
        contractId: state.contractId,
        userId: state.userId,
        ackSummary: state.ackSummary,
        ackTimeline: state.ackTimeline,
        ackRisks: state.ackRisks,
        ackSimulation: state.ackSimulation,
        ackLegalText: state.ackLegalText,
        ackChecklist: state.ackChecklist,
        ackCooldown: state.ackCooldown,
        cooldownEndTime: state.cooldownEndTime,
      }),
    }
  )
);
