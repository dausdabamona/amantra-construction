import React, { useState } from 'react';
import { SimulationScenario } from '@/types/contract-review';

interface SimulationViewProps {
  scenarios: SimulationScenario[] | null;
  isLoading: boolean;
  onAcknowledge: (acknowledged: boolean) => void;
  isAcknowledged: boolean;
}

const getScenarioColor = (scenario: string) => {
  switch (scenario) {
    case 'best_case':
      return 'bg-green-50 border-green-300 text-green-900';
    case 'realistic':
      return 'bg-blue-50 border-blue-300 text-blue-900';
    case 'worst_case':
      return 'bg-orange-50 border-orange-300 text-orange-900';
    case 'crisis':
      return 'bg-red-50 border-red-300 text-red-900';
    default:
      return 'bg-gray-50 border-gray-300 text-gray-900';
  }
};

const getScenarioLabel = (scenario: string) => {
  switch (scenario) {
    case 'best_case':
      return '✨ Kasus Terbaik';
    case 'realistic':
      return '📊 Realistis';
    case 'worst_case':
      return '⚠️ Kasus Terburuk';
    case 'crisis':
      return '🔴 Krisis';
    default:
      return scenario;
  }
};

const formatVariance = (variance: number) => {
  if (variance === 0) return 'Tidak ada perubahan';
  if (variance > 0) return `+IDR ${(variance / 1000000000).toFixed(1)}B`;
  return `-IDR ${Math.abs(variance / 1000000000).toFixed(1)}B`;
};

