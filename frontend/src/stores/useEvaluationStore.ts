import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  EvaluationApiResponse,
  EvaluationData,
  EvaluationWaitingState,
  ObjectionStatus,
  CalculationLineItem,
  ProvisionalResult,
} from '@/types/evaluation';

export interface EvaluationUIState {
  loading: boolean;
  error: string | null;
  evaluationData: EvaluationData | null;
  lastUpdated: Date | null;
}

export interface EvaluationStore extends EvaluationUIState {
  setData: (payload: EvaluationApiResponse<EvaluationData> | EvaluationData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateObjection: (objection: ObjectionStatus) => void;
  updateCalculation: (breakdown: CalculationLineItem[], provisional: ProvisionalResult, waitingState: EvaluationWaitingState) => void;
  reset: () => void;
}

const initialState: EvaluationUIState = {
  loading: false,
  error: null,
  evaluationData: null,
  lastUpdated: null,
};

export const useEvaluationStore = create<EvaluationStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setData: (payload) => {
        const data = 'data' in payload ? payload.data : payload;
        set({
          evaluationData: data,
          error: null,
          lastUpdated: new Date(),
        });
      },

      setLoading: (loading: boolean) => set({ loading }),

      setError: (error: string | null) => set({ error }),

      updateObjection: (objection: ObjectionStatus) => {
        const state = get();
        if (!state.evaluationData) return;

        set({
          evaluationData: {
            ...state.evaluationData,
            objectionStatus: objection,
            waitingState: EvaluationWaitingState.WAITING_FOR_CORRECTION,
          },
          lastUpdated: new Date(),
        });
      },

      updateCalculation: (
        breakdown: CalculationLineItem[],
        provisional: ProvisionalResult,
        waitingState: EvaluationWaitingState,
      ) => {
        const state = get();
        if (!state.evaluationData) return;

        set({
          evaluationData: {
            ...state.evaluationData,
            calculationBreakdown: breakdown,
            provisionalResults: provisional,
            waitingState,
          },
          lastUpdated: new Date(),
        });
      },

      reset: () => set(initialState),
    }),
    {
      name: 'evaluation-store',
      partialize: (state) => ({
        evaluationData: state.evaluationData,
        lastUpdated: state.lastUpdated,
      }),
    },
  ),
);

export const useEvaluationLoading = () =>
  useEvaluationStore((state) => state.loading);

export const useEvaluationError = () =>
  useEvaluationStore((state) => state.error);

export const useEvaluationData = () =>
  useEvaluationStore((state) => state.evaluationData);

export const useEvaluationWaitingState = () =>
  useEvaluationStore((state) => state.evaluationData?.waitingState);

export const useEvaluationProvisional = () =>
  useEvaluationStore((state) => state.evaluationData?.provisionalResults);

export const useEvaluationDeadlines = () =>
  useEvaluationStore((state) => ({
    objectionDeadline: state.evaluationData?.objectionDeadline,
    correctionDeadline: state.evaluationData?.correctionDeadline,
  }));
