import React, { useState, useEffect } from 'react';
import { ContractSummary } from '@/types/contract-review';

interface SummaryViewProps {
  summary: ContractSummary | null;
  isLoading: boolean;
  onAcknowledge: (acknowledged: boolean) => void;
  isAcknowledged: boolean;
}

export const SummaryView: React.FC<SummaryViewProps> = ({
  summary,
  isLoading,
  onAcknowledge,
  isAcknowledged,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!summary) {
    return <div className="text-red-600">Ringkasan kontrak tidak tersedia</div>;
  }

  return (
    <div className="space-y-6 bg-white rounded-lg p-6 border border-gray-200">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{summary.title}</h3>
        <p className="text-gray-600">{summary.description}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded">
          <p className="text-sm text-gray-600">Nilai Kontrak</p>
          <p className="text-2xl font-bold text-blue-600">
            IDR {(summary.totalValue / 1000000000).toFixed(1)}B
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded">
          <p className="text-sm text-gray-600">Durasi Proyek</p>
          <p className="text-2xl font-bold text-green-600">{summary.durationDays} hari</p>
        </div>
        <div className="bg-purple-50 p-4 rounded">
          <p className="text-sm text-gray-600">Jumlah Fase</p>
          <p className="text-2xl font-bold text-purple-600">{summary.numberOfTerms}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded">
          <p className="text-sm text-gray-600">Status</p>
          <p className="text-lg font-bold text-orange-600">Perlu Ditinjau</p>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Syarat Utama</h4>
        <ul className="space-y-2">
          {summary.keyTerms.map((term, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">✓</span>
              <span className="text-gray-700">{term}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Tanggung Jawab</h4>
        <ul className="space-y-2">
          {summary.responsibilities.map((resp, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span className="text-gray-700">{resp}</span>
            </li>
          ))}
        </ul>
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
            <strong>Saya telah membaca dan memahami</strong> ringkasan kontrak lengkap termasuk nilai, durasi, dan semua syarat utama
          </span>
        </label>
      </div>
    </div>
  );
};
