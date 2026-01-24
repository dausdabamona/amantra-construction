import { create } from 'zustand';
import axios from 'axios';
import { UserRole } from '@/types/intent';

export interface IntentStatus {
  userId: string;
  status: string;
  role?: UserRole;
  kycVerified: boolean;
  acceptedTerms: boolean;
  confirmedLegalCapacity: boolean;
  declarationTimestamp?: Date;
  canProceedToReview: boolean;
}

interface IntentStore {
  // State
  userId: string | null;
  selectedRole: UserRole | null;
  kycVerified: boolean;
  acceptedTerms: boolean;
  confirmedLegalCapacity: boolean;
  intentStatus: IntentStatus | null;
  isLoading: boolean;
  error: string | null;

  // Checklist state
  checklistCompleted: boolean;

  // Actions
  setSelectedRole: (role: UserRole) => void;
  setKycVerified: (verified: boolean) => void;
  setAcceptedTerms: (accepted: boolean) => void;
  setConfirmedLegalCapacity: (confirmed: boolean) => void;
  setChecklistCompleted: (completed: boolean) => void;

  // API Actions
  declareIntent: (
    userId: string,
    role: UserRole,
    kycVerified: boolean,
    acceptTerms: boolean,
    confirmLegalCapacity: boolean,
  ) => Promise<void>;

  getIntentStatus: (userId: string) => Promise<void>;
  canProceedToReview: (userId: string) => Promise<boolean>;

  // Utility
  resetForm: () => void;
  clearError: () => void;
  isIntentComplete: () => boolean;
}

export const useIntentStore = create<IntentStore>((set, get) => ({
  // Initial state
  userId: null,
  selectedRole: null,
  kycVerified: false,
  acceptedTerms: false,
  confirmedLegalCapacity: false,
  intentStatus: null,
  isLoading: false,
  error: null,
  checklistCompleted: false,

  // Setters
  setSelectedRole: (role: UserRole) => set({ selectedRole: role }),
  setKycVerified: (verified: boolean) => set({ kycVerified: verified }),
  setAcceptedTerms: (accepted: boolean) => set({ acceptedTerms: accepted }),
  setConfirmedLegalCapacity: (confirmed: boolean) => set({ confirmedLegalCapacity: confirmed }),
  setChecklistCompleted: (completed: boolean) => set({ checklistCompleted: completed }),

  // Declare Intent
  declareIntent: async (userId, role, kycVerified, acceptTerms, confirmLegalCapacity) => {
    set({ isLoading: true, error: null });

    try {
      const response = await axios.post('/intent/declare', {
        role,
        kycVerified,
        acceptTerms,
        confirmsLegalCapacity: confirmLegalCapacity,
      });

      set({
        userId,
        selectedRole: role,
        kycVerified,
        acceptedTerms: acceptTerms,
        confirmedLegalCapacity: confirmLegalCapacity,
        intentStatus: {
          userId,
          status: 'INTENT_DECLARED',
          role,
          kycVerified,
          acceptedTerms: acceptTerms,
          confirmedLegalCapacity: confirmLegalCapacity,
          declarationTimestamp: new Date(response.data.declarationTimestamp),
          canProceedToReview: true,
        },
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Gagal mendeklarasikan intent';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw new Error(errorMessage);
    }
  },

  // Get Intent Status
  getIntentStatus: async (userId: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await axios.get('/intent/status');

      if (response.data.status === 'NOT_DECLARED') {
        set({
          intentStatus: null,
          isLoading: false,
        });
      } else {
        set({
          userId,
          selectedRole: response.data.role,
          kycVerified: response.data.kycVerified,
          acceptedTerms: response.data.acceptedTerms,
          confirmedLegalCapacity: response.data.confirmedLegalCapacity,
          intentStatus: response.data,
          isLoading: false,
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Gagal mengambil status intent';
      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  // Check if can proceed to review
  canProceedToReview: async (userId: string) => {
    try {
      const response = await axios.get('/intent/can-proceed-to-review');
      return response.data.canProceed;
    } catch (error) {
      return false;
    }
  },

  // Reset Form
  resetForm: () =>
    set({
      selectedRole: null,
      kycVerified: false,
      acceptedTerms: false,
      confirmedLegalCapacity: false,
      checklistCompleted: false,
      error: null,
    }),

  // Clear Error
  clearError: () => set({ error: null }),

  // Check if intent is complete
  isIntentComplete: () => {
    const state = get();
    return (
      state.selectedRole !== null &&
      state.kycVerified &&
      state.acceptedTerms &&
      state.confirmedLegalCapacity &&
      state.checklistCompleted
    );
  },
}));

export default useIntentStore;
