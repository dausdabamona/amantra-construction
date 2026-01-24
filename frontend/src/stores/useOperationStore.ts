import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  OperationUIState,
  OperationStore,
  OperationProgress,
  ProgressReport,
  ReportStatus,
  ActivityTimelineItem,
} from '@/types/operation';

const initialState: OperationUIState = {
  loading: false,
  error: null,
  operationData: null,
  selectedMilestoneNumber: 1,
  showReportForm: false,
  showVerificationPanel: false,
  isSubmittingReport: false,
  isVerifyingReport: false,
  lastUpdateTime: null,
};

export const useOperationStore = create<OperationStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ========================================================================
      // Data Management Actions
      // ========================================================================

      setOperationData: (data: OperationProgress) => {
        set({
          operationData: data,
          lastUpdateTime: new Date(),
          error: null,
        });
      },

      selectMilestone: (milestoneNumber: number) => {
        set({
          selectedMilestoneNumber: milestoneNumber,
        });
      },

      toggleReportForm: () => {
        const state = get();
        set({
          showReportForm: !state.showReportForm,
          showVerificationPanel: false,
        });
      },

      toggleVerificationPanel: () => {
        const state = get();
        set({
          showVerificationPanel: !state.showVerificationPanel,
          showReportForm: false,
        });
      },

      // ========================================================================
      // Loading & Error Management
      // ========================================================================

      setLoading: (loading: boolean) => {
        set({ loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      // ========================================================================
      // Report Management Actions
      // ========================================================================

      addReport: (report: ProgressReport) => {
        const state = get();
        if (!state.operationData) return;

        const updatedReports = [
          ...state.operationData.submittedReports,
          report,
        ];

        set({
          operationData: {
            ...state.operationData,
            submittedReports: updatedReports,
          },
          lastUpdateTime: new Date(),
        });
      },

      // ========================================================================
      // Milestone Management Actions
      // ========================================================================

      updateMilestoneStatus: (
        milestoneNumber: number,
        status: ReportStatus,
      ) => {
        const state = get();
        if (!state.operationData) return;

        const updatedMilestones = state.operationData.operationState.milestones.map(
          (milestone) =>
            milestone.milestoneNumber === milestoneNumber
              ? { ...milestone, status }
              : milestone,
        );

        // Recalculate milestone summary
        const completed = updatedMilestones.filter(
          (m) => m.status === ReportStatus.VERIFIED,
        ).length;
        const inReview = updatedMilestones.filter(
          (m) => m.status === ReportStatus.SUBMITTED,
        ).length;
        const pending = updatedMilestones.filter(
          (m) => m.status === ReportStatus.PENDING,
        ).length;

        const overallProgress = Math.round(
          (completed / updatedMilestones.length) * 100,
        );

        set({
          operationData: {
            ...state.operationData,
            operationState: {
              ...state.operationData.operationState,
              milestones: updatedMilestones,
              overallProgress,
            },
            milestoneSummary: {
              ...state.operationData.milestoneSummary,
              completed,
              inReview,
              pending,
              overallProgress,
            },
          },
          lastUpdateTime: new Date(),
        });
      },

      // ========================================================================
      // Timeline Management Actions
      // ========================================================================

      addTimelineItem: (item: ActivityTimelineItem) => {
        const state = get();
        if (!state.operationData) return;

        const updatedTimeline = [
          item,
          ...state.operationData.activityTimeline,
        ];

        set({
          operationData: {
            ...state.operationData,
            activityTimeline: updatedTimeline,
          },
          lastUpdateTime: new Date(),
        });
      },

      // ========================================================================
      // State Reset
      // ========================================================================

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'operation-store',
      partialize: (state) => ({
        selectedMilestoneNumber: state.selectedMilestoneNumber,
        showReportForm: state.showReportForm,
        showVerificationPanel: state.showVerificationPanel,
      }),
    },
  ),
);

// ============================================================================
// SELECTOR HOOKS (for optimized re-renders)
// ============================================================================

export const useOperationLoading = () =>
  useOperationStore((state) => state.loading);

export const useOperationError = () =>
  useOperationStore((state) => state.error);

export const useOperationData = () =>
  useOperationStore((state) => state.operationData);

export const useActiveMilestone = () => {
  const store = useOperationStore();
  const state = store.operationData?.operationState;
  if (!state) return null;

  const activeMilestone = state.milestones.find(
    (m) => m.milestoneNumber === state.activeMilestoneNumber,
  );
  return activeMilestone || null;
};

export const useOperationState = () =>
  useOperationStore((state) => state.operationData?.operationState);

