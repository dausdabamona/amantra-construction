import React from 'react';
import { useContractRightsContext, useContractObligationsContext } from '@/stores/useOperationStore';

interface RightsObligationsPanelProps {
  className?: string;
}

/**
 * RightsObligationsPanel - Display rights on hold and current obligations
 * For OPERATION_RUNNING state: Shows what rights are locked and why, current obligations
 */
export const RightsObligationsPanel: React.FC<RightsObligationsPanelProps> = ({
  className = '',
}) => {
  const rightsContext = useContractRightsContext();
  const obligationsContext = useContractObligationsContext();

  if (!rightsContext || !obligationsContext) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg border border-gray-200 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded mb-2 w-1/3"></div>
          <div className="h-8 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* ===== RIGHTS ON HOLD ===== */}
      <div className="border rounded-lg bg-orange-50 border-orange-300 p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="text-2xl">🔒</div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-orange-900">Hak-Hak yang Tertahan</h3>
            <p className="text-sm text-orange-800 mt-1">{rightsContext.whyOnHold}</p>
          </div>
        </div>

        {/* Rights List */}
        <div className="space-y-2 mb-4">
          {rightsContext.rightsOnHold.map((right, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded">
              <span className="text-lg">❌</span>
              <span className="text-sm font-semibold text-gray-900">{right}</span>
            </div>
          ))}
        </div>

        {/* When Will Be Released */}
        <div className="bg-gradient-to-r from-orange-100 to-amber-100 rounded p-3 border-l-4 border-orange-500">
          <p className="text-xs font-semibold text-orange-900 uppercase tracking-wide">
            Kapan Akan Dilepas?
          </p>
          <p className="text-sm text-orange-900 font-semibold mt-1">
            {rightsContext.whenWillBeReleased}
          </p>
        </div>

        {/* Conditions for Release */}
        <div className="mt-4">
          <p className="text-xs font-semibold text-orange-900 uppercase tracking-wide mb-2">
            Syarat Pelepasan:
          </p>
          <div className="space-y-2">
            {rightsContext.conditions.map((condition, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                <span className="text-orange-600 font-bold mt-0.5">✓</span>
                <span className="text-gray-700">{condition}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== CURRENT OBLIGATIONS ===== */}
      <div className="border rounded-lg bg-blue-50 border-blue-300 p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="text-2xl">📋</div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-blue-900">Kewajiban Saat Ini</h3>
            <p className="text-sm text-blue-800 mt-1">{obligationsContext.currentObligation}</p>
          </div>
        </div>

        {/* Obligation Details */}
        <div className="space-y-3 mb-4">
          {/* Responsible Party */}
          <div className="bg-white rounded p-3">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Pihak Bertanggung Jawab
            </p>
            <p className="text-sm font-bold text-gray-900 mt-1">
              {obligationsContext.responsible}
            </p>
          </div>

          {/* Deadline */}
          <div className="bg-white rounded p-3">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Batas Waktu Pengerjaan
            </p>
            <p className="text-sm font-bold text-gray-900 mt-1">
              {new Date(obligationsContext.deadline).toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* Current Progress */}
          <div className="bg-white rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Kemajuan Pengerjaan
              </p>
              <p className="text-sm font-bold text-blue-600">
                {obligationsContext.progressPercentage}%
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${obligationsContext.progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Consequence Warning */}
        <div className="bg-gradient-to-r from-red-100 to-rose-100 rounded p-3 border-l-4 border-red-500">
          <p className="text-xs font-semibold text-red-900 uppercase tracking-wide">
            Konsekuensi Keterlambatan:
          </p>
          <p className="text-sm text-red-900 font-semibold mt-1">{obligationsContext.consequence}</p>
          <p className="text-xs text-red-800 mt-1">{obligationsContext.consequenceTrigger}</p>
        </div>
      </div>

      {/* ===== BLOCKED & ALLOWED ACTIONS ===== */}
      <div className="grid grid-cols-2 gap-4">
        {/* Blocked Actions */}
        <div className="border rounded-lg bg-red-50 border-red-300 p-4">
          <h4 className="text-sm font-bold text-red-900 mb-3">Aksi Terblokir</h4>
          <div className="space-y-2">
            {rightsContext.blockedActions.map((action, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                <span className="text-red-600 font-bold mt-0.5">✕</span>
                <span className="text-gray-700">{action}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Allowed Actions */}
        <div className="border rounded-lg bg-green-50 border-green-300 p-4">
          <h4 className="text-sm font-bold text-green-900 mb-3">Aksi Diizinkan</h4>
          <div className="space-y-2">
            {rightsContext.allowedActions.map((action, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                <span className="text-gray-700">{action}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightsObligationsPanel;
