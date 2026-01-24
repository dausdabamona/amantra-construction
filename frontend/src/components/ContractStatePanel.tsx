import React, { useEffect, useState } from 'react';
import { useOperationState, useMilestoneSummary } from '@/stores/useOperationStore';
import { OperationState, OperationWaitingState } from '@/types/operation';

interface ContractStatePanelProps {
  className?: string;
}

/**
 * ContractStatePanel - Display current contract state, day counter, and active milestone
 * Shows: Current state, days since start, active milestone, waiting status, overall progress
 */
export const ContractStatePanel: React.FC<ContractStatePanelProps> = ({
  className = '',
}) => {
  const operationState = useOperationState();
  const milestoneSummary = useMilestoneSummary();
  const [elapsedDays, setElapsedDays] = useState(0);

  // Update elapsed days every second for live counter
  useEffect(() => {
    if (!operationState) return;

    const interval = setInterval(() => {
      setElapsedDays(operationState.daysSinceStart);
    }, 1000);

    return () => clearInterval(interval);
  }, [operationState]);

  if (!operationState || !milestoneSummary) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg border border-gray-200 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded mb-2 w-1/3"></div>
          <div className="h-8 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  const getStateColor = (state: OperationState) => {
    const colors = {
      [OperationState.PRE_CONTRACT_REVIEW]: 'bg-blue-50 border-blue-300',
      [OperationState.CONTRACT_ACTIVE_LOCKED]: 'bg-yellow-50 border-yellow-300',
      [OperationState.OPERATION_RUNNING]: 'bg-green-50 border-green-300',
      [OperationState.EVALUATION_AND_CALCULATION]: 'bg-purple-50 border-purple-300',
      [OperationState.PAYMENT_RELEASE]: 'bg-indigo-50 border-indigo-300',
      [OperationState.VERIFICATION]: 'bg-cyan-50 border-cyan-300',
      [OperationState.CONTRACT_COMPLETED]: 'bg-gray-50 border-gray-300',
    };
    return colors[state] || colors[OperationState.PRE_CONTRACT_REVIEW];
  };

  const getStateLabel = (state: OperationState) => {
    const labels = {
      [OperationState.PRE_CONTRACT_REVIEW]: 'Review Kontrak',
      [OperationState.CONTRACT_ACTIVE_LOCKED]: 'Dana Terkunci',
      [OperationState.OPERATION_RUNNING]: 'Operasi Berjalan',
      [OperationState.EVALUATION_AND_CALCULATION]: 'Evaluasi & Perhitungan',
      [OperationState.PAYMENT_RELEASE]: 'Rilis Pembayaran',
      [OperationState.VERIFICATION]: 'Verifikasi',
      [OperationState.CONTRACT_COMPLETED]: 'Selesai',
    };
    return labels[state] || 'Tidak Diketahui';
  };

  const getWaitingStateDescription = (state: OperationWaitingState) => {
    const descriptions = {
      [OperationWaitingState.WAITING_FOR_REPORT]: '⏳ Menunggu laporan dari kontraktor',
      [OperationWaitingState.WAITING_FOR_VERIFICATION]: '⏳ Menunggu verifikasi laporan',
      [OperationWaitingState.WAITING_FOR_MILESTONE_COMPLETION]:
        '⏳ Menunggu penyelesaian milestone',
    };
    return descriptions[state] || 'Status tidak diketahui';
  };

  const activeMilestone = operationState.milestones.find(
    (m) => m.milestoneNumber === operationState.activeMilestoneNumber,
  );

  return (
    <div
      className={`border rounded-lg p-6 space-y-4 ${getStateColor(operationState.state)} ${className}`}
    >
      {/* State Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Status Kontrak
          </p>
          <h2 className="text-2xl font-bold text-gray-900 mt-1">
            {getStateLabel(operationState.state)}
          </h2>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Hari Berlangsung
          </p>
          <p className="text-3xl font-bold text-green-600 font-mono">
            {elapsedDays}
          </p>
        </div>
      </div>

      {/* Waiting State */}
      <div className="bg-white rounded p-3 border-l-4 border-amber-400">
        <p className="text-sm text-gray-700">
          {getWaitingStateDescription(operationState.waitingState)}
        </p>
      </div>

      {/* Active Milestone */}
      {activeMilestone && (
        <div className="bg-white rounded p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Milestone Aktif
              </p>
              <p className="text-sm font-semibold text-gray-900 mt-1">
                #{activeMilestone.milestoneNumber}: {activeMilestone.description}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-600 uppercase">
                Target Selesai
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {new Date(activeMilestone.targetCompletionDate).toLocaleDateString(
                  'id-ID',
                )}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${activeMilestone.currentProgress}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-600">
              Kemajuan: {activeMilestone.currentProgress}%
            </p>
            <p className="text-xs font-semibold text-gray-600">
              {activeMilestone.currentProgress === 100
                ? '✅ Selesai'
                : activeMilestone.currentProgress > 0
                  ? '🔄 Sedang Berjalan'
                  : '⏱️ Belum Dimulai'}
            </p>
          </div>
        </div>
      )}

      {/* Overall Progress Summary */}
      <div className="bg-white rounded p-3 grid grid-cols-4 gap-2 text-center">
        <div>
          <p className="text-xs text-gray-600 uppercase font-semibold">Total</p>
          <p className="text-lg font-bold text-gray-900">{milestoneSummary.total}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 uppercase font-semibold">Selesai</p>
          <p className="text-lg font-bold text-green-600">{milestoneSummary.completed}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 uppercase font-semibold">Review</p>
          <p className="text-lg font-bold text-amber-600">{milestoneSummary.inReview}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 uppercase font-semibold">Menunggu</p>
          <p className="text-lg font-bold text-gray-600">{milestoneSummary.pending}</p>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="bg-white rounded p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-600">PROGRESS KESELURUHAN</p>
          <p className="text-sm font-bold text-gray-900">
            {milestoneSummary.overallProgress}%
          </p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-green-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${milestoneSummary.overallProgress}%` }}
          ></div>
        </div>
      </div>

      {/* Deadline Status */}
      {operationState.isOverdue && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <p className="text-sm font-semibold text-red-800">
            ⚠️ TERTUNDA {operationState.daysOverdue} HARI
          </p>
          <p className="text-xs text-red-700 mt-1">
            Deadline sudah terlewat. Denda keterlambatan mulai berlaku.
          </p>
        </div>
      )}

      {!operationState.isOverdue && operationState.daysUntilDeadline <= 7 && (
        <div className="bg-amber-50 border border-amber-200 rounded p-3">
          <p className="text-sm font-semibold text-amber-800">
            ⏰ DEADLINE DEKAT ({operationState.daysUntilDeadline} HARI)
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Segera percepat penyelesaian milestone untuk menghindari keterlambatan.
          </p>
        </div>
      )}
    </div>
  );
};

export default ContractStatePanel;
