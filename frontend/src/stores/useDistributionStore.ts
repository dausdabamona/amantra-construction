import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DistributionApiResponse,
  DistributionStatus,
  DistributionWaitingState,
  TxStatus,
} from '@/types/distribution';

interface DistributionUIState {
  loading: boolean;
  error: string | null;
  status: DistributionStatus | null;
  lastUpdated: Date | null;
}

interface DistributionStore extends DistributionUIState {
  setData: (payload: DistributionApiResponse<DistributionStatus> | DistributionStatus) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setWaitingState: (state: DistributionWaitingState) => void;
  setTxStatus: (status: TxStatus) => void;
  reset: () => void;
}

const initialState: DistributionUIState = {
  loading: false,
  error: null,
  status: null,
  lastUpdated: null,
};

export const useDistributionStore = create<DistributionStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setData: (payload) => {
        const data = 'data' in payload ? payload.data : payload;
        set({ status: data, error: null, lastUpdated: new Date() });
      },

      setLoading: (loading: boolean) => set({ loading }),

      setError: (error: string | null) => set({ error }),

      setWaitingState: (state: DistributionWaitingState) => {
        const current = get().status;
        if (!current) return;
        set({ status: { ...current, waitingState: state }, lastUpdated: new Date() });
      },

      setTxStatus: (status: TxStatus) => {
        const current = get().status;
        if (!current) return;
        set({
          status: {
            ...current,
            finalRights: { ...current.finalRights, txStatus: status },
          },
          lastUpdated: new Date(),
        });
      },

      reset: () => set(initialState),
    }),
    {
      name: 'distribution-store',
      partialize: (state) => ({ status: state.status }),
    },
  ),
);

export const useDistributionLoading = () =>
  useDistributionStore((state) => state.loading);

export const useDistributionError = () =>
  useDistributionStore((state) => state.error);

export const useDistributionStatus = () =>
  useDistributionStore((state) => state.status);
