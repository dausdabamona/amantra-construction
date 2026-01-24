import React from 'react';
import { ContractParameters } from '@/types/contract-review';

interface ContractParametersPanelProps {
  parameters: ContractParameters | null;
  isLoading: boolean;
}

export const ContractParametersPanel: React.FC<ContractParametersPanelProps> = ({
  parameters,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="sticky top-4 bg-white rounded-lg border border-gray-200 p-4 space-y-3 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!parameters) {
    return null;
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateProjectDuration = (startDate: string, endDate: string) => {
    try {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      return days;
    } catch {
      return 0;
    }
  };

  const duration = calculateProjectDuration(parameters.startDate, parameters.completionDate);

  return (
    <div className="sticky top-4 bg-white rounded-lg border-2 border-blue-300 p-5 space-y-4 shadow-md">
      {/* Header */}
      <div className="border-b-2 border-blue-200 pb-3">
        <p className="text-lg font-bold text-gray-900">📋 Parameter Kontrak</p>
        <p className="text-xs text-gray-600 mt-1">Informasi referensi cepat</p>
      </div>

      {/* Contractor Info */}
      <div>
        <p className="text-xs font-semibold text-gray-600 uppercase">Kontraktor</p>
        <p className="text-sm font-bold text-gray-900">{parameters.contractor}</p>
        <p className="text-xs text-gray-600 mt-0.5"></p>
      </div>

      {/* Owner Info */}
      <div>
        <p className="text-xs font-semibold text-gray-600 uppercase">Pemberi Kerja / Pemilik</p>
        <p className="text-sm font-bold text-gray-900">{parameters.projectOwner}</p>
        <p className="text-xs text-gray-600 mt-0.5"></p>
      </div>

      {/* Contract Value */}
      <div className="bg-orange-50 border-l-4 border-orange-400 p-3 rounded">
        <p className="text-xs font-semibold text-orange-700 uppercase">Nilai Kontrak</p>
        <p className="text-lg font-bold text-orange-800 mt-1">
          {formatCurrency(parameters.contractValue)}
        </p>
      </div>

      {/* Timeline */}
      <div>
        <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Timeline Proyek</p>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Mulai:</span>
            <span className="font-semibold text-gray-900">{formatDate(parameters.startDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Selesai:</span>
            <span className="font-semibold text-gray-900">{formatDate(parameters.completionDate)}</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-gray-300">
            <span className="text-gray-600">Durasi:</span>
            <span className="font-bold text-blue-600">{duration} hari</span>
          </div>
        </div>
      </div>

      {/* Contract Terms */}
      <div>
        <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Kondisi Kontrak</p>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Jumlah Term:</span>
            <span className="font-semibold text-gray-900">{parameters.numberOfTerms}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tipe Pembayaran:</span>
            <span className="font-semibold text-blue-600">Milestone-Based</span>
          </div>
        </div>
      </div>

      {/* Jurisdiction */}
      <div>
        <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Yurisdiksi</p>
        <p className="text-sm font-semibold text-gray-900">{parameters.jurisdiction}</p>
        <p className="text-xs text-gray-600 mt-0.5">Hukum: {parameters.governingLaw}</p>
      </div>

      {/* Quick Stats */}
      <div className="bg-blue-50 border border-blue-200 rounded p-3">
        <p className="text-xs font-semibold text-blue-700 uppercase mb-2">Statistik Cepat</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-center p-1 bg-white rounded">
            <p className="text-gray-600">Per Hari</p>
            <p className="font-bold text-blue-600">
              {formatCurrency(parameters.contractValue / duration)}
            </p>
          </div>
          <div className="text-center p-1 bg-white rounded">
            <p className="text-gray-600">Per Term</p>
            <p className="font-bold text-blue-600">
              {formatCurrency(parameters.contractValue / parameters.numberOfTerms)}
            </p>
          </div>
        </div>
      </div>

      {/* Reference Numbers */}
      <div className="bg-gray-50 border border-gray-200 rounded p-3">
        <p className="text-xs font-semibold text-gray-700 uppercase mb-2">Mata Uang & Yurisdiksi</p>
        <div className="space-y-1 text-xs text-gray-600">
          <p>
            <span className="text-gray-500">Mata Uang:</span> {parameters.currency}
          </p>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="border-t-2 border-gray-200 pt-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
          <p className="text-xs text-gray-600">
            <span className="font-semibold">Status:</span> Review Berlangsung
          </p>
        </div>
      </div>

      {/* Export Notice */}
      <div className="bg-purple-50 border border-purple-200 rounded p-2 text-xs text-center text-purple-700">
        <p>Panel ini tetap terlihat saat Anda meninjau kontrak</p>
      </div>
    </div>
  );
};