export const SimulationView: React.FC<SimulationViewProps> = ({
  scenarios,
  isLoading,
  onAcknowledge,
  isAcknowledged,
}) => {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(scenarios?.[0]?.scenarioId || null);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 bg-gray-200 rounded w-full"></div>
        <div className="h-32 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  if (!scenarios || scenarios.length === 0) {
    return <div className="text-red-600">Data simulasi tidak tersedia</div>;
  }

  const selectedData = scenarios.find(s => s.scenarioId === selectedScenario);
  const totalProbability = scenarios.reduce((sum, s) => sum + s.probability, 0);

  return (
    <div className="space-y-6 bg-white rounded-lg p-6 border border-gray-200">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Simulasi Skenario & Hasil Finansial</h3>
        <p className="text-gray-600">Analisis berbagai kemungkinan hasil dan dampaknya terhadap anggaran dan timeline proyek</p>
      </div>

      {/* Scenario Selector */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-700">Pilih skenario untuk lihat detail:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {scenarios.map((scenario) => (
            <button
              key={scenario.scenarioId}
              onClick={() => setSelectedScenario(scenario.scenarioId)}
              className={`p-3 rounded-lg border-2 text-left transition ${
                selectedScenario === scenario.scenarioId
                  ? `${getScenarioColor(scenario.scenarioId)} border-current font-semibold`
                  : `${getScenarioColor(scenario.scenarioId)} border-transparent hover:border-current`
              }`}
            >
              <p className="font-semibold">{getScenarioLabel(scenario.scenarioId)}</p>
              <p className="text-sm mt-1">Kemungkinan: {scenario.probability}%</p>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Scenario Details */}
      {selectedData && (
        <div className={`rounded-lg p-6 border-2 ${getScenarioColor(selectedData.scenarioId)}`}>
          <h4 className="text-xl font-bold mb-4">{getScenarioLabel(selectedData.scenarioId)}</h4>

          {/* Outcome Description */}
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Deskripsi Hasil:</p>
              <p className="text-gray-700 leading-relaxed">{selectedData.expectedOutcome}</p>
            </div>

            {/* Financial Impact */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white bg-opacity-50 rounded p-3">
                <p className="text-xs text-gray-600 font-semibold mb-1">Hasil Keuangan</p>
                <p className={`text-lg font-bold ${
                  selectedData.financialOutcome > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  IDR {Math.abs(selectedData.financialOutcome / 1000000000).toFixed(1)}B
                </p>
              </div>

              <div className="bg-white bg-opacity-50 rounded p-3">
                <p className="text-xs text-gray-600 font-semibold mb-1">Probabilitas Terjadi</p>
                <p className="text-lg font-bold text-orange-600">{selectedData.probability}%</p>
                <div className="w-full bg-gray-300 rounded-full h-2 mt-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full"
                    style={{ width: `${selectedData.probability}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Timeline Impact */}
            <div className="bg-white bg-opacity-50 rounded p-3">
              <p className="text-xs text-gray-600 font-semibold mb-2">Dampak Timeline</p>
              <p className="text-gray-700">{selectedData.timelineImpactDays} hari</p>
              <div className="mt-2 p-2 bg-opacity-50 rounded text-sm">
                <span className="font-semibold">Perkiraan Dampak: </span>
                <span>{selectedData.timelineImpactDays > 0 ? '+' : ''}{selectedData.timelineImpactDays} hari dari schedule awal</span>
              </div>
            </div>

            {/* Risk Factors */}
            <div className="bg-white bg-opacity-50 rounded p-3">
              <p className="text-xs text-gray-600 font-semibold mb-2">Asumsi Kunci:</p>
              <ul className="space-y-1">
                {selectedData.assumptions && selectedData.assumptions.map((assumption, idx) => (
                  <li key={idx} className="text-sm text-gray-700">• {assumption}</li>
                ))}
              </ul>
            </div>

            {/* Mitigation for worst/crisis */}
            {(selectedData.scenarioId === 'worst_case' || selectedData.scenarioId === 'crisis') && (
              <div className="bg-yellow-100 border border-yellow-300 rounded p-3">
                <p className="text-xs font-semibold text-yellow-900 mb-2">⚠️ Strategi Mitigasi:</p>
                <p className="text-sm text-yellow-800">Aktivasi rencana kontingensi tingkat tinggi. Hubungi konsultan manajemen risiko. Pertimbangkan modifikasi scope atau timeline.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Probability Distribution */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm font-semibold text-gray-900 mb-3">📊 Distribusi Probabilitas Skenario</p>
        <div className="space-y-2">
          {scenarios.map((scenario) => (
            <div key={scenario.scenarioId}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">{getScenarioLabel(scenario.scenarioId)}</span>
                <span className="text-sm font-bold">{scenario.probability}%</span>
              </div>
              <div className="w-full bg-gray-300 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    scenario.scenarioId === 'best_case'
                      ? 'bg-green-500'
                      : scenario.scenarioId === 'realistic'
                      ? 'bg-blue-500'
                      : scenario.scenarioId === 'worst_case'
                      ? 'bg-orange-500'
                      : 'bg-red-600'
                  }`}
                  style={{ width: `${scenario.probability}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-3">
          Total probabilitas: {totalProbability}% (harus 100%)
        </p>
      </div>

      {/* Expected Value Calculator */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-semibold text-blue-900 mb-3">💡 Nilai Harapan (Expected Value)</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {scenarios.map((scenario) => {
            const ev = (scenario.probability / 100) * scenario.financialOutcome;
            return (
              <div key={scenario.scenarioId} className="bg-white p-2 rounded">
                <p className="text-xs text-gray-600 mb-1">{getScenarioLabel(scenario.scenarioId)}</p>
                <p className={`font-bold ${ev > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {ev > 0 ? '+' : ''}{(ev / 1000000000).toFixed(2)}B
                </p>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Expected outcome = Σ(Probability × Financial Outcome)
        </p>
      </div>

      {/* Acknowledgement */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isAcknowledged}
            onChange={(e) => onAcknowledge(e.target.checked)}
            className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            <strong>Saya telah meninjau semua skenario simulasi</strong> dan memahami kemungkinan hasil finansial serta dampak timeline untuk setiap skenario
          </span>
        </label>
      </div>
    </div>
  );
};
