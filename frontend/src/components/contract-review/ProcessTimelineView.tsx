import React from 'react';
import { ProcessTimelineStep } from '@/types/contract-review';

interface ProcessTimelineViewProps {
  timeline: ProcessTimelineStep[] | null;
  isLoading: boolean;
  onAcknowledge: (acknowledged: boolean) => void;
  isAcknowledged: boolean;
}

const getRiskColor = (level: string) => {
  switch (level) {
    case 'LOW':
      return 'bg-green-100 text-green-800';
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-800';
    case 'HIGH':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const ProcessTimelineView: React.FC<ProcessTimelineViewProps> = ({
  timeline,
  isLoading,
  onAcknowledge,
  isAcknowledged,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 bg-gray-200 rounded w-full"></div>
        <div className="h-20 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  if (!timeline || timeline.length === 0) {
    return <div className="text-red-600">Garis waktu proyek tidak tersedia</div>;
  }

  return (
    <div className="space-y-6 bg-white rounded-lg p-6 border border-gray-200">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Garis Waktu Pelaksanaan Proyek</h3>
        <p className="text-gray-600">
          Tahap demi tahap pelaksanaan proyek dengan estimasi durasi dan risiko potensial
        </p>
      </div>

      <div className="relative">
        {timeline.map((step, idx) => (
          <div key={step.stepId} className="mb-6">
            <div className="flex gap-4">
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                  {step.sequence}
                </div>
                {idx < timeline.length - 1 && <div className="w-1 h-12 bg-blue-200 mt-2"></div>}
              </div>

              {/* Step content */}
              <div className="flex-1 pb-6">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">{step.stepName}</h4>
                    <span className={`text-xs font-semibold px-3 py-1 rounded ${getRiskColor(step.riskLevel)}`}>
                      {step.riskLevel === 'LOW' && '⚠️ Risiko Rendah'}
                      {step.riskLevel === 'MEDIUM' && '⚠️ Risiko Sedang'}
                      {step.riskLevel === 'HIGH' && '⚠️ Risiko Tinggi'}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{step.description}</p>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="bg-white p-2 rounded border border-gray-200">
                      <p className="text-gray-500 text-xs">Durasi</p>
                      <p className="font-semibold text-gray-900">{step.durationDays} hari</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-gray-200">
                      <p className="text-gray-500 text-xs">Delay Potensial</p>
                      <p className="font-semibold text-orange-600">+{step.potentialDelayDays} hari</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-gray-200">
                      <p className="text-gray-500 text-xs">Total Estimasi</p>
                      <p className="font-semibold text-gray-900">{step.durationDays + step.potentialDelayDays} hari</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-semibold text-gray-900 mb-2">📊 Ringkasan Garis Waktu</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-gray-600">Total Tahapan</p>
            <p className="font-bold text-blue-600">{timeline.length} fase</p>
          </div>
          <div>
            <p className="text-gray-600">Total Durasi Base</p>
            <p className="font-bold text-blue-600">{timeline.reduce((sum, s) => sum + s.durationDays, 0)} hari</p>
          </div>
          <div>
            <p className="text-gray-600">Delay Maksimal</p>
            <p className="font-bold text-orange-600">+{timeline.reduce((sum, s) => sum + s.potentialDelayDays, 0)} hari</p>
          </div>
          <div>
            <p className="text-gray-600">Risiko Terbesar</p>
            <p className="font-bold text-red-600">{Math.max(...timeline.map(s => (s.riskLevel === 'HIGH' ? 3 : s.riskLevel === 'MEDIUM' ? 2 : 1)))} (Tinggi)</p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isAcknowledged}
            onChange={(e) => onAcknowledge(e.target.checked)}
            className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            <strong>Saya telah meninjau garis waktu lengkap</strong> termasuk semua fase, estimasi durasi, dan potensi keterlambatan
          </span>
        </label>
      </div>
    </div>
  );
};