export const useSubmittedReports = () =>
  useOperationStore((state) => state.operationData?.submittedReports || []);

export const useActivityTimeline = () =>
  useOperationStore((state) => state.operationData?.activityTimeline || []);

export const useMilestoneSummary = () =>
  useOperationStore((state) => state.operationData?.milestoneSummary);

export const useSelectedMilestone = () =>
  useOperationStore((state) => {
    const selected = state.selectedMilestoneNumber;
    const milestones = state.operationData?.operationState.milestones || [];
    return milestones.find((m) => m.milestoneNumber === selected) || null;
  });

export const useReportFormVisibility = () =>
  useOperationStore((state) => state.showReportForm);

export const useVerificationPanelVisibility = () =>
  useOperationStore((state) => state.showVerificationPanel);

export const useLastUpdateTime = () =>
  useOperationStore((state) => state.lastUpdateTime);

// ============================================================================
// COMPUTED HOOKS (complex selectors)
// ============================================================================

export const useOperationContext = () => {
  const store = useOperationStore();
  const data = store.operationData;

  if (!data || !data.operationState) {
    return null;
  }

  const state = data.operationState;

  return {
    currentState: state.state,
    isFundsLocked: true, // Would be determined by contract lock status
    isOperationRunning: true, // Would be from lock log
    activeMilestone: data.operationState.milestones.find(
      (m) => m.milestoneNumber === state.activeMilestoneNumber,
    ) || null,
    daysSinceStart: state.daysSinceStart,
    daysUntilDeadline: state.daysUntilDeadline,
    isOverdue: state.isOverdue,
    overallProgress: state.overallProgress,
    waitingFor: state.waitingFor,
    responsibleParty: state.currentResponsibleParty,
    currentDeadline: state.currentDeadline,
    nextCondition: `Menunggu ${state.waitingFor}`,
  };
};

export const useContractRightsContext = () => {
  const store = useOperationStore();
  const data = store.operationData;

  if (!data || !data.operationState) {
    return null;
  }

  return {
    rightsOnHold: [
      'Hak distribusi keuntungan',
      'Hak pencairan dana penuh',
      'Hak penyelesaian kontrak',
    ],
    whyOnHold: 'Operasi masih berjalan, belum semua milestone terverifikasi',
    whenWillBeReleased: 'Setelah semua milestone selesai dan terverifikasi',
    conditions: [
      'Semua milestone harus terverifikasi',
      'Tidak ada laporan yang ditolak',
      'Tidak ada masalah yang belum terselesaikan',
    ],
    blockedActions: [
      'Pencairan dana penuh',
      'Distribusi keuntungan',
      'Penghentian kontrak awal',
    ],
    allowedActions: [
      'Mengajukan laporan kemajuan',
      'Melihat timeline aktivitas',
      'Komunikasi dengan tim',
    ],
  };
};

export const useContractObligationsContext = () => {
  const store = useOperationStore();
  const data = store.operationData;

  if (!data || !data.operationState) {
    return null;
  }

  const state = data.operationState;
  const activeMilestone = state.milestones.find(
    (m) => m.milestoneNumber === state.activeMilestoneNumber,
  );

  if (!activeMilestone) return null;

  return {
    currentObligation: `Menyelesaikan Milestone ${activeMilestone.milestoneNumber}: ${activeMilestone.description}`,
    obligationDescription: activeMilestone.description,
    responsible: activeMilestone.responsibleParty,
    deadline: activeMilestone.targetCompletionDate,
    progressPercentage: activeMilestone.currentProgress,
    consequence: state.isOverdue
      ? 'Denda keterlambatan mulai berlaku'
      : 'Proyek akan masuk kategori tertunda',
    consequenceTrigger: state.isOverdue
      ? `Sudah ${state.daysOverdue} hari terlamabat`
      : `Deadline ${state.daysUntilDeadline} hari lagi`,
  };
};

// ============================================================================
// DEBUG HELPER
// ============================================================================

export const useOperationDebug = () => {
  const store = useOperationStore();
  return {
    fullState: store,
    log: () => {
      console.group('🔍 Operation Store Debug');
      console.log('Loading:', store.loading);
      console.log('Error:', store.error);
      console.log('Operation Data:', store.operationData);
      console.log('Last Update:', store.lastUpdateTime);
      console.log('Selected Milestone:', store.selectedMilestoneNumber);
      console.log('Show Report Form:', store.showReportForm);
      console.log('Show Verification Panel:', store.showVerificationPanel);
      console.groupEnd();
    },
  };
};
