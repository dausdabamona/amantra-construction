import React, { useState } from 'react';
import { RiskItem } from '@/types/contract-review';

interface RiskAndConsequenceViewProps {
  risks: RiskItem[] | null;
  isLoading: boolean;
  onAcknowledge: (acknowledged: boolean) => void;
  isAcknowledged: boolean;
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'LOW':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'HIGH':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'CRITICAL':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'LOW':
      return '⚠️';
    case 'MEDIUM':
      return '⚠️⚠️';
    case 'HIGH':
      return '🔴';
    case 'CRITICAL':
      return '⛔';
    default:
      return '•';
  }
};

export const RiskAndConsequenceView: React.FC<RiskAndConsequenceViewProps> = ({
  risks,
  isLoading,
  onAcknowledge,
  isAcknowledged,
}) => {
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 bg-gray-200 rounded w-full"></div>
        <div className="h-24 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  if (!risks || risks.length === 0) {
    return <div className="text-red-600">Analisis risiko tidak tersedia</div>;
  }

  const criticalCount = risks.filter(r => r.severity === 'CRITICAL').length;
  const highCount = risks.filter(r => r.severity === 'HIGH').length;
  const totalFinancialExposure = risks.reduce((sum, r) => sum + r.financialImpact, 0);

  return (
    <div className="space-y-6 bg-white rounded-lg p-6 border border-gray-200">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Analisis Risiko & Konsekuensi</h3>
        <p className="text-gray-600">Identifikasi risiko dengan kemungkinan terjadinya dan dampak finansial potensial</p>
      </div>

      {/* Warning if critical risks */}
      {criticalCount > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-sm font-bold text-red-800">
            ⛔ PERINGATAN: Ada {criticalCount} risiko KRITIS yang perlu perhatian khusus
          </p>
        </div>
      )}

      {/* Risk Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-red-50 p-3 rounded border border-red-200">
          <p className="text-xs text-gray-600">Risiko Kritis</p>
          <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
        </div>
        <div className="bg-orange-50 p-3 rounded border border-orange-200">
          <p className="text-xs text-gray-600">Risiko Tinggi</p>
          <p className="text-2xl font-bold text-orange-600">{highCount}</p>
        </div>
        <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
          <p className="text-xs text-gray-600">Total Risiko</p>
          <p className="text-2xl font-bold text-yellow-600">{risks.length}</p>
        </div>
        <div className="bg-red-50 p-3 rounded border border-red-200">
          <p className="text-xs text-gray-600">Ekspos Finansial</p>
          <p className="text-lg font-bold text-red-600">IDR {(totalFinancialExposure / 1000000000).toFixed(1)}B</p>
        </div>
      </div>

      {/* Risk List */}
      <div className="space-y-3">
        {risks.map((risk) => (
          <div key={risk.riskId} className={`border rounded-lg overflow-hidden ${getSeverityColor(risk.severity)}`}>
            <button
              onClick={() => setExpandedRisk(expandedRisk === risk.riskId ? null : risk.riskId)}
              className="w-full p-4 flex justify-between items-start hover:bg-opacity-70 transition"
            >
              <div className="flex-1 text-left">
                <p className="font-semibold mb-1">
                  {getSeverityIcon(risk.severity)} {risk.description}
                </p>
                <div className="flex gap-4 text-sm">
                  <span>Kemungkinan: {risk.probability}%</span>
                  <span>Dampak: IDR {(risk.financialImpact / 1000000000).toFixed(1)}B</span>
                </div>
              </div>
              <span className="ml-4">{expandedRisk === risk.riskId ? '▼' : '▶'}</span>
            </button>

            {expandedRisk === risk.riskId && (
              <div className="px-4 pb-4 border-t bg-opacity-50">
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Strategi Mitigasi:</p>
                    <p className="text-gray-700 leading-relaxed">{risk.mitigation}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Rencana Kontingensi:</p>
                    <p className="text-gray-700 leading-relaxed">{risk.contingencyPlan}</p>
                  </div>
                  <div className="pt-2 grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-xs text-gray-600">Tingkat Keparahan</p>
                      <p className="font-bold">{risk.severity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Probabilitas</p>
                      <p className="font-bold">{risk.probability}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Exposur Risiko</p>
                      <p className="font-bold">IDR {Math.round((risk.probability / 100) * risk.financialImpact / 1000000)}M</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Overall Risk Assessment */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm font-semibold text-gray-900 mb-2">📊 Penilaian Risiko Keseluruhan</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Rata-rata Probabilitas</p>
            <p className="font-bold text-orange-600">{Math.round(risks.reduce((sum, r) => sum + r.probability, 0) / risks.length)}%</p>
          </div>
          <div>
            <p className="text-gray-600">Total Ekspos (Rata-rata)</p>
            <p className="font-bold text-red-600">IDR {(totalFinancialExposure / risks.length / 1000000000).toFixed(1)}B per risiko</p>
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
            <strong>Saya memahami semua risiko yang teridentifikasi</strong> dan dampak finansial / timeline potensial dari masing-masing risiko ini
          </span>
        </label>
      </div>
    </div>
  );
};
