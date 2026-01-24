import React, { useEffect, useState } from 'react';
import { useOperationState } from '@/stores/useOperationStore';
import { OperationWaitingState } from '@/types/operation';

interface NextConditionPanelProps {
  className?: string;
}

/**
 * NextConditionPanel - Display waiting condition and what needs to happen next
 * Shows: What we're waiting for, who should do it, deadline, status
 */
export const NextConditionPanel: React.FC<NextConditionPanelProps> = ({
  className = '',
}) => {
  const operationState = useOperationState();
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Update time remaining every second
  useEffect(() => {
    if (!operationState) return;

    const interval = setInterval(() => {
      if (operationState.daysUntilDeadline > 0) {
        setTimeRemaining(
          `${operationState.daysUntilDeadline} hari${operationState.daysUntilDeadline === 1 ? '' : 's'}`,
        );
      } else if (operationState.isOverdue) {
        setTimeRemaining(`${operationState.daysOverdue} hari tertunda`);
      } else {
        setTimeRemaining('Hari ini');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [operationState]);

  if (!operationState) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg border border-gray-200 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded mb-2 w-1/3"></div>
          <div className="h-8 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  const getWaitingIcon = () => {
    switch (operationState.waitingState) {
      case OperationWaitingState.WAITING_FOR_REPORT:
        return '📝';
      case OperationWaitingState.WAITING_FOR_VERIFICATION:
        return '✅';
      case OperationWaitingState.WAITING_FOR_MILESTONE_COMPLETION:
        return '🎯';
      default:
        return '⏳';
    }
  };

  const getWaitingDescription = () => {
    switch (operationState.waitingState) {
      case OperationWaitingState.WAITING_FOR_REPORT:
        return 'Kontraktor harus mengajukan laporan kemajuan dengan bukti foto dan deskripsi detail.';
      case OperationWaitingState.WAITING_FOR_VERIFICATION:
        return 'ProjectOwner harus memverifikasi laporan yang telah diajukan oleh kontraktor.';
      case OperationWaitingState.WAITING_FOR_MILESTONE_COMPLETION:
        return 'Milestone harus diselesaikan sepenuhnya sebelum dapat berlanjut ke tahap berikutnya.';
      default:
        return 'Status menunggu tidak jelas.';
    }
  };

  const getResponsibleParty = () => {
    switch (operationState.waitingState) {
      case OperationWaitingState.WAITING_FOR_REPORT:
        return 'Kontraktor';
      case OperationWaitingState.WAITING_FOR_VERIFICATION:
        return 'ProjectOwner';
      case OperationWaitingState.WAITING_FOR_MILESTONE_COMPLETION:
        return 'Tim Proyek';
      default:
        return 'Tidak Diketahui';
    }
  };

  const getNextActionItems = () => {
    switch (operationState.waitingState) {
      case OperationWaitingState.WAITING_FOR_REPORT:
        return [
          'Lakukan inspeksi lokasi proyek',
          'Dokumentasikan kemajuan dengan foto berkualitas',
          'Siapkan deskripsi detail pekerjaan yang sudah dilakukan',
          'Kumpulkan bukti pendukung (invoice, tanda terima, dll)',
          'Ajukan laporan melalui sistem',
        ];
      case OperationWaitingState.WAITING_FOR_VERIFICATION:
        return [
          'Review laporan yang diajukan dengan cermat',
          'Verifikasi kesesuaian dengan kontrak',
          'Periksa kualitas foto dan dokumentasi',
          'Bandingkan dengan milestone deliverables',
          'Ambil keputusan (Setuju, Tolak, atau Revisi Diminta)',
          'Berikan feedback tertulis kepada kontraktor',
        ];
      case OperationWaitingState.WAITING_FOR_MILESTONE_COMPLETION:
        return [
          'Pastikan semua deliverables terpenuhi',
          'Lakukan inspeksi final',
          'Dokumentasikan penyelesaian',
          'Persiapkan untuk milestone berikutnya',
        ];
      default:
        return ['Status tidak jelas'];
    }
  };

  const getUrgencyColor = () => {
    if (operationState.isOverdue) {
      return 'bg-red-50 border-red-300';
    } else if (operationState.daysUntilDeadline <= 3) {
      return 'bg-orange-50 border-orange-300';
    } else if (operationState.daysUntilDeadline <= 7) {
      return 'bg-amber-50 border-amber-300';
    }
    return 'bg-blue-50 border-blue-300';
  };

  const getUrgencyBadge = () => {
    if (operationState.isOverdue) {
      return (
        <span className="inline-block px-3 py-1 bg-red-200 text-red-800 text-xs font-bold rounded-full">
          🚨 TERTUNDA
        </span>
      );
    } else if (operationState.daysUntilDeadline <= 3) {
      return (
        <span className="inline-block px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
          ⚡ MENDESAK
        </span>
      );
    } else if (operationState.daysUntilDeadline <= 7) {
      return (
        <span className="inline-block px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
          ⏰ DEKAT
        </span>
      );
    }
    return (
      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
        ✓ NORMAL
      </span>
    );
  };

  return (
    <div
      className={`border rounded-lg p-6 space-y-4 ${getUrgencyColor()} ${className}`}
    >
      {/* Header with Icon and Urgency Badge */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <span className="text-4xl">{getWaitingIcon()}</span>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Kondisi Selanjutnya</h3>
            <p className="text-sm text-gray-700 mt-1">{operationState.waitingFor}</p>
          </div>
        </div>
        <div className="text-right">{getUrgencyBadge()}</div>
      </div>

      {/* Main Description */}
      <div className="bg-white rounded p-4 border-l-4 border-blue-400">
        <p className="text-sm text-gray-700 leading-relaxed">
          {getWaitingDescription()}
        </p>
      </div>

      {/* Responsible Party and Deadline */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded p-3">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Pihak Bertanggung Jawab
          </p>
          <p className="text-sm font-bold text-gray-900 mt-2">
            {getResponsibleParty()}
          </p>
        </div>
        <div className="bg-white rounded p-3">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Sisa Waktu
          </p>
          <p className={`text-sm font-bold mt-2 ${
            operationState.isOverdue ? 'text-red-600' : 'text-green-600'
          }`}>
            {timeRemaining}
          </p>
        </div>
      </div>

      {/* Deadline Information */}
      <div className="bg-white rounded p-3">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Batas Waktu
        </p>
        <p className="text-sm font-semibold text-gray-900 mt-1">
          {new Date(operationState.currentDeadline).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Action Items */}
      <div className="bg-white rounded p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Langkah-Langkah yang Perlu Dilakukan:
        </p>
        <ol className="space-y-2">
          {getNextActionItems().map((item, idx) => (
            <li key={idx} className="flex gap-3 text-sm">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                {idx + 1}
              </span>
              <span className="text-gray-700 pt-0.5">{item}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Warning if Overdue */}
      {operationState.isOverdue && (
        <div className="bg-red-100 border border-red-300 rounded p-4">
          <p className="text-sm font-bold text-red-900">
            ⚠️ PERHATIAN: Sudah {operationState.daysOverdue} Hari Tertunda!
          </p>
          <p className="text-xs text-red-800 mt-2">
            Denda keterlambatan sudah berlaku. Segera ambil tindakan untuk
            menyelesaikan milestone ini agar tidak ada biaya tambahan.
          </p>
        </div>
      )}

      {/* Info if Near Deadline */}
      {!operationState.isOverdue && operationState.daysUntilDeadline <= 3 && (
        <div className="bg-orange-100 border border-orange-300 rounded p-4">
          <p className="text-sm font-bold text-orange-900">
            ⏰ DEADLINE SANGAT DEKAT ({operationState.daysUntilDeadline} Hari)!
          </p>
          <p className="text-xs text-orange-800 mt-2">
            Prioritaskan penyelesaian milestone ini untuk menghindari keterlambatan
            dan pengenaan denda.
          </p>
        </div>
      )}
    </div>
  );
};

export default NextConditionPanel;
